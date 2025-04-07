from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)
data_store = {}  # Speichert die Anzahl pro Name

@app.route("/")
def index():
    return send_from_directory("", "index.html")  # Gibt die HTML-Seite zurück

@app.route("/send", methods=["POST"])
def receive_data():
    req_data = request.json
    name = req_data.get("name")
    number = req_data.get("number")

    if name and isinstance(number, int):
        data_store[name] = data_store.get(name, 0) + number
        return jsonify({"status": "ok", "total": data_store[name]})
    return jsonify({"status": "error", "message": "Invalid data"}), 400

@app.route("/count/<name>", methods=["GET"])
def get_count(name):
    count = data_store.get(name, 0)
    return jsonify({"name": name, "total": count})

if __name__ == "__main__":
    app.run(debug=True)
