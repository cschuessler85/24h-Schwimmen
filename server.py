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
if getattr(sys, 'frozen', False):  # Ausgeführt als .exe (gefrorener Zustand)
    base_path = os.path.dirname(sys.executable)
else:   # Ausgeführt als .py
    base_path = os.path.dirname(os.path.abspath(__file__))

config_path = os.path.join(base_path, 'config.json')
try:
    with open(config_path, encoding="utf-8") as f:
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
        benutzername = request.form.get('benutzername', '').lower()
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
        logging.info(f"admin-POST-request mit Daten: {data}")

        if action == 'create_user':
            # Benutzer erstellen
            print(data)
            realname = data.get('realname', '').strip()
            username = data.get('username', '').strip()
            password = data.get('password', '')
            username = username.lower()

            if not re.fullmatch(r"[A-Za-zÄÖÜäöüß\s]+", realname):
                logging.error(f"Versuch Benutzer mit ungültigem Real-Namen anzulegen {realname}")
                return "Ungültiger Name", 400
            if not re.fullmatch(r"[A-Za-z0-9]+", username):
                return "Ungültiger Benutzername", 400
            if len(password) < 3:
                return "Passwort zu kurz", 400
            if db.finde_benutzer_by_username(username):
                return "Benutzer existiert bereits"

            db.erstelle_benutzer(realname, username, password, admin=data.get('admin',False))
            return "Benutzer erstellt"
        elif action == 'new_passwort':
            benutzername = request.form.get('benutzername')
            new_pass = request.form.get('new_pass')
            db.passwort_ändern(benutzername, new_pass)
        elif action == 'delete_user':
            benutzername = request.form.get('benutzername')
            benutzername = benutzername.lower()
            if benutzername:
                db.loesche_benutzername(benutzername)
            else:
                return "Kein Benutzername angegeben", 400
        elif action == 'delete_swimmer':
            logging.info("Action delete_swimmer")
            nummer = data.get('nummer')
            if nummer:
                if (not db.loesche_schwimmer(nummer)):
                    return "DB - Fehler", 400
                return "Erfolg", 200
            else:
                return "Keine Schwimmernummer angegeben", 400
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
            return jsonify(db.liste_tabelle('actions')), 200
        elif action == 'import_schwimmer':
            schwimmer_liste = data.get("data", [])
            logging.info(f"Schwimmer werden importiert - Daten enthalten {len(schwimmer_liste)} Schwimmer")
            if not isinstance(schwimmer_liste, list):
                return jsonify({"error": "Datenformat ungültig"}), 400

            # Beispiel: Daten durchgehen und validieren
            validierte = []
            for s in schwimmer_liste:
                nummer = s.get("nummer")
                name = s.get("name")
                geschlecht = s.get("geschlecht", "")
                if not nummer or not name:
                    continue  # überspringen wenn Pflichtfelder fehlen
                if (db.insertOrUpdateSchwimmer(nummer, erstellt_von_client_id = session['clientID'], name = name)):
                    validierte.append({
                        "nummer": nummer,
                        "name": name,
                        "geschlecht": geschlecht,
                        # ggf. weitere Felder übernehmen
                    })

            logging.info(f"Importiert wurden {len(validierte)} Schwimmer")

            return jsonify({"status": "ok", "importiert": len(validierte)}), 200
        elif action:
            return f"Unknown Action {action}", 400

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

@app.route("/main.js")
def send_mainjs():
    params = {
        'schwimmerNrLen': config["laenge_schwimmerNr"]
    }
    return render_template("main.js", **params), 200, {'Content-Type': 'application/javascript'}

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory("static", filename)

@app.route("/action", methods=["POST"])
def action():
    try:
        clientid = session.get("clientID",-1)
        user = session.get("user","unknown")
        actions = request.get_json()
        print("Empfangene Actions:", actions)

        results = []
        updates = []

        for action in actions:
            kommando = action.get("kommando")
            parameter = action.get("parameter")
            timestamp = action.get("timestamp")

            
            if kommando == "ADD":
                # ADD - Action muss dokumentiert werden
                db.erstelle_action(user, client_id=clientid, zeitstempel=str(timestamp), kommando=str(kommando), parameter=json.dumps(parameter))
                try:
                    nummer = int(parameter[0])
                    anzahl = int(parameter[1])
                    bahnnr = int(parameter[2]) if len(parameter) > 2 else 0
                    logging.info(f"ADD ausgeführt: Schwimmer {nummer}, Anzahl {anzahl}, BahnNr {bahnnr}")
                    db.aendere_bahnanzahl_um(nummer,anzahl,clientid,bahnnr=bahnnr)
                    results.append({"kommando": kommando, "status": "erfolgreich", "nummer": nummer, "anzahl": anzahl})
                    updates.append(db.lies_schwimmer(nummer))
                except (ValueError, IndexError) as e:
                    logging.info(f"Fehler bei ADD-Parametern: {e}")
                    results.append({"kommando": kommando, "status": f"ungültige Parameter: {str(e)}"})
            elif kommando == "GETB":
                try:
                    logging.info(f"Schwimmer der Bahnen {parameter} werden von Nutzer:{user} und Client-ID: {clientid} abgerufen")
                    for bahnnr in parameter:
                        updates.extend(db.lies_schwimmer_vonBahn(bahnnr))
                    results.append({"kommando": kommando, "status": "erfolgreich", "bahnen": parameter})
                    
                except (ValueError, IndexError) as e:
                    logging.info(f"Fehler bei GETB-Parametern: {e}")
                    results.append({"kommando": kommando, "status": f"ungültige Parameter: {str(e)}"})
            elif kommando == "GET":
                logging.info(f"Tabelle schwimmer wird von Nutzer:{user} und Client-ID: {clientid} abgerufen")
                #print(db.liste_tabelle('schwimmer'))
                if parameter == []:
                    updates = db.liste_tabelle('schwimmer')
                else:
                    nummer = int(parameter[0])
                    updates = [db.lies_schwimmer(nummer)]
            elif kommando == "ACT":
                try:
                    nummer = int(parameter[0])
                    value = int(parameter[1])
                    logging.info(f"ACT ausgeführt: Schwimmer {nummer} wird {value}")
                    if (db.update_schwimmer(nummer,aktiv = value)):
                        results.append({"kommando": kommando, "status": "erfolgreich", "nummer": nummer, "value": value})
                    else: 
                        results.append({"kommando": kommando, "status": "FEHLER", "nummer": nummer, "value": value})
                except (ValueError, IndexError) as e:
                    logging.info(f"Fehler bei ACT-Parametern: {e}")
                    results.append({"kommando": kommando, "status": f"ungültige Parameter: {str(e)}"})
            else:
                logging.debug(f"Unbekanntes Kommando: {kommando}")
                print(f"Unbekanntes Kommando: {kommando}")

        return jsonify({"results": results, "updates": updates}), 200

    except Exception as e:
        print(f"Fehler beim Verarbeiten der Actions: {e}")
        return "Fehler", 400

def run_server(reloader = False):
    app.run(host="0.0.0.0", port=8080, threaded=False, use_reloader=reloader)
    #app.run(ssl_context=('cert.pem', 'key.pem'), debug=True)

if __name__ == "__main__":
    run_server(True) #Reloader aktivieren - lädt Flask bei Dateiänderungen neu - super für Testmodus
    
