import sys
import threading
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QPlainTextEdit, QMenuBar,
    QMenu, QFileDialog, QMessageBox
)
from PyQt6.QtGui import QTextCharFormat, QSyntaxHighlighter, QColor, QFont, QDesktopServices, QAction
from PyQt6.QtCore import QUrl, Qt, QRegularExpression
import server  # server.py muss im selben Verzeichnis liegen


class Tee:
    def __init__(self, *targets):
        self.targets = targets

    def write(self, msg):
        for t in self.targets:
            t.write(msg)
            t.flush()

    def flush(self):
        for t in self.targets:
            t.flush()


class AnsiHighlighter(QSyntaxHighlighter):
    def highlightBlock(self, text):
        ansi_format = QTextCharFormat()
        ansi_format.setForeground(QColor("green"))
        if "\x1b[" in text:  # ANSI-Escape erkannt
            ansi_format.setFontWeight(QFont.Weight.Bold)
            self.setFormat(0, len(text), ansi_format)

class StreamWriter:
    def __init__(self, write_func):
        self.write_func = write_func
    def write(self, msg):
        self.write_func(msg)
    def flush(self):
        pass

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Flask GUI Server")
        self.stdout_stream = StreamWriter(self.write_stdout)
        self.stderr_stream = StreamWriter(self.write_stderr)

        # Textkonsole
        self.console = QPlainTextEdit(self)
        self.console.setReadOnly(True)
        self.console.setStyleSheet("background-color: black; color: white; font-family: monospace;")
        AnsiHighlighter(self.console.document())
        self.setCentralWidget(self.console)

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

    def start_server_thread(self):
        def run():
            sys.stdout = Tee(sys.__stdout__, self.stdout_stream)
            sys.stderr = Tee(sys.__stderr__, self.stderr_stream)
            server.run_server()

        t = threading.Thread(target=run) #, daemon=True)
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
