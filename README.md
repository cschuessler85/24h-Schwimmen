# 24h-Schwimmen
Erfassung von geleisteten Bahnen bei einem 24 Stunden schwimmen

# Szenario
Bei einem 24 Stundenschwimmen sollen digital die geleisteten Bahnen verschiedener Schiwmmer innerhalb dieser 24 Stundne auf digitalen Endgeräten erfasst und auf einem zentralen Rechner gesammelt werden.
Dabei soll die Bedienung möglichst intuitiv sein und die Datensicherheit besonders hoch, so dass selbst bei einem Ausfall des Servers oder eines Endgerätes die Informationen auf mehreren Stellen verteilt gespeichert sind.

# grobe Planung
Ein Mini-Python-Webserver liefert eine HTML-Seite mit Javascript pro Bahn aus und registriert per send requests Bahnen die auf einem Endgerät registriert werden. Ebenso ist er in der Lage per GET-Request Daten zu liefern.

Die Gestaltung der Ansicht auf dem Endgerät ist in etwa wie folgt:

    *************************
    *  Bahn Nummer 3   (+)  *
    *************************
    * (-) [  137      ] 12  *
    * (-) [  217      ] 22  *
    * (-) [  318      ]  2  *
    *                       *
    *  ...                  *
    *************************

Dabei wird im oberen Bereich die Bahnnummer für die das Gerät genutzt wird eingetragen. Der (+)-Button rechts ermöglicht es einen Schwimmer (der über seine Startnummer erfasst wird) hinzuzufügen.
In einzelnen Zeilen werden die aktiv auf der Bahn schwimmenden Schwimmer grün hinterlegt und am Beginn der Liste geführt. Dies in der Reihenfolge, dass derjenige für den als letztes eine Bahn registriert wurde am Ende
dieses Bereiches geführt wird. So dass die vermutlich als nächstes eintreffenden aktiven Schwimmer ganz oben in der Liste geführt werden. 
Unter diesen aktiven Schwimmern werden weitere aktuell inaktive Schwimmer (weil sie vielleicht gerade Pause machen) geführt - nicht grün hinterlegt aber nach Nummer sortiert.

Durch einen klick auf die Nummer wird eine geleistete Bahn registriert. Die Anzahl der Bahnen wird um eins erhöht und nach 3 Sekunden wird dieser Schwimmer an das Ende des grünen Bereichs sortiert.
Mit Hilfe des (-) Buttons kann eine ggf. fälschlicherweise registrierte Bahn wieder zurückgenommen werden. Der Schwimmer bleibt dann an der Stelle der Liste.

Durch einen rechtsklick oder langen klick auf den Schwimmer öffnet sich ein Kontextmenü in dem der Schwimmer z.B. geändert werden kann, bzw. von aktiv zu inaktiv gewechselt werden kann oder ähnliches.

