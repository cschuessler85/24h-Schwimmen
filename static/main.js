let formIsDirty = true; // Flag, das anzeigt, ob Daten geändert wurden
// Beim Verlassen der Seite warnen, falls Änderungen vorhanden sind
window.addEventListener('beforeunload', function (event) {
    if (formIsDirty) {
        // Zeigt eine Bestätigungsmeldung an, wenn der Benutzer versucht, die Seite zu verlassen
        const message = "Es gibt ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?";
        //event.returnValue = message;  // Laut Chat-GPT Standard für viele Browser
        return message; // Für einige andere Browser
    }
});

let verwaltete_bahnen = [7]; //Liste der Bahnen, die von diesem Client verwaltet werden
const input = document.getElementById("bahnen");
if (isBahnenInputValid(input.value)) {
    verwaltete_bahnen = input.value.split(",").map(s => parseInt(s.trim(), 10));
    //console.log("Verwaltete Bahnen", verwaltete_bahnen);
}

document.getElementById('schwimmerHinzufuegen').addEventListener('click', schwimmerHinzufuegen);
document.getElementById('downloadJsonBtn').addEventListener('click', downloadJSON);

function search(number) {
    const zelle = Array.from(document.querySelectorAll(".nummer")).find(nr =>
        nr.textContent.trim() === number
    );

    if (zelle) {
        console.log("Gefunden:", zelle);
        return true;
    } else {
        console.log("Nicht gefunden");
        return false;
    }
}

function schwimmerHinzufuegen() {
    var nummer = prompt("Nummer:");

    if (!(nummer !== null && nummer.trim() !== "" && !isNaN(nummer))) {
        return;
    }

    if (search(nummer)) {
        alert("Schwimmer*in existiert bereits!");
        return;
    }

    // Neue Zeile erstellen
    var neueZeile = document.createElement('tr');

    // Zellen in der neuen Zeile erstellen
    var nummerZelle = document.createElement('td');
    nummerZelle.className = 'nummer';

    var bahnenZelle = document.createElement('td');
    bahnenZelle.className = 'bahnen';

    // Plus Button Zelle erstellen
    var plusButtonZelle = document.createElement('td');
    var plusButton = document.createElement('button');
    plusButton.innerText = '+';
    plusButton.className = 'plusButton';
    plusButtonZelle.appendChild(plusButton);

    // Text in die Zellen einfügen
    nummerZelle.innerText = nummer;
    bahnenZelle.innerText = 0;

    // Zellen zur neuen Zeile hinzufügen
    neueZeile.appendChild(nummerZelle);
    neueZeile.appendChild(bahnenZelle);
    neueZeile.appendChild(plusButtonZelle); // Hinzufügen des Plus-Buttons

    // Die neue Zeile in die Tabelle einfügen
    var tabelle = document.getElementById('schwimmer');
    tabelle.appendChild(neueZeile);

    // Event-Listener für den Plus-Button
    plusButton.addEventListener('click', function() {
        if (!neueZeile.classList.contains("abwesend")) {
            let current = parseInt(bahnenZelle.textContent);
            bahnenZelle.textContent = current + 1;
        }
    });
}


function tableToJSON(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll("tr");

    const headers = Array.from(rows[0].querySelectorAll("th")).map(th =>
        th.getAttribute("data-key")
    );

    const jsonData = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll("td");
        const rowData = {};

        cells.forEach((cell, index) => {
            const key = headers[index];
            rowData[key] = cell.textContent.trim();
        });

        // HIER die Abwesenheit ergänzen
        rowData["Abwesend"] = row.classList.contains("abwesend");

        if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData);
        }
    }

    return jsonData;
}

function showStatusMessage(text, isSuccess = true, duration = 3000) {
    const msg = document.getElementById("statusMessage");
    msg.textContent = text;
    msg.style.backgroundColor = isSuccess ? "#4CAF50" : "#f44336";
    msg.style.display = "block";

    setTimeout(() => {
        msg.style.display = "none";
    }, duration);
}


function toggleInfoBar() {
    // Das Info-Bar-Element auswählen
    const infoBar = document.getElementById("infoBar");

    // Überprüfen, ob die Info-Leiste gerade sichtbar ist
    if (infoBar.style.display === "none" || infoBar.style.display === "") {
        // Info-Leiste einblenden
        infoBar.style.display = "flex";
    } else {
        // Info-Leiste ausblenden
        infoBar.style.display = "none";
    }
}


