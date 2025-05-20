

# Globales Logging konfigurieren
import logging
import os
os.makedirs("data", exist_ok=True)

# Globales Logging konfigurieren
def configure_logging():
    if not logging.getLogger().hasHandlers():
        # Erstellen des Loggers
        logger = logging.getLogger()
        logger.setLevel(logging.DEBUG)  # Alle Meldungen ab DEBUG-Level
        
        # Format für die Log-Meldungen
        log_format = '%(asctime)s - %(levelname)s - %(message)s'

        # Handler für das Loggen in eine Datei
        file_handler = logging.FileHandler('data/serverlog.log', mode='a', encoding='utf-8')  # Log-Datei
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(logging.Formatter(log_format))

        # Handler für das Loggen auf der Konsole (Bildschirm)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(logging.Formatter(log_format))

        # Hinzufügen der Handler zum Logger
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

def configure_logging_old():
    logging.basicConfig(
        level=logging.DEBUG,  # Alle Meldungen ab DEBUG-Level
        format='%(asctime)s - %(levelname)s - %(message)s',
        filename='data/serverlog.log',  # Log-Datei
        filemode='a'  # Anhängen an die Datei
    )
