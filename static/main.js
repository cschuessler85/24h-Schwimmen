let formIsDirty = true; // Flag, das anzeigt, ob Daten geändert wurden
// Beim Verlassen der Seite warnen, falls Änderungen vorhanden sind
window.addEventListener('beforeunload', function (event) {
    if (formIsDirty) {
        event.preventDefault();
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

// Daten schwimmer und actions
let schwimmer = [
    /*    { nummer: 8, name: "Ben", bahnen: 3, prio: 15 },
        { nummer: 9, name: "Anna", bahnen: 5, prio: 10 },
        { nummer: 10, name: "Anna", bahnen: 5, prio: 10 },
        { nummer: 11, name: "Ben", bahnen: 3, prio: 15 },
        { nummer: 12, name: "Anna", bahnen: 5, prio: 10 },
        { nummer: 13, name: "Ben", bahnen: 3, prio: 15 },
        { nummer: 14, name: "Anna", bahnen: 5, prio: 10 },
        { nummer: 15, name: "Ben", bahnen: 3, prio: 15 },
        { nummer: 16, name: "Ben", bahnen: 3, prio: 15 },
        { nummer: 17, name: "Clara", bahnen: 7, prio: 5 },*/
];
let actions = [];
let alleSchwimmer = []; // Beinhaltet die Schwimmer in der Datenbank

document.getElementById('schwimmerHinzufuegen').addEventListener('click', promptSchwimmerHinzufuegen);
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

function promptSchwimmerHinzufuegen() {
    var nummer = prompt("Nummer:");

    if (!(nummer !== null && nummer.trim() !== "" && !isNaN(nummer))) {
        return;
    }

    schwimmerHinzufuegen(nummer);
}


function schwimmerHinzufuegen(nummer) {
    console.log("Schwimmer Nr. ", nummer, "wird gesucht...");

    // Der gesuchte Schwimmer soll auf jeden Fall oben in die Liste
    const maxPrio = Math.max(...schwimmer.map(s => s.prio));

    //Wenn der schwimmer schon in der Liste ist schwimmer ist, wird seine Priorität auf das aktuelle Maximum gesetzt
    const aktiver = schwimmer.find(s => s.nummer == nummer);
    if (aktiver) {
        console.log("... aktiver Schwimmer");
        // prio auf max
        aktiver.prio = maxPrio + 1; ///Wenn der schwimmer in der Liste alleSchwimmer ist, wird er in die Liste schwimmer übernommen ...
    } else {
        const bekannter = alleSchwimmer.find(s => s.nummer == nummer);
        if (bekannter) {
            console.log("Schwimmer Nummer war schon vorhanden");
            const scopy = {
                nummer: parseInt(nummer),
                name: bekannter.name,
                bahnen: bekannter.bahnanzahl,
                aktiv: true,
                prio: maxPrio + 1
            };
            if (!bekannter.auf_bahn || !bekannter.auf_bahn in verwaltete_bahnen) {
                scopy.aufBahn = verwaltete_bahnen[0];
            } else {
                scopy.aufBahn = bekannter.auf_bahn;
            }
            console.log("SchwimmerKopie", scopy);
            schwimmer.push(scopy);
        } else { //Ansonsten wird er in der Liste Schwimmer neu erzeugt
            const neuer = {
                nummer: parseInt(nummer),
                name: `Schwimmer ${nummer}`,
                bahnen: 0,
                aufBahn: verwaltete_bahnen[0],
                aktiv: true,
                prio: maxPrio + 1
            };
            schwimmer.push(neuer);
        }
    }
}

function fillSchwimmerAusMeinenBahnen() {
    console.log("AlleSchwimmer", alleSchwimmer);
    console.log("verwaltete_bahnen", verwaltete_bahnen);
    const meineSchwimmer = alleSchwimmer.filter(s => verwaltete_bahnen.includes(s.auf_bahn));
    console.log(meineSchwimmer);
    // Alle Schwimmer die davon noch nicht in schwimmer sind einfügen
    meineSchwimmer.forEach(s_neu => {
        console.log("Prüfe: ", s_neu);
        if (!schwimmer.some(s => s.nummer == s_neu.nummer)) {
            const scopy = {
                nummer: parseInt(s_neu.nummer),
                name: s_neu.name,
                bahnen: s_neu.bahnanzahl,
                aktiv: true,
                aufBahn: s_neu.auf_bahn,
                prio: 0 //hinten anfügen
            };
            console.log("SchwimmerKopie", scopy);
            schwimmer.push(scopy);
        }
    });
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
    // Prüft, ob der Eingabewert eine durch Kommas getrennte Liste von Zahlen ist,
    // z. B. "3", "1,2", "10,20,30", aber kein leerer String.
    // Regulärer Ausdruck:
    // ^         → Anfang des Strings
    // \d+       → mindestens eine Ziffer
    // (,\d+)*   → optional beliebig viele Gruppen aus Komma gefolgt von mindestens einer Ziffer
    // $         → Ende des Strings
    return /^(\d+(,\d+)*)$/.test(value.trim());
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
        showStatusMessage("Bahnen geändert", true, 1000);
        fillSchwimmerAusMeinenBahnen();
    } else { //Fehlerhafte Bahnnummern
        showStatusMessage("Ungültiges Format! Bitte nur Zahlen, getrennt durch Kommas.", false);
        input.value = verwaltete_bahnen.join(',');
        checkBahnenInput(); //Farbe wieder richtig setzen
    }
}

const table = document.getElementById("schwimmer");
const contextMenu = document.getElementById("contextMenu");
let clickedRow = null;
let clickedDiv = null; //Wenn auf ein Div geklickt wird - merken

// **********************************************************
//   Behandlung und Verarbeitung der DIV-Darstellung
// **********************************************************
const container = document.getElementById('container');

// Map für laufende Fade-Operationen - soll auf ein DIV nach einem Klick angewandt werden
const fadeControllers = new Map();

// Fading-Funktion blendet ein Div langsam aus
async function fadeOut(div, duration = 3000) {
    return new Promise((resolve, reject) => {
        let opacity = 1;
        const interval = 50;
        const decrement = interval / duration;

        const controller = fadeControllers.get(div.dataset.nummer);

        if (!controller || controller.signal.aborted) {
            return reject('Fade abgebrochen');
        }

        const fade = setInterval(() => {
            if (!controller || controller.signal.aborted) {
                clearInterval(fade);
                div.style.opacity = 1;
                return reject('Fade abgebrochen');
            }
            opacity -= decrement;
            div.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fade);
                resolve();
            }
        }, interval);
    });
}


