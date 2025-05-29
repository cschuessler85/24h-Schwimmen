import secrets #Für sicherere (?) Zufallsfunktionen
import string
import socket

def generiere_passwort(laenge=8):
    zeichen = string.ascii_letters + string.digits
    return ''.join(secrets.choice(zeichen) for _ in range(laenge))


def get_all_ips():
    ''' Erzeugt eine Liste der IPv4-Adressen der Interfaces des Rechners
    @return Liste der IP-Adressen
    '''
    ip_list = []
    hostname = socket.gethostname()
    try:
        for addr in socket.getaddrinfo(hostname, None):
            ip = addr[4][0]
            if ip not in ip_list and ':' not in ip:  # IPv4 - IPv6-Adressen enthalten den Doppelpunkt
                ip_list.append(ip)
    except socket.gaierror:
        pass
    return ip_list

if __name__=="__main__":
    zufallspasswort = generiere_passwort()
    print(f"Zufallspasswort {zufallspasswort}")
    print(f"Liste der IP-Adressen {list(get_all_ips())}")
