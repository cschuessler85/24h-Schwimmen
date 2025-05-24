import sys
import threading
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QPlainTextEdit, QMenuBar,
    QMenu, QFileDialog, QMessageBox
)
from PyQt6.QtGui import QTextCharFormat, QSyntaxHighlighter, QColor, QFont, QDesktopServices, QAction, QTextCursor
from PyQt6.QtCore import QUrl, Qt, QRegularExpression, QTimer
import server  # server.py muss im selben Verzeichnis liegen

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Flask GUI Server")

        # Textkonsole
        self.console = QPlainTextEdit(self)
        self.console.setReadOnly(True)
        self.console.setStyleSheet("background-color: black; color: white; font-family: monospace;")
        self.setCentralWidget(self.console)

        # Log-Datei-Pfad
        self.log_path = "data/serverlog.log"
        self.last_position = 0

        # Timer starten
        self.timer = QTimer()
        self.timer.timeout.connect(self.read_log)
        self.timer.start(1000)  # alle 1 Sekunde

        # Menü
        menubar = QMenuBar()
        self.setMenuBar(menubar)

        file_menu = QMenu("Datei", self)
        menubar.addMenu(file_menu)
        exit_action = QAction("Beenden", self)
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # Im setup_menu oder ähnlicher Methode hinzufügen:
        web_menu = menubar.addMenu("Webseiten öffnen")

        admin_action = QAction("Admin", self)
        admin_action.triggered.connect(lambda: QDesktopServices.openUrl(QUrl("http://localhost:8080/admin")))
        web_menu.addAction(admin_action)

        client_action = QAction("Client", self)
        client_action.triggered.connect(lambda: QDesktopServices.openUrl(QUrl("http://localhost:8080")))
        web_menu.addAction(client_action)


        settings_menu = QMenu("Einstellungen", self)
        menubar.addMenu(settings_menu)
        dummy_action = QAction("Admin-Passwort...", self)
        dummy_action.triggered.connect(self.set_password)
        settings_menu.addAction(dummy_action)

        # Starte den Server in einem Thread
        self.start_server_thread()

    def read_log(self):
        try:
            with open(self.log_path, "r", encoding="utf-8", errors="replace") as f:
                f.seek(self.last_position)
                new_data = f.read()
                if new_data:
                    self.console.moveCursor(QTextCursor.MoveOperation.End)
                    self.console.insertPlainText(new_data)
                    self.console.moveCursor(QTextCursor.MoveOperation.End)
                self.last_position = f.tell()
        except FileNotFoundError:
            pass

    def start_server_thread(self):
        def run():
            server.run_server()

        t = threading.Thread(target=run, daemon=True)
        t.start()

    def write_stdout(self, text):
        self.console.appendPlainText(text)

    def write_stderr(self, text):
        #Dieser Text kommt über den Fehler stream
        self.console.appendPlainText(f"{text}")

    def set_password(self):
        QMessageBox.information(self, "Einstellungen", "Passwort-Dialog folgt.")


if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = MainWindow()
    window.resize(800, 600)
    window.show()
    sys.exit(app.exec())
