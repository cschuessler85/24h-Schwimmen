from flask import Flask, jsonify, send_from_directory
import random
from datetime import datetime

app = Flask(__name__, static_folder="static")

vornamen = ["Luca", "Emma", "Ben", "Mia", "Noah", "Lea", "Elias", "Lina"]
nachnamen = ["Schmidt", "Müller", "Weber", "Schneider", "Fischer", "Meyer", "Wagner"]
gruppen = ["A", "B", "C", "D"]


@app.route("/")
def startseite():
    return send_from_directory(app.static_folder, "view.html")

@app.route('/api/daten')
def daten():
    swimmerMap = {
        i: {
            "nummer": i,
            "vorname": random.choice(vornamen),
            "nachname": random.choice(nachnamen),
            "gruppe": random.choice(gruppen),
            "istKind": random.random() < 0.3,
            "bahnanzahl": random.randint(0, 100)
        }
        for i in range(1, 151)
    }

    lapLog = [
        {
            "schwimmer": random.randint(1, 150),
            "zeit": datetime.now().isoformat()
        }
        for _ in range(20)
    ]

    filter_obj = {
        "gruppe": random.choice(gruppen),
        "nurKinder": random.choice([True, False])
    }

    return jsonify({
        "swimmerMap": swimmerMap,
        "lapLog": lapLog,
        "filter": filter_obj
    })

if __name__ == '__main__':
    app.run(debug=True)