function downloadJSON() {
    // Tabelle in JSON umwandeln
    const data = tableToJSON("schwimmer");

    // In JSON-Text umwandeln
    const jsonString = JSON.stringify(data, null, 2);

    // Blob erstellen (Dateiobjekt)
    const blob = new Blob([jsonString], { type: "application/json" });

    // Temporären Download-Link erstellen
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "24hschwimmen.json";

    // Link klicken (Download starten)
    document.body.appendChild(link);
    link.click();

    // Aufräumen
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function isBahnenInputValid(value) {
    return /^(\d+(,\d+)*)?$/.test(value.trim());
}

function checkBahnenInput() {
    const input = document.getElementById("bahnen");
    if (isBahnenInputValid(input.value)) {
        input.style.backgroundColor = ""; // gültig
    } else {
        input.style.backgroundColor = "#fdd"; // ungültig (rot)
    }
}

function parseBahnenInput() {
    const input = document.getElementById("bahnen");
    if (isBahnenInputValid(input.value)) {
        const zahlen = input.value.split(",").map(s => parseInt(s.trim(), 10));
        console.log("Gültige Bahnnummern:", zahlen);
        verwaltete_bahnen = zahlen;
        showStatusMessage("Bahnen geändert",true,1000);
    } else { //Fehlerhafte Bahnnummern
        showStatusMessage("Ungültiges Format! Bitte nur Zahlen, getrennt durch Kommas.", false);
        input.value = verwaltete_bahnen.join(',');
        checkBahnenInput(); //Farbe wieder richtig setzen
    }
}

const table = document.getElementById("schwimmer");
const contextMenu = document.getElementById("contextMenu");
let clickedRow = null;

// Bahn hinzufügen bei Linksklick auf Nummer
table.addEventListener("click", function (event) {
    if (event.target.classList.contains("nummer")) {
        const schwimmer_nr = event.target.innerText;
        console.log("schwimmer_nr", schwimmer_nr);
        const row = event.target.parentElement;
        const bahnenCell = row.querySelector(".bahnen");

        if (!row.classList.contains("abwesend")) {
            let current = parseInt(bahnenCell.textContent);
            bahnenCell.textContent = current + 1;
        }
    }
});

// Kontextmenü bei Rechtsklick auf Nummer
table.addEventListener("contextmenu", function (event) {
    if (event.target.classList.contains("nummer")) {
        event.preventDefault(); // Standard-Rechtsklick unterdrücken

        clickedRow = event.target.parentElement;

        // Menü an Mausposition anzeigen
        contextMenu.style.top = event.pageY + "px";
        contextMenu.style.left = event.pageX + "px";
        contextMenu.style.display = "block";
        document.getElementById("bahnHinzufuegenOption").style.display = "none";
    }
});

// Kontextmenü ausblenden bei Klick außerhalb
document.addEventListener("click", function (e) {
    if (!contextMenu.contains(e.target)) {
        contextMenu.style.display = "none";
    }
});

function send() {
    const jsonDaten = tableToJSON("schwimmer");
    const msg = JSON.stringify(jsonDaten);

    fetch("/senden", {
        method: "POST",
        body: msg,
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(response => response.text())
        .then(text => {
            document.getElementById("antwort").innerText = text;
        });

    fetch("/daten")
        .then(res => res.json())
        .then(daten => {
            const table = document.getElementById("schwimmer");
            // Alte Zeilen löschen (außer Header)
            const rows = table.querySelectorAll("tr:not(:first-child)");
            rows.forEach(row => row.remove());

            daten.sort((a, b) => {
                return (a.Abwesend === b.Abwesend) ? 0 : a.Abwesend ? 1 : -1;
            });

            // Neue Zeilen einfügen
            daten.forEach(schwimmer => {
                const tr = document.createElement("tr");

                if (schwimmer.Abwesend) {
                    tr.classList.add("abwesend");
                    table.appendChild(tr);
                }
                const tdNummer = document.createElement("td");
                tdNummer.className = "nummer";
                tdNummer.textContent = schwimmer.Nummer;

                const tdBahnen = document.createElement("td");
                tdBahnen.className = "bahnen";
                tdBahnen.textContent = schwimmer.Bahnen;

                tr.appendChild(tdNummer);
                tr.appendChild(tdBahnen);

                table.appendChild(tr);
            });
        });
}

document.getElementById("abwesendOption").addEventListener("click", function () {
    if (clickedRow) {
        clickedRow.classList.toggle("abwesend");

        const tabelle = clickedRow.parentNode;

        if (clickedRow.classList.contains("abwesend")) {
            tabelle.appendChild(clickedRow); // Nach unten
        } else {
            // Suche erste echte Datenzeile (also: erste <tr>, die NICHT die header-Zeile ist)
            const zeilen = tabelle.querySelectorAll("tr");
            let ziel = null;

            for (let i = 0; i < zeilen.length; i++) {
                if (zeilen[i] !== clickedRow && !zeilen[i].querySelector("th")) {
                    ziel = zeilen[i];
                    break;
                }
            }

            // Vor erster Datenzeile einfügen
            if (ziel) {
                tabelle.insertBefore(clickedRow, ziel);
            }
        }
    }

    contextMenu.style.display = "none";
});

// Option: Runde abziehen
document.getElementById("rundeAbziehenOption").addEventListener("click", function () {
    if (clickedRow) {
        const bahnenCell = clickedRow.querySelector(".bahnen");
        let current = parseInt(bahnenCell.textContent);
        bahnenCell.textContent = Math.max(0, current - 1);
    }
    contextMenu.style.display = "none";
});

document.getElementById("bahnHinzufuegenOption").addEventListener("click", function () {
    if (clickedRow) {
        const bahnenCell = clickedRow.querySelector(".bahnen");

        if (!clickedRow.classList.contains("abwesend")) {
            let current = parseInt(bahnenCell.textContent);
            bahnenCell.textContent = current + 1;
        }
    }
    contextMenu.style.display = "none";
});

document.getElementById("deleteSwimmer").addEventListener("click", function () {
    if (clickedRow) {
        if (confirm("Soll diese Nummer entfernt werden?")) {
            clickedRow.remove();
        }
    }
    contextMenu.style.display = "none";
});

setInterval(send, 50000);
send()
