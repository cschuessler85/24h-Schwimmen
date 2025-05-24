import sys
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QTextEdit, QMenuBar, QInputDialog
)
from PyQt6.QtGui import (QAction)
from PyQt6.QtCore import QProcess

class FlaskGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("24hSchwimmen-Server GUI")
        self.resize(800, 600)

        self.text_area = QTextEdit(self)
        self.text_area.setReadOnly(True)
        self.setCentralWidget(self.text_area)

        self.create_menu()

        self.process = QProcess(self)
        self.process.readyReadStandardOutput.connect(self.on_stdout)
        self.process.readyReadStandardError.connect(self.on_stderr)
        self.process.start("python", ["server.py"])

    def create_menu(self):
        menubar = self.menuBar()

        file_menu = menubar.addMenu("Datei")
        quit_action = QAction("Beenden", self)
        quit_action.triggered.connect(self.close)
        file_menu.addAction(quit_action)

        settings_menu = menubar.addMenu("Einstellungen")
        password_action = QAction("Admin-Passwort setzen", self)
        password_action.triggered.connect(self.set_password)
        settings_menu.addAction(password_action)

    def set_password(self):
        password, ok = QInputDialog.getText(self, "Passwort setzen", "Neues Admin-Passwort:")
        if ok:
            self.text_area.append(f"Neues Passwort gesetzt: {password}")

    def on_stdout(self):
        output = self.process.readAllStandardOutput().data().decode()
        self.text_area.append(output)

    def on_stderr(self):
        error = self.process.readAllStandardError().data().decode()
        self.text_area.append(f"[Fehler] {error}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = FlaskGUI()
    window.show()
    sys.exit(app.exec())
