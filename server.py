import os, sys
import re #Regular Expressions
import json
import db
from datetime import datetime
import logging
from flask import Flask, request, jsonify, send_from_directory, redirect, url_for, session, render_template_string, render_template
from logging_config import configure_logging
from utils import generiere_passwort
from werkzeug.security import check_password_hash


# Konfiguration des Loggings
configure_logging()

# Logger verwenden
logger = logging.getLogger()

# Konfiguration laden
try:
    with open("config.json", encoding="utf-8") as f:
        config =json.load(f)
        logger.info("Konfiguration geladen")
except json.JSONDecodeError as e:
    print(f"Fehler beim JSON-Decode der Konfiguration: {e}")
    logger.error(f"Fehler beim JSON-Decode der Konfiguration: {e}")
    sys.exit(0)
except Exception as e:
    print("Fehler beim lesen der Konfiguration")
    logger.error("allgemeiner Fehler beim lesen der Konfiguration")
    sys.exit(0)


app = Flask(__name__, static_folder="static", template_folder="flask_templates")
app.secret_key = config["flask_secret_key"]  # nötig für Sessions
if not app.secret_key:
    print("Fehler: 'flask_secret_key' fehlt in der config.json.")
    logger.error("Fehler: 'flask secret_key' fehlt in der config.json.")
    sys.exit(1)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['DEBUG'] = True

# Benutzer admin prüfen
if not db.finde_benutzer_by_username("admin"):
    passwort = config["default_admin_pass"]
    if not passwort:
        passwort = generiere_passwort();

    print(f"Benutzer 'admin' wird angelegt mit passwort: {passwort}")
    db.erstelle_benutzer("Administrator", "admin", passwort, admin=True)



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

# Immer prüfen, ob der Benutzer angemeldet ist
# bzw. zur Login-Seite durchlassen
@app.before_request
def before_request():
    # Überprüfen, ob der Benutzer authentifiziert ist
    if 'user' not in session and request.endpoint != 'login':
        return redirect(url_for('login'))  # Wenn der Benutzer nicht eingeloggt ist, zur Login-Seite weiterleiten

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        benutzername = request.form['benutzername']
        passwort = request.form['passwort']

        # Benutzerdaten aus der Datenbank holen
        benutzer = db.finde_benutzer_by_username(benutzername)
        
        if benutzer and check_password_hash(benutzer['passwort'], passwort):  # Passwort prüfen (angenommen, es ist gehasht)
            # Erfolgreich eingeloggt, Benutzer zur Hauptseite weiterleiten
            session['user'] = benutzername  # Benutzername in der Session speichern
            session['realname'] = benutzer['name']
            session['clientID'] = db.erstelle_client(request.remote_addr,benutzer['id']) #Speichere die ClientID in der Session
            if benutzer['admin']:
                logging.info(f"Admin-Benutzer {benutzername} angemeldet")
                session['user_role']='admin'
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error=True)  # Login-Seite anzeigen
            #return 'Falscher Benutzername oder Passwort', 401  # Fehler bei der Anmeldung

    return render_template('login.html')  # Login-Seite anzeigen

@app.route("/logout", methods=['GET', 'POST'])
def logout():
    #session.pop("user", None)
    session.clear() # alle infos löschen
    return redirect(url_for("login"))

#****************************
#  Admin-Angelegenheiten
#****************************
@app.route('/admin', methods=['GET', 'POST'])
def admin():
    if session.get('user_role') != 'admin':
        return "Zugriff verweigert", 403

    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        action = data.get('action')

        if action == 'create_user':
            # Benutzer erstellen
            print(data)
            realname = data.get('realname', '').strip()
            username = data.get('username', '').strip()
            password = data.get('password', '')

            if not re.fullmatch(r"[A-Za-zÄÖÜäöüß\s]+", realname):
                logging.error(f"Versuch Benutzer mit ungültigem Real-Namen anzulegen {realname}")
                return "Ungültiger Name", 400
            if not re.fullmatch(r"[A-Za-z0-9]+", username):
                return "Ungültiger Benutzername", 400
            if len(password) < 3:
                return "Passwort zu kurz", 400

            db.erstelle_benutzer(realname, username, password, admin=data.get('admin',False))
            return "Benutzer erstellt"

        elif action == 'delete_user':
            # Benutzer löschen
            pass
            return "Benutzer gelöscht"
        elif action == 'get_table_benutzer':
            return jsonify(db.liste_tabelle('benutzer'))
        elif action == 'get_table_clients':
            logging.info("Tabelle clients wird abgerufen")
            #print(db.liste_tabelle('clients'))
            return jsonify(db.liste_tabelle('clients'))
        elif action == 'get_table_swimmer':
            logging.info("Tabelle swimmer wird abgerufen")
            #print(db.liste_tabelle('schwimmer'))
            return jsonify(db.liste_tabelle('schwimmer'))
        elif action == 'get_table_actions':
            logging.info("Tabelle actions wird abgerufen")
            #print(db.liste_tabelle('schwimmer'))
            return jsonify(db.liste_tabelle('actions'))
        # usw.

    params = {
        'user_role': session.get('user_role',""),
        'userrealname': session.get('realname',"Unbekannt"),
        'username': session.get('user',"unknown"),
        'clientID': session.get('clientID',"--")
    }
    return render_template('admin.html',**params)


@app.route("/")
def index():
    #return send_from_directory("static", "index.html")
    params = {
        'user_role': session.get('user_role',""),
        'userrealname': session.get('realname',"Unbekannt"),
        'username': session.get('user',"unknown"),
        'clientID': session.get('clientID',"--")
    }
    return render_template("index.html", **params)

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
    try:
        clientid = session.get("clientID",-1)
        user = session.get("user","unknown")
        actions = request.get_json()
        print("Empfangene Actions:", actions)

        results = []

        for action in actions:
            kommando = action.get("kommando")
            parameter = action.get("parameter")
            timestamp = action.get("timestamp")

            db.erstelle_action(user, client_id=clientid, zeitstempel=str(timestamp), kommando=str(kommando), parameter=json.dumps(parameter))

            if kommando == "ADD":
                try:
                    nummer = int(parameter[0])
                    anzahl = int(parameter[1])
                    print(f"ADD ausgeführt: Schwimmer {nummer}, Anzahl {anzahl}")
                    db.aendere_bahnanzahl_um(nummer,anzahl,clientid)
                    results.append({"kommando": kommando, "status": "erfolgreich", "nummer": nummer, "anzahl": anzahl})
                except (ValueError, IndexError) as e:
                    print(f"Fehler bei ADD-Parametern: {e}")
                    results.append({"kommando": kommando, "status": f"ungültige Parameter: {str(e)}"})
            elif kommando == "REMOVE":
                print(f"REMOVE ausgeführt mit Parametern: {parameter}")
                # Logik für REMOVE
            elif kommando == "UPDATE":
                print(f"UPDATE ausgeführt mit Parametern: {parameter}")
                # Logik für UPDATE
            else:
                print(f"Unbekanntes Kommando: {kommando}")

        return "OK", 200

    except Exception as e:
        print(f"Fehler beim Verarbeiten der Actions: {e}")
        return "Fehler", 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, threaded=False)
    #app.run(ssl_context=('cert.pem', 'key.pem'), debug=True)