// Angezeigte Bahnen in einem Schwimmer-Div verändern
function aendereBahnenInDiv(div, anz) {
    // Finde das span mit der Klasse "bahnen"
    const bahnenSpan = div.querySelector('.bahnen');
    // Extrahiere die Zahl aus dem Textinhalt des span
    let bahnen = parseInt(bahnenSpan.textContent.match(/\d+/)[0], 10);
    // Ändere um Anzahl
    bahnen += anz;
    // Setze die neue Zahl im span
    bahnenSpan.textContent = `(${bahnen})`;
}

// Click auf ein Element in dem Container mit den Schimmern
container.addEventListener('click', async (event) => {
    const clicked_schwimmer = event.target.closest('.schwimmer');
    console.log("Klick in Container", clicked_schwimmer);

    if (!clicked_schwimmer || !container.contains(clicked_schwimmer)) {
        return; // Klick war außerhalb eines Box-Elements
    }

    const nummer = clicked_schwimmer.dataset.nummer; // oder eine andere Info
    clicked_schwimmer.style.backgroundColor = "aqua";
    console.log(`Schwimmer ${nummer} wurde geklickt.`);
    // Falls schon ein Fade läuft: abbrechen
    if (fadeControllers.has(nummer)) {
        fadeControllers.get(nummer).abort();
        fadeControllers.delete(nummer);
        clicked_schwimmer.style.opacity = 1; // sofort wieder sichtbar
        //Angezeigte Bahn wieder um eins Verringern
        aendereBahnenInDiv(clicked_schwimmer, -1);
        clicked_schwimmer.style.backgroundColor = "";
        //console.log(`Fade von Div ${nummer} abgebrochen.`);
        return;
    }

    // Angezeigte Bahn um eins erhöhen
    aendereBahnenInDiv(clicked_schwimmer, 1);

    // Neuen Controller speichern
    const controller = new AbortController();
    fadeControllers.set(nummer, controller);

    try {
        await fadeOut(clicked_schwimmer);
        if (fadeControllers.has(nummer)) {
            fadeControllers.delete(nummer);
            console.log(`Aktion nach Fade von Div ${nummer} ausführen.`);
            // Hier deine eigentliche Klick-Aktion!
            const s_data = schwimmer.find(s => s.nummer == nummer);
            console.log("s_data", s_data);
            if (s_data) {
                console.log("Schwimmer: Bahnen erhöhen und Prio auf 0 setzen", s_data);
                if (!s_data.aufBahn || !verwaltete_bahnen.includes(s_data.aufBahn)) {
                    console.log(`Bahn des Schwimmers ${nummer} auf ${verwaltete_bahnen[0]} gesetzt`);
                    s_data.aufBahn = verwaltete_bahnen[0];
                }
                s_data.prio = 0;
                s_data.bahnen += 1;
                //das Div löschen - wird beim rendern wieder hinten angehangen
                clicked_schwimmer.remove();
                render();
                actions.push({
                    kommando: "ADD",
                    parameter: [nummer, 1, s_data.aufBahn],
                    timestamp: new Date().toISOString(),
                    transmitted: false
                });

            }
        }
    } catch (e) {
        console.log(e);
    }


});

