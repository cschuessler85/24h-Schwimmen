import sqlite3
import atexit

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
            self.conn = sqlite3.connect(self.db_name)
            self.conn.row_factory = sqlite3.Row  # Für dict-ähnliche Zeilen
            self.cursor = self.conn.cursor()
            print("Datenbankverbindung hergestellt.")
        except sqlite3.DatabaseError as e:
            print(f"Fehler beim Verbinden zur Datenbank: {e}")
            self.conn = None
            self.cursor = None

    def execute(self, query, params=None):
        """
        Führt eine SQL-Abfrage aus und behandelt Verbindungsfehler.
        """
        if self.conn is None:
            print("Keine Datenbankverbindung. Versuche Wiederverbindung.")
            self.connect()  # Versuche erneut, die Verbindung herzustellen
            
            if self.conn is None:
                print("Datenbankverbindung konnte nicht wiederhergestellt werden.")
                return
        
        try:
            if params is None:
                params = []
            self.cursor.execute(query, params)
            self.conn.commit()
        except sqlite3.DatabaseError as e:
            print(f"Fehler bei der SQL-Abfrage: {e}")
            self.conn = None
            self.cursor = None  # Setze den Cursor auf None, damit bei der nächsten Abfrage ein Fehler festgestellt wird

    def fetchall(self, query, params=None):
        """
        Holt alle Ergebnisse einer SELECT-Abfrage und behandelt Verbindungsfehler.
        """
        if self.conn is None:
            print("Keine Datenbankverbindung. Versuche Wiederverbindung.")
            self.connect()  # Versuche erneut, die Verbindung herzustellen
            
            if self.conn is None:
                print("Datenbankverbindung konnte nicht wiederhergestellt werden.")
                return []
        
        try:
            if params is None:
                params = []
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
        except sqlite3.DatabaseError as e:
            print(f"Fehler bei der SQL-Abfrage: {e}")
            self.conn = None
            self.cursor = None
            return []

    def fetchone(self, query, params=None):
        """
        Holt ein einzelnes Ergebnis einer SELECT-Abfrage und behandelt Verbindungsfehler.
        """
        if self.conn is None:
            print("Keine Datenbankverbindung. Versuche Wiederverbindung.")
            self.connect()  # Versuche erneut, die Verbindung herzustellen
            
            if self.conn is None:
                print("Datenbankverbindung konnte nicht wiederhergestellt werden.")
                return None
        
        try:
            if params is None:
                params = []
            self.cursor.execute(query, params)
            return self.cursor.fetchone()
        except sqlite3.DatabaseError as e:
            print(f"Fehler bei der SQL-Abfrage: {e}")
            self.conn = None
            self.cursor = None
            return None

    def close(self):
        """
        Schließt die Datenbankverbindung.
        """
        if self.conn:
            self.conn.close()
            print("Datenbankverbindung geschlossen.")

# Globale Instanz der Database-Klasse
db = Database()

# Automatisch beim Programmende die Verbindung schließen
atexit.register(db.close)

# =======================================
# DATENBANK-INITIALISIERUNG
# =======================================
"""
Initialisiert die SQLite-Datenbank mit den Tabellen:
- Benutzer
- Clients
- Actions
- Schwimmer
"""

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()

        # Tabelle: Benutzer
        c.execute('''
            CREATE TABLE IF NOT EXISTS benutzer (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                benutzername TEXT UNIQUE NOT NULL,
                passwort TEXT NOT NULL,
                admin BOOLEAN NOT NULL DEFAULT 0
            )
        ''')

        # Tabelle: Clients
        c.execute('''
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip TEXT NOT NULL,
                benutzer_id INTEGER,
                zeitpunkt_letzte_aktion TEXT,
                FOREIGN KEY (benutzer_id) REFERENCES benutzer(id)
            )
        ''')

        # Tabelle: Schwimmer
        c.execute('''
            CREATE TABLE IF NOT EXISTS schwimmer (
                nummer INTEGER PRIMARY KEY,
                erstellt_von_client_id INTEGER,
                name TEXT,
                bahnanzahl INTEGER,
                strecke INTEGER,
                auf_bahn INTEGER,
                aktiv BOOLEAN,
                FOREIGN KEY (erstellt_von_client_id) REFERENCES clients(id)
            )
        ''')

        # Tabelle: Actions
        c.execute('''
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
        ''')

        conn.commit()


