import sqlite3
import atexit
import random
from datetime import datetime
import logging
from logging_config import configure_logging
from werkzeug.security import generate_password_hash, check_password_hash


# Konfiguration des Loggings
configure_logging()

# Logger verwenden
logger = logging.getLogger()

DB_NAME = "data.sqlite"

class Database:
    def __init__(self, db_name=DB_NAME):
        """
        Initialisiert die Datenbankverbindung. 
        Wird einmalig beim Start der Anwendung aufgerufen.
        """
        self.db_name = db_name
        self.conn = None
        self.cursor = None
        self.connect()  # Verbindung herstellen

    def connect(self):
        """
        Stellt die Verbindung zur SQLite-Datenbank her.
        """
        try:
            #TODO: Darüber nachdenken, wie man same thread-Problematik dauerhaft löst
            self.conn = sqlite3.connect(self.db_name, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row  # Für dict-ähnliche Zeilen
            self.cursor = self.conn.cursor()
            logging.info("Database.connect - Datenbankverbindung hergestellt.")
        except sqlite3.DatabaseError as e:
            logging.error(f"Database.connect - Fehler beim Verbinden zur Datenbank: {e}")
            self.conn = None
            self.cursor = None

    def execute(self, query, params=None):
        """
        Führt eine SQL-Abfrage aus und behandelt Verbindungsfehler.
        """
        if self.conn is None:
            logging.error("Database execute: Keine Datenbankverbindung. Versuche Wiederverbindung.")
            logging.debug(f"Query: {query}, params:{params}")
            self.connect()  # Versuche erneut, die Verbindung herzustellen
            
            if self.conn is None:
                logging.error("Datenbankverbindung konnte nicht wiederhergestellt werden.")
                return
        
        try:
            if params is None:
                params = []
            self.cursor.execute(query, params)
            self.conn.commit()
        except sqlite3.OperationalError as e:
            logging.error(f"OperationalError: {e}")
            logging.debug(f"execute - query: {query}, params: {params}")
        except sqlite3.IntegrityError as e:
            logging.error(f"Integritätsfehler: {e}")    
            logging.debug(f"execute - query: {query}, params: {params}")
        except sqlite3.DatabaseError as e:
            logging.error(f"Fehler bei der SQL-Abfrage: {e}")
            logging.debug(f"execute - query: {query}, params: {params}")
            self.conn = None
            self.cursor = None  # Setze den Cursor auf None, damit bei der nächsten Abfrage ein Fehler festgestellt wird

    def fetchall(self, query, params=None):
        """
        Holt alle Ergebnisse einer SELECT-Abfrage und behandelt Verbindungsfehler.
        """
        if self.conn is None:
            logging.error("Keine Datenbankverbindung. Versuche Wiederverbindung.")
            logging.debug(f"fetchall - query: {query}, params: {params}")
            self.connect()  # Versuche erneut, die Verbindung herzustellen
            
            if self.conn is None:
                logging.error("Datenbankverbindung konnte nicht wiederhergestellt werden.")
                return []
        
        try:
            if params is None:
                params = []
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
        except sqlite3.DatabaseError as e:
            logging.error(f"Fehler bei der SQL-Abfrage: {e}")
            logging.debug(f"fetchall - query: {query}, params: {params}")
            self.conn = None
            self.cursor = None
            return []

    def fetchone(self, query, params=None):
        """
        Holt ein einzelnes Ergebnis einer SELECT-Abfrage und behandelt Verbindungsfehler.
        """
        if self.conn is None:
            logging.error("Keine Datenbankverbindung. Versuche Wiederverbindung.")
            logging.debug(f"fetchone - query: {query}, params: {params}")
            self.connect()  # Versuche erneut, die Verbindung herzustellen
            
            if self.conn is None:
                logging.error("Datenbankverbindung konnte nicht wiederhergestellt werden.")
                return None
        
        try:
            if params is None:
                params = []
            self.cursor.execute(query, params)
            return self.cursor.fetchone()
        except sqlite3.DatabaseError as e:
            logging.error(f"Fehler bei der SQL-Abfrage: {e}")
            self.conn = None
            self.cursor = None
            return None

    def close(self):
        """
        Schließt die Datenbankverbindung.
        """
        if self.conn:
            self.conn.close()
            logging.info("Datenbankverbindung geschlossen.")

# Globale Instanz der Database-Klasse
db = Database()

# Automatisch beim Programmende die Verbindung schließen
atexit.register(db.close)

# ===================================================
# DATENBANK-INITIALISIERUNG UND ALLGEMEINE METHODEN
# ===================================================
"""
Initialisiert die SQLite-Datenbank mit den Tabellen:
- Benutzer
- Clients
- Actions
- Schwimmer

liste_tabelle
dict_from_row-Methode
"""

def init_db():
    """
    Initialisiert die Datenbank und erstellt alle notwendigen Tabellen, falls sie noch nicht existieren.
    """
    # Tabellen erstellen
    query_benutzer = '''
        CREATE TABLE IF NOT EXISTS benutzer (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            benutzername TEXT UNIQUE NOT NULL,
            passwort TEXT NOT NULL,
            admin BOOLEAN NOT NULL DEFAULT 0
        )
    '''
    db.execute(query_benutzer)

    query_clients = '''
        CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT NOT NULL,
            benutzer_id INTEGER,
            zeitpunkt_letzte_aktion TEXT,
            FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
        )
    '''
    db.execute(query_clients)

    query_schwimmer = '''
        CREATE TABLE IF NOT EXISTS schwimmer (
            nummer INTEGER NOT NULL,
            erstellt_von_client_id INTEGER,
            name TEXT,
            bahnanzahl INTEGER,
            strecke INTEGER,
            auf_bahn INTEGER,
            avg_roundtime INTEGER, 
            aktiv BOOLEAN,
            FOREIGN KEY (erstellt_von_client_id) REFERENCES clients(id),
            CONSTRAINT unique_schwimmer UNIQUE (nummer, erstellt_von_client_id)
        )
    '''
    db.execute(query_schwimmer)

    query_actions = '''
        CREATE TABLE IF NOT EXISTS actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            benutzer_id INTEGER,
            client_id INTEGER,
            zeitstempel TEXT,
            kommando TEXT,
            parameter TEXT,
            FOREIGN KEY (benutzer_id) REFERENCES benutzer(id),
            FOREIGN KEY (client_id) REFERENCES clients(id)
        )
    '''
    db.execute(query_actions)

init_db()

def dict_from_row(row, table_name):
    """
    Wandelt eine Datenbankzeile (Tupel) in ein Dictionary um.
    """
    if table_name == 'benutzer':
        columns = ['id', 'name', 'benutzername', 'passwort', 'admin']
    elif table_name == 'clients':
        columns = ['id', 'ip', 'benutzer_id', 'zeitpunkt_letzte_aktion']
    elif table_name == 'schwimmer':
        columns = ['nummer', 'erstellt_von_client_id', 'name', 'bahnanzahl', 'strecke', 'auf_bahn', 'aktiv']
    elif table_name == 'actions':
        columns = ['id', 'benutzer_id', 'client_id', 'zeitstempel', 'kommando', 'parameter']
    else:
        return None
    return dict(zip(columns, row))

def liste_tabelle(table_name):
    """
    Gibt eine Liste aller Einträge aus der angegebenen Tabelle zurück.
    Wenn der Tabellenname ungültig ist, wird eine leere Liste zurückgegeben.
    """
    # Gültige Tabellen
    valid_tables = ['benutzer', 'clients', 'schwimmer', 'actions']
    
    # Überprüfen, ob der angegebene Tabellenname gültig ist
    if table_name not in valid_tables:
        return []

    # Dynamische SQL-Abfrage erstellen, um alle Einträge aus der angegebenen Tabelle zu holen
    query = f'SELECT * FROM {table_name}'
    
    # Datenbankabfrage ausführen
    rows = db.fetchall(query)
    
    # Die Zeilen in Dictionaries umwandeln und zurückgeben
    return [dict_from_row(r, table_name) for r in rows]



# =======================================
# SCHWIMMER-VERWALTUNG
# =======================================
"""
Funktionen zur Verwaltung von Schwimmern:
- Schwimmer erstellen
- Schwimmer suchen
- Schwimmer aktualisieren
- Schwimmer Bahnanzahl ändern
"""

# Sucht einen Schwimmer anhand seines Namens
def finde_schwimmer(name):
    """
    Sucht einen Schwimmer anhand seines Namens.
    """
    query = "SELECT * FROM schwimmer WHERE name = ?"
    params = (name,)
    return dict_from_row(db.fetchone(query, params),"schwimmer")


# Liest einen Schwimmer anhand seiner ID aus der Datenbank
def lies_schwimmer(schwimmer_id):
    """
    Liest einen Schwimmer anhand seiner ID aus der Datenbank.
    """
    query = "SELECT * FROM schwimmer WHERE nummer = ?"
    params = (schwimmer_id,)
    return dict_from_row(db.fetchone(query, params),"schwimmer")


# Aktualisiert Felder eines Schwimmers anhand der ID
# Die zu aktualisierenden Felder werden dynamisch übergeben, z. B.:
# update_schwimmer(1, bahnanzahl=5, aktiv=0)
# Das funktioniert durch **kwargs, womit beliebige Schlüssel-Wert-Paare übergeben werden können.
def update_schwimmer(schwimmer_id, **kwargs):
    """
    Aktualisiert Felder eines Schwimmers anhand der ID.
    Die zu aktualisierenden Felder werden dynamisch übergeben, z. B.:
    update_schwimmer(1, bahnanzahl=5, aktiv=0)
    Das funktioniert durch **kwargs, womit beliebige Schlüssel-Wert-Paare übergeben werden können.
    """
    # Baut dynamisch das SET-Statement für SQL, z. B. "bahnanzahl=?, aktiv=?"
    keys = ', '.join([f"{k}=?" for k in kwargs])
    values = list(kwargs.values()) + [schwimmer_id]
    query = f"UPDATE schwimmer SET {keys} WHERE nummer = ?"
    db.execute(query, values)

# Legt einen neuen Schwimmer in der Datenbank an und gibt die neue ID zurück
def erstelle_schwimmer(nummer, erstellt_von_client_id, name, bahnanzahl, strecke, auf_bahn, avg_roundtime, aktiv):
    """
    Legt einen neuen Schwimmer in der Datenbank an und gibt die neue ID zurück.
    """
    query = """
        INSERT INTO schwimmer (nummer, erstellt_von_client_id, name, bahnanzahl, strecke, auf_bahn, avg_roundtime, aktiv)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """
    params = (nummer, erstellt_von_client_id, name, bahnanzahl, strecke, auf_bahn, avg_roundtime, aktiv)
    return db.execute(query, params)

def aendere_bahnanzahl_um(nummer, anzahl, client_id, bahnnr=0):
    """
    Ändert die Bahnanzahl eines Schwimmers. 
    Falls der Schwimmer nicht existiert, wird er mit Standardwerten angelegt.
    """
    schwimmer = lies_schwimmer(nummer)
    logging.debug("Schwimmer Ändern")
    print(schwimmer if (schwimmer) else f"Schwimmer {nummer} Nicht gefunden")
    
    if schwimmer is None:
        # Schwimmer existiert nicht → neu anlegen
        erstelle_schwimmer(
            nummer=nummer,
            erstellt_von_client_id=client_id,
            name=f"Schwimmer {nummer}",
            bahnanzahl=max(anzahl, 0),
            strecke=0,
            auf_bahn=bahnnr,
            avg_roundtime=0,
            aktiv=1
        )
    else:
        # Schwimmer existiert → Bahnanzahl ändern
        neue_bahnanzahl = (schwimmer["bahnanzahl"] or 0) + anzahl
        if neue_bahnanzahl < 0:
            neue_bahnanzahl = 0
        update_schwimmer(schwimmer["nummer"], bahnanzahl=neue_bahnanzahl, auf_bahn=bahnnr)



#========================
#    Abschnitt: Clients
#======================== 

def erstelle_client(ip, benutzer_id=None):
    """
    Fügt einen neuen Client in die Datenbank ein.

    Parameter:
    - ip (str): IP-Adresse des Clients
    - benutzer_id (int, optional): ID des zugeordneten Benutzers, kann None sein
    """
    logger.debug(f"Client mit IP {ip} und benutzer_id {benutzer_id} wird erstellt")
    query = '''
        INSERT INTO clients (ip, benutzer_id, zeitpunkt_letzte_aktion)
        VALUES (?, ?, ?)
    '''
    params = (ip, benutzer_id, datetime.now().isoformat())
    db.execute(query, params)
    #print("LASTID:",db.cursor.lastrowid)
    return db.cursor.lastrowid

def finde_client(ip):
    """
    Sucht einen Client anhand seiner IP-Adresse.
    """
    query = 'SELECT * FROM clients WHERE ip = ?'
    params = (ip,)
    client = dict(db.fetchone(query, params))
    return client


def update_client_aktion(client_id):
    """
    Aktualisiert den Zeitstempel der letzten Aktion eines Clients.
    """
    query = 'UPDATE clients SET zeitpunkt_letzte_aktion = ? WHERE id = ?'
    params = (datetime.now().isoformat(), client_id)
    db.execute(query, params)

#========================
#    Abschnitt: Benutzer
#======================== 

def erstelle_benutzer(name, benutzername, passwort, admin=False):
    """
    Fügt einen neuen Benutzer zur Datenbank hinzu.
    Gibt die ID des neuen Benutzers zurück.
    """
    query = '''
        INSERT INTO benutzer (name, benutzername, passwort, admin)
        VALUES (?, ?, ?, ?)
    '''
    params = (name, benutzername, generate_password_hash(passwort), int(admin))
    return db.execute(query, params)


def finde_benutzer_by_username(benutzername):
    """
    Gibt einen Benutzer als Dictionary zurück, der dem Benutzernamen entspricht.
    """
    query = 'SELECT * FROM benutzer WHERE benutzername = ?'
    params = (benutzername,)
    row = db.fetchone(query, params)
    return dict_from_row(row,'benutzer') if row else None

#========================
#    Abschnitt: Actions
#======================== 

def erstelle_action(benutzer_id, client_id, zeitstempel, kommando, parameter):
    """
    Fügt eine neue Action zur Datenbank hinzu.
    Gibt die ID der neuen Action zurück.
    """
    query = '''
        INSERT INTO actions (benutzer_id, client_id, zeitstempel, kommando, parameter)
        VALUES (?, ?, ?, ?, ?)
    '''
    params = (benutzer_id, client_id, zeitstempel, kommando, parameter)
    return db.execute(query, params)

def finde_actions_by_benutzer_id(benutzer_id):
    """
    Gibt eine Liste aller Actions zurück, die dem Benutzer mit der gegebenen ID entsprechen.
    """
    query = 'SELECT * FROM actions WHERE benutzer_id = ?'
    params = (benutzer_id,)
    rows = db.fetchall(query, params)
    return [dict_from_row(row, 'actions') for row in rows]

def finde_actions_by_client_id(client_id):
    """
    Gibt eine Liste aller Actions zurück, die dem Client mit der gegebenen ID entsprechen.
    """
    query = 'SELECT * FROM actions WHERE client_id = ?'
    params = (client_id,)
    rows = db.fetchall(query, params)
    return [dict_from_row(row, 'actions') for row in rows]

def finde_action_by_id(action_id):
    """
    Gibt die Action mit der gegebenen ID zurück.
    """
    query = 'SELECT * FROM actions WHERE id = ?'
    params = (action_id,)
    row = db.fetchone(query, params)
    return dict_from_row(row, 'actions') if row else None

def finde_actions_after_timestamp(timestamp):
    """
    Gibt alle Actions zurück, die nach dem angegebenen Zeitstempel stattgefunden haben.
    """
    query = 'SELECT * FROM actions WHERE zeitstempel > ?'
    params = (timestamp,)
    rows = db.fetchall(query, params)
    return [dict_from_row(row, 'actions') for row in rows]


#========================
#    Testabschnitt
#======================== 


if __name__ == "__main__":
    # Setze den DB-Namen auf eine Testdatenbank
    DB_NAME = "testdata.sqlite"

    # Erstelle ein neues Database-Objekt mit der Test-Datenbank
    db = Database(DB_NAME)

    # Teste die Methoden
    print("Test der Methoden in der Testdatenbank:")
    
    # Initialisiere die Datenbank (wird Tabellen erstellen)
    init_db()

    # Beispiel: Benutzer hinzufügen und abfragen
    print("\nHinzufügen eines neuen Benutzers...")
    erstelle_benutzer("Test User", f"testuser{random.randint(10,99)}", "password123", admin=False)
    benutzer = liste_tabelle('benutzer')
    print(f"Benutzer in der Datenbank: {benutzer}")

    # Beispiel: Client hinzufügen und abfragen
    print("\nHinzufügen eines neuen Clients...")
    erstelle_client("192.168.1.1", 1)
    clients = finde_client("192.168.1.1")
    print(f"Clients in der Datenbank: {clients}")

    # Beispiel: Schwimmer hinzufügen und abfragen
    print("\nHinzufügen eines neuen Schwimmers...")
    erstelle_schwimmer(random.randint(50,800), random.randint(0,4), "Max Mustermann", 3, 400, 1, 0, True)
    aendere_bahnanzahl_um(123,1,7)
    schwimmer = liste_tabelle('schwimmer')
    print(f"Schwimmer in der Datenbank: {schwimmer}")
    
    # Beispiel: Action hinzufügen und abfragen (falls du eine action-tabelle hast)
    print("\nHinzufügen einer neuen Action...")
    erstelle_action(1, 1,datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  'login', 'param1')
    actions = liste_tabelle('actions')
    print(f"Actions in der Datenbank: {actions}")

    # Beispiel: Abfragen von Actions nach einem bestimmten Zeitstempel
    timestamp = '2025-04-21 00:00:00'
    print(f"\nAbfragen von Actions nach dem Zeitstempel {timestamp}...")
    actions_after_timestamp = finde_actions_after_timestamp(timestamp)
    print(f"Actions nach {timestamp}: {actions_after_timestamp}")