// Kontextmenü bei Rechtsklick auf Schwimmer div
container.addEventListener('contextmenu', function (event) {
    const clicked_schwimmer = event.target.closest('.schwimmer');
    console.log("RechtsKlick in Container", clicked_schwimmer);

    if (!clicked_schwimmer || !container.contains(clicked_schwimmer)) {
        return; // Klick war außerhalb eines Box-Elements
    }

    event.preventDefault(); // Standard-Rechtsklick unterdrücken
    clickedDiv = clicked_schwimmer;

    // Menü an Mausposition anzeigen
    contextMenu.style.top = event.pageY + "px";
    contextMenu.style.left = event.pageX + "px";
    contextMenu.style.display = "block";
    // Option nur Schwimmer auf eigenen Bahnen
    if (schwimmer.some(s =>  !verwaltete_bahnen.includes(s.aufBahn) )) {
        //Option anzeigen
        document.getElementById("nurEigene").style.display = "block";
    } else {
        //Option ausblenden
        document.getElementById("nurEigene").style.display = "none";
    }
});

// Kontextmenü ausblenden bei Klick außerhalb
document.addEventListener("click", function (e) {
    if (!contextMenu.contains(e.target)) {
        contextMenu.style.display = "none";
    }
});
document.addEventListener("contextmenu", function (e) {
    const clicked_schwimmer = e.target.closest('.schwimmer');
    console.log("RechtsKlick in Container", clicked_schwimmer);

    if (!clicked_schwimmer || !container.contains(clicked_schwimmer)) {
        contextMenu.style.display = "none";
    }
});

