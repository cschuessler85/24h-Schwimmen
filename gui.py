import sys
import threading
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QPlainTextEdit, QMenuBar,
    QMenu, QFileDialog, QMessageBox
)
from PyQt6.QtGui import QTextCharFormat, QSyntaxHighlighter, QColor, QFont, QDesktopServices, QAction, QTextCursor
from PyQt6.QtCore import QUrl, Qt, QRegularExpression, QTimer
import server  # server.py muss im selben Verzeichnis liegen

from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QLabel, QLineEdit,
    QPushButton, QHBoxLayout
)

class PasswordDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Admin-Passwort setzen")

        layout = QVBoxLayout(self)

        layout.addWidget(QLabel("Neues Passwort:"))
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.password_input)

        toggle_layout = QHBoxLayout()
        self.toggle_button = QPushButton("Anzeigen")
        self.toggle_button.setCheckable(True)
        self.toggle_button.toggled.connect(self.toggle_password_visibility)
        toggle_layout.addStretch()
        toggle_layout.addWidget(self.toggle_button)
        layout.addLayout(toggle_layout)

        self.ok_button = QPushButton("OK")
        self.ok_button.clicked.connect(self.accept)
        layout.addWidget(self.ok_button)

    def toggle_password_visibility(self, checked):
        if checked:
            self.password_input.setEchoMode(QLineEdit.EchoMode.Normal)
            self.toggle_button.setText("Verbergen")
        else:
            self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
            self.toggle_button.setText("Anzeigen")

    def get_password(self):
        return self.password_input.text()


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
        adminpw_action = QAction("Admin-Passwort...", self)
        adminpw_action.triggered.connect(self.set_password)
        settings_menu.addAction(adminpw_action)

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
        dialog = PasswordDialog(self)
        if dialog.exec():
            neues_passwort = dialog.get_password()
            # Hier: Passwort speichern/prüfen/weiterverarbeiten
            if (server.db.passwort_aendern("admin",neues_passwort)):
                QMessageBox.information(self, "Passwort", "Passwort wurde gesetzt.")
            else: 
                QMessageBox.information(self, "Passwort", "Passwort konnte nicht gesetzt werden.")


if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = MainWindow()
    window.resize(800, 600)
    window.show()
    sys.exit(app.exec())
