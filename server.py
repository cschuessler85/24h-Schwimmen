import socket
import os
import json
import db
from datetime import datetime
import logging
from flask import Flask, request, jsonify, send_from_directory
from logging_config import configure_logging

# Konfiguration des Loggings
configure_logging()

# Logger verwenden
logger = logging.getLogger()

app = Flask(__name__, static_folder="static")

# Dateien sicherstellen
os.makedirs("data", exist_ok=True)
for name in ["verlauf.json", "data.json"]:
    path = f"data/{name}"
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            f.write("[]")

def addVersion(new, dateipfad="data/verlauf.json"):
    try:
        with open(dateipfad, "r", encoding="utf-8") as f:
            daten = json.load(f)
    except:
        daten = []
    daten.append({"Zeit": datetime.now().strftime("%H:%M:%S"), "Data": new})
    with open(dateipfad, "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, indent=4)

@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

@app.route("/daten")
def daten():
    try:
        with open("data/data.json", "r", encoding="utf-8") as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])

@app.route("/senden", methods=["POST"])
def senden():
    neue_daten = request.get_json()
    try:
        with open("data/data.json", "r", encoding="utf-8") as f:
            bestehende = json.load(f)
    except:
        bestehende = []

    for neuer in neue_daten:
        nummer = neuer["Nummer"]
        bahnen = int(neuer["Bahnen"])
        abwesend = neuer.get("Abwesend", False)
        for item in bestehende:
            if item["Nummer"] == nummer:
                item.update({"Bahnen": bahnen, "Abwesend": abwesend})
                break
        else:
            bestehende.append({"Nummer": nummer, "Bahnen": bahnen, "Abwesend": abwesend})

    with open("data/data.json", "w", encoding="utf-8") as f:
        json.dump(bestehende, f, ensure_ascii=False, indent=4)

    addVersion(bestehende)
    return "Daten empfangen", 200

@app.route("/action", methods=["POST"])
def action():
    print("Clientdaten:", request.get_data(as_text=True))
    return "OK", 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