function addSwipeHandler(div) {
    let startX = 0;
    let currentX = 0;
    let swiped = false;

    const threshold = div.offsetWidth / 2; // Funktioniert nur, wenn das div schon gerendert ist
    //const threshold = div.getBoundingClientRect().width; //Alternative
    //console.log("Threshold: ",threshold);

    div.addEventListener('touchstart', e => {
        div.dataset.swiping = "true";
        startX = e.touches[0].clientX;
        div.style.transition = ''; // Bewegung ohne Übergang
    });

    div.addEventListener('touchmove', e => {
        currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        div.style.transform = `translateX(${deltaX}px)`;

        // Wenn mehr als die Hälfte verschoben → Farbe ändern
        if (Math.abs(deltaX) > threshold) {
            div.style.backgroundColor = 'red';
            swiped = true;
        } else {
            div.style.backgroundColor = '';
            swiped = false;
        }
    });

    div.addEventListener('touchend', () => {
        delete div.dataset.swiping;
        div.style.transition = 'transform 0.2s ease';
        if (swiped) {
            // entferne das Element (du hast das bereits implementiert)
            const index = schwimmer.findIndex(s => s.nummer === parseInt(div.dataset.nummer));
            if (index !== -1) {
                schwimmer.splice(index, 1); //lösche einen Eintrag an Stelle index
            }
            div.remove();
        } else {
            // zurücksetzen
            div.style.transform = 'translateX(0)';
            div.style.backgroundColor = '';
        }
    });
}


function render() {
    const container = document.getElementById("container");

    // Aktuelle Divs nach Nummer erfassen
    const existingDivs = new Map();
    container.querySelectorAll(".schwimmer").forEach(div => {
        existingDivs.set(Number(div.dataset.nummer), div);
    });

    // Schwimmer nach Prio sortieren
    const sortedSchwimmer = [...schwimmer].sort((a, b) => b.prio - a.prio);

    // Divs neu anordnen
    sortedSchwimmer.forEach((s) => {
        let div = existingDivs.get(s.nummer);

        if (!div) {
            // Div existiert noch nicht → neu erstellen
            div = document.createElement("div");
            div.className = "schwimmer";
            div.dataset.nummer = s.nummer;
            container.appendChild(div);
            addSwipeHandler(div);
        }

        // Inhalt (fast) immer aktualisieren
        div.dataset.prio = s.prio ?? 0;
        if (!fadeControllers.has(div.dataset.nummer) && div.dataset.swiping !== "true") {
            div.innerHTML = `
                <div class="nummer">${s.nummer} <span class="bahnen">(${s.bahnen})</span></div>
                <div class="name">${s.name}  <span class="prio">Prio: ${s.prio}</span></div>
            `;
            //Wenn Bahn nicht in verwaltete Bahnen Hintergrund ändern
            if (!verwaltete_bahnen.includes(s.aufBahn)) {
                div.style.backgroundColor = "lightgreen";
            } else {
                div.style.removeProperty("background-color");
            }
        } else {
            console.log("Hier wird gefadet", s.nummer);
        }

        // Div richtig platzieren
        container.appendChild(div); // appendChild verschiebt div, wenn es schon existiert
    });
}


// Sekündliches auffrischen der darstellung
const interval = 1000; // Auffrischung in ms
setInterval(() => {
    schwimmer.forEach((s) => (s.prio += interval / 1000)); // Prio um 1 erhöhen
    render();
}, interval);



// ----------------------------------------------------------
//  ENDE  Behandlung und Verarbeitung der DIV-Darstellung
// ----------------------------------------------------------

// **********************************************************
//  DATENAUSTAUSCH mit dem Server
// **********************************************************
let isFetching = false;
let server_verbunden = true;

async function transmitActions() {
    if (isFetching) return;
    const pending = actions.filter(a => !a.transmitted);
    if (pending.length === 0) return;

    try {
        console.log("transmit Action");
        isFetching = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 Sekunden Timeout

        const response = await fetch('/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pending),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            pending.forEach(a => a.transmitted = true);
            updateServerStatus(true);
        } else {
            updateServerStatus(false);
        }
    } catch (error) {
        console.log("Error on transmit", error);
        updateServerStatus(false);
    } finally {
        isFetching = false;
    }
}

