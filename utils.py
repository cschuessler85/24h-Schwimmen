import secrets #Für sicherere (?) Zufallsfunktionen
import string

def generiere_passwort(laenge=8):
    zeichen = string.ascii_letters + string.digits
    return ''.join(secrets.choice(zeichen) for _ in range(laenge))

if __name__=="__main__":
    zufallspasswort = generiere_passwort()
    print(f"Zufallspasswort {zufallspasswort}")