# =======================================
# SCHWIMMER-VERWALTUNG
# =======================================
"""
Funktionen zur Verwaltung von Schwimmern:
- Schwimmer erstellen
- Schwimmer suchen
- Schwimmer aktualisieren
"""

# Sucht einen Schwimmer anhand seines Namens
def finde_schwimmer(name):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM schwimmer WHERE name = ?", (name,))
        return c.fetchone()

# Liest einen Schwimmer anhand seiner ID aus der Datenbank
def lies_schwimmer(schwimmer_id):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM schwimmer WHERE id = ?", (schwimmer_id,))
        return c.fetchone()

# Aktualisiert Felder eines Schwimmers anhand der ID
# Die zu aktualisierenden Felder werden dynamisch übergeben, z. B.:
# update_schwimmer(1, bahnanzahl=5, aktiv=0)
# Das funktioniert durch **kwargs, womit beliebige Schlüssel-Wert-Paare übergeben werden können.
def update_schwimmer(schwimmer_id, **kwargs):
    # Baut dynamisch das SET-Statement für SQL, z. B. "bahnanzahl=?, aktiv=?"
    keys = ', '.join([f"{k}=?" for k in kwargs])
    values = list(kwargs.values()) + [schwimmer_id]
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute(f"UPDATE schwimmer SET {keys} WHERE id = ?", values)
        conn.commit()

# Legt einen neuen Schwimmer in der Datenbank an und gibt die neue ID zurück
def erstelle_schwimmer(name, erstellt_von_client_id, bahnanzahl, strecke, auf_bahn, aktiv):
    with sqlite3.connect(DB_NAME) as conn:
        c = conn.cursor()
        c.execute("""
            INSERT INTO schwimmer (name, erstellt_von_client_id, bahnanzahl, strecke, auf_bahn, aktiv)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, erstellt_von_client_id, bahnanzahl, strecke, auf_bahn, aktiv))
        conn.commit()
        return c.lastrowid
    
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
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        INSERT INTO clients (ip, benutzer_id, zeitpunkt_letzte_aktion)
        VALUES (?, ?, ?)
    ''', (ip, benutzer_id, datetime.now().isoformat()))
    conn.commit()
    conn.close()

def finde_client(ip):
    """
    Sucht einen Client anhand seiner IP-Adresse.

    Parameter:
    - ip (str): IP-Adresse des gesuchten Clients

    Rückgabe:
    - Tupel mit den Client-Daten oder None, falls nicht gefunden
    """
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT * FROM clients WHERE ip = ?', (ip,))
    client = c.fetchone()
    conn.close()
    return client

def update_client_aktion(client_id):
    """
    Aktualisiert den Zeitstempel der letzten Aktion eines Clients.

    Parameter:
    - client_id (int): ID des Clients
    """
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        UPDATE clients
        SET zeitpunkt_letzte_aktion = ?
        WHERE id = ?
    ''', (datetime.now().isoformat(), client_id))
    conn.commit()
    conn.close()

#========================
#    Abschnitt: Benutzer
#======================== 

def erstelle_benutzer(name, benutzername, passwort, admin=False):
    """
    Fügt einen neuen Benutzer zur Datenbank hinzu.
    Gibt die ID des neuen Benutzers zurück.
    """
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''
        INSERT INTO benutzer (name, benutzername, passwort, admin)
        VALUES (?, ?, ?, ?)
    ''', (name, benutzername, passwort, int(admin)))
    conn.commit()
    benutzer_id = c.lastrowid
    conn.close()
    return benutzer_id

def finde_benutzer_by_username(benutzername):
    """
    Gibt einen Benutzer als Dictionary zurück, der dem Benutzernamen entspricht.
    """
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT * FROM benutzer WHERE benutzername = ?', (benutzername,))
    row = c.fetchone()
    conn.close()
    return dict_from_row(row) if row else None

def liste_benutzer():
    """
    Gibt eine Liste aller Benutzer zurück.
    """
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT * FROM benutzer')
    rows = c.fetchall()
    conn.close()
    return [dict_from_row(r) for r in rows]