function updateServerStatus(neu) {
    console.log("updateServerStatus - alt", server_verbunden, "neu", neu);
    if (server_verbunden != neu) { //Server status hat sich geändert
        server_verbunden = neu;
        const statusspan = document.getElementById('serverStatus');
        if (server_verbunden) {
            statusspan.innerHTML = `
            <span style="height: 10px; width: 10px; background-color: green; border-radius: 50%; display: inline-block; margin-right: 5px">
            </span> Verbunden
            `;
            showStatusMessage("Server wieder verbunden", true);
        } else {
            statusspan.innerHTML = `
            <span style="height: 10px; width: 10px; background-color: red; border-radius: 50%; display: inline-block; margin-right: 5px">
            </span> Nicht Verbunden
            `;
            showStatusMessage("Serververbindung verloren", false);
        }

    }
}

/**
 * Holt die Daten aller auf dem Server gespeicherten Schwimmer und legt sie in 
 * alleSchwimmer ab
 * 
 * @returns {void}
 */
async function fetchAlleSchwimmer() {
    try {
        console.log("Schwimmer holen");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 Sekunden Timeout

        const response = await fetch('/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ 'kommando': "GET", 'parameter': [], 'timestamp': new Date().toISOString() }]),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            alleSchwimmer = await response.json();
            console.log(alleSchwimmer);
            updateServerStatus(true);
        } else {
            updateServerStatus(false);
        }
    } catch (error) {
        console.log("Error on fetchAlleSchwimmer", error);
        updateServerStatus(false);
    } finally {
    }
}

// ----------------------------------------------------------
//  ENDE DATENAUSTAUSCH mit dem Server
// ----------------------------------------------------------

// Option: Runde abziehen
document.getElementById("rundeAbziehenOption").addEventListener("click", function () {
    //TODO: auf DIV umschreiben
    if (clickedRow) {
        const bahnenCell = clickedRow.querySelector(".bahnen");
        let current = parseInt(bahnenCell.textContent);
        bahnenCell.textContent = Math.max(0, current - 1);
    }
    contextMenu.style.display = "none";
});

document.getElementById("deleteSwimmer").addEventListener("click", function () {
    if (clickedDiv) {
        const nummer = parseInt(clickedDiv.dataset.nummer);
        if (confirm(`Soll die Nummer ${nummer} entfernt werden?`)) {
            //schwimmer = schwimmer.filter(s => s.nummer !== nummer);
            //in Place löschen
            const index = schwimmer.findIndex(s => s.nummer === nummer);
            if (index !== -1) {
                schwimmer.splice(index, 1); //lösche einen Eintrag an Stelle index
            }
            clickedDiv.remove();
        }
    }
    clickedDiv = null;
    contextMenu.style.display = "none";
});

document.getElementById("nurEigene").addEventListener("click", function () {
    let index = schwimmer.findIndex(s => !verwaltete_bahnen.includes(s.aufBahn));
    while (index !== -1) {
        const nummer = schwimmer[index].nummer;
        schwimmer.splice(index, 1); //lösche diesen Eintrag
        //lösche das DIV
        const div = document.querySelector(`div[data-nummer="${nummer}"]`);
        div.remove();
        index = schwimmer.findIndex(s => !verwaltete_bahnen.includes(s.aufBahn));
    }
    contextMenu.style.display = "none";
});

console.log("Initial commands - Grundlagen einrichten");
//alle Zehn Sekunden die Daten zum Server schicken
setInterval(transmitActions, 10000);

// zu Beginn Daten vom Server holen
fetchAlleSchwimmer().then(() => {
    // und  nach erhalt die der verwalteten Bahnen eintragen
    fillSchwimmerAusMeinenBahnen();
    // und einmal zeichnen
    render();
});

