import { showStatusMessage } from './mymodals.js'
import { initCSVImport, initJSONImport } from './csvImport.js'

// Globale Variablen für die Schwimmer und User Tabelle
let swimmerData = [];
let userData = [];
let tableCurrentPage = 1;
let tableRowsPerPage = 10;

const adminButton = document.getElementById("adminAktionen");
const adminMenu = document.getElementById("adminMenu");

adminButton.addEventListener("click", (e) => {
    adminMenu.style.left = e.pageX + "px";
    adminMenu.style.top = e.pageY + "px";
    adminMenu.style.display = "block";
});

document.addEventListener("click", (e) => {
    //console.log("click auf Target", e.target);
    if (e.target !== adminButton) {
        adminMenu.style.display = "none";
    }
});

document.getElementById("downloadBackupBtn")
    .addEventListener("click", () => window.open('/backupsql'));

document.getElementById("new_password_form").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    fetch("/admin", {
        method: "POST",
        body: formData
    })
        .then(response => {
            return response.text().then(text => {
                showStatusMessage(text, response.ok);
            });
        })
        .catch(err => {
            showStatusMessage("NETZWERKFEHLER: " + err.message, false);
        });
});

function initNav() {
    //initialisiert die Naviagtionsleiste
    const navbar = document.getElementById('navbar');
    let button = document.createElement('button');
    button.innerText = "Benutzer";
    button.addEventListener('click', (e) => showUserTable());
    navbar.appendChild(button);
    button = document.createElement('button');
    button.innerText = "Clients";
    button.addEventListener('click', (e) => showClientTable());
    navbar.appendChild(button);
    button = document.createElement('button');
    button.innerText = "Schwimmer";
    button.addEventListener('click', (e) => showSwimmerTable());
    navbar.appendChild(button);
    button = document.createElement('button');
    button.innerText = "Aktionen";
    button.addEventListener('click', (e) => showActionsTable());
    navbar.appendChild(button);
    button = document.createElement('button');
    button.innerText = "Checks";
    button.addEventListener('click', (e) => showChecksSection());
    navbar.appendChild(button);
}

function initAdminMenu() {
    const adminMenuUL = document.getElementById('adminMenu').querySelector('ul');
    let li = document.createElement('li');
    li.innerText = "Benutzer anlegen";
    li.addEventListener('click', (e) => showSection('adduser'));
    adminMenuUL.appendChild(li);
    li = document.createElement('li');
    li.innerText = "Schwimmer verwalten";
    li.addEventListener('click', (e) => showSection('swimmer'));
    adminMenuUL.appendChild(li);
    li = document.createElement('li');
    li.innerText = "Aktionen ansehen";
    li.addEventListener('click', (e) => showSection('actions'));
    adminMenuUL.appendChild(li);
    li = document.createElement('li');
    li.innerText = "QR - Code";
    li.addEventListener('click', (e) => window.open('/show_qr', '_blank'));
    adminMenuUL.appendChild(li);
}

function showSection(id) {
    document
        .querySelectorAll(".admin-section")
        .forEach((s) => (s.style.display = "none"));
    document.getElementById(id).style.display = "block";
}

// ************ Render User Table *****************
function showUserTable() {
    showSection('user');
    // Initiales Laden
    fetch('/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'get_table_benutzer' })
    })
        .then(response => response.json())
        .then(data => {
            userData = data;
            console.log("Userdaten gelesen", data);
            const section = document.querySelector('#user');
            section.innerHTML = '';
            const heading = document.createElement('h2');
            heading.textContent = `Benutzer (${data.length})`;
            heading.style.display = "inline-block";
            section.appendChild(heading);
            // Button um CSV herunterzuladen
            const csvbutton = document.createElement('Button');
            csvbutton.textContent = "CSV";
            csvbutton.style.margin = "0px 20px";
            csvbutton.addEventListener("click", () => downloadCSV(userData));
            section.appendChild(csvbutton);
            // Seitendarstellungskontrolle
            // Alle alten Divs paginationcontrol löschen - sollte maximal eins sein
            document.querySelectorAll('div#paginationControls').forEach(el => el.remove());
            const controls = document.createElement('div');
            controls.id = 'paginationControls';
            section.appendChild(controls);
            // Tabelle für die Daten
            const stable = document.createElement('table');
            stable.id = 'userTable';
            section.appendChild(stable);
            // Bereich für den Datenimport
            section.appendChild(document.createElement('hr'));
            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'csvInput';
            section.appendChild(input);
            const div = document.createElement('div');
            div.id = 'csvPreviewContainer';
            section.appendChild(div);
            const button = document.createElement('button');
            button.id = "csvSend";
            button.innerText = 'Importieren';
            section.appendChild(button);
            initCSVImport('#csvInput', '#csvPreviewContainer', '#csvSend', { url: '/admin' });
            renderTable(userData, 'userTable', ['id', 'name', 'benutzername', 'admin'], { 'Del': delUser, 'Edit': editUser });
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Schwimmer-Daten:', error);
        });
}

function editUser(nummer) { //TODO
    alert(`Bearbeite Nutzer: ${nummer}`); // Placeholder
}

function delUser(nummer) {
    if (confirm(`Benutzer ${nummer} wirklich löschen?`)) {
        fetch('/admin', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "delete_user",
                nummer: nummer
            }),
        })
            .then(response => response.text().then(text => {
                if (response.ok) {
                    showStatusMessage(`Benutzer ${nummer} gelöscht`, true);
                    showUserTable();
                } else {
                    showStatusMessage(`Fehler beim Löschen:\n${text}`, false);
                }
            }))
            .catch(error => {
                showStatusMessage(`Netzwerkfehler: ${error}`, false);
                console.error('Netzwerkfehler:', error);
            });
    }
}



// ***************** Render Client Table ***************************
function showClientTable() {
    fetchAndFillTable('client', 'clientTable', 'get_table_clients', 'Clients');
}

// ************ Render Swimmer Table *****************
function showSwimmerTable() {
    showSection('swimmer');
    // Initiales Laden
    fetch('/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: 'get_table_swimmer' })
    })
        .then(response => response.json())
        .then(data => {
            swimmerData = data;
            console.log("Schwimmerdaten gelesen", data);
            const section = document.querySelector('#swimmer');
            section.innerHTML = '';
            const heading = document.createElement('h2');
            heading.textContent = `Schwimmer (${data.length})`;
            heading.style.display = "inline-block";
            section.appendChild(heading);
            // Button um CSV herunterzuladen
            const csvbutton = document.createElement('Button');
            csvbutton.textContent = "CSV";
            csvbutton.style.margin = "0px 20px";
            csvbutton.addEventListener("click", () => downloadCSV(swimmerData, ["nummer", "vorname", "nachname", "istKind", "gruppe", "bahnanzahl"]));
            section.appendChild(csvbutton);
            // Seitendarstellungskontrolle
            // Alle alten Divs paginationcontrol löschen - sollte maximal eins sein
            document.querySelectorAll('div#paginationControls').forEach(el => el.remove());
            const controls = document.createElement('div');
            controls.id = 'paginationControls';
            section.appendChild(controls);
            // Tabelle für die Daten
            const stable = document.createElement('table');
            stable.id = 'swimmerTable';
            section.appendChild(stable);
            // Bereich für den Datenimport
            section.appendChild(document.createElement('hr'));
            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'csvInput';
            section.appendChild(input);
            const div = document.createElement('div');
            div.id = 'csvPreviewContainer';
            section.appendChild(div);
            const button = document.createElement('button');
            button.id = "csvSend";
            button.innerText = 'Importieren';
            section.appendChild(button);
            initCSVImport('#csvInput', '#csvPreviewContainer', '#csvSend', { url: '/admin',
                knownHeaders: ['', 'nummer', 'vorname', 'nachname', 'istKind', 'istErw', 'gruppe']
             });
            renderTable(swimmerData, 'swimmerTable', ['nummer', 'vorname', 'nachname', 'istKind', 'gruppe', 'bahnanzahl', 'auf_bahn', 'aktiv'], { 'Del': deleteSwimmer, 'Edit': editSwimmer });
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Schwimmer-Daten:', error);
        });
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


function renderTable(data, table_id, header = ['nummer', 'name', 'bahnanzahl', 'auf_bahn', 'aktiv'], aktionen = {}) {
    const table = document.getElementById(table_id);
    table.innerHTML = ''; // Erst mal löschen
    table.style.margin = '5px auto';

    console.log(`Aktionen: ${aktionen}`);

    // Tabellen-Header erzeugen
    const headerRow = document.createElement('tr');
    header.concat((Object.keys(aktionen).length > 0 ? ['Aktionen'] : [])).forEach(key => {
        const th = document.createElement('th');
        th.textContent = capitalizeFirstLetter(key);
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Daten sortieren
    const sorted = [...data].sort((a, b) => parseInt(a.nummer) - parseInt(b.nummer));

    // Seitenanzahl
    const totalPages = tableRowsPerPage === 0 ? 1 : Math.ceil(data.length / tableRowsPerPage);
    tableCurrentPage = Math.min(tableCurrentPage, totalPages)
    const start = (tableCurrentPage - 1) * tableRowsPerPage;
    const pageData = tableRowsPerPage === 0 ? sorted : sorted.slice(start, start + tableRowsPerPage);

    pageData.forEach(entry => {
        //console.log("Entry",entry);
        const row = document.createElement('tr');
        // Zellen erstellen
        header.forEach(key => {
            const td = document.createElement('td');
            //const key_tl = key.toLowerCase();
            td.textContent = (entry[key] ? entry[key] : (entry[key] == 0 ? '0' : ''));
            td.style.whiteSpace = 'nowrap';
            row.appendChild(td);
        });

        // Aktionen
        if (Object.keys(aktionen).length > 0) {
            console.log("Creating Aktion TD");
            const actionTd = document.createElement('td');
            actionTd.style.whiteSpace = 'nowrap';
            for (const [key, value] of Object.entries(aktionen)) {
                const delBtn = document.createElement('button');
                delBtn.textContent = key;
                delBtn.onclick = () => value(entry[header[0].toLowerCase()]);
                actionTd.appendChild(delBtn);
            }
            row.appendChild(actionTd);
        }

        table.appendChild(row);
    });

    renderPaginationControls(data, table_id, header);
}


function renderPaginationControls(data, table_id, header) {
    const controls = document.getElementById('paginationControls');
    controls.innerHTML = '';
    const totalPages = tableRowsPerPage === 0 ? 1 : Math.ceil(data.length / tableRowsPerPage);

    const back = document.createElement('button');
    back.textContent = 'Zurück';
    back.disabled = tableCurrentPage === 1;
    back.onclick = () => { tableCurrentPage--; renderTable(data, table_id, header); };

    const next = document.createElement('button');
    next.textContent = 'Weiter';
    next.disabled = tableCurrentPage === totalPages;
    next.onclick = () => { tableCurrentPage++; renderTable(data, table_id, header); };

    const label = document.createElement('span');
    label.innerText = 'Einträge pro Seite:';
    label.style.marginLeft = '20px';

    const select = document.createElement('select');
    select.style.margin = '0px 20px 0px 0px';
    [10, 20, 50, 0].forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size === 0 ? 'Alle' : size;
        if (tableRowsPerPage === size) option.selected = true;
        select.appendChild(option);
    });
    select.onchange = (e) => {
        tableRowsPerPage = parseInt(e.target.value);
        tableCurrentPage = 1;
        renderTable(data, table_id, header);
    };


    controls.appendChild(back);
    controls.appendChild(label)
    controls.appendChild(select);
    controls.appendChild(next);
}

function editSwimmer(nummer) { //TODO
    alert(`Bearbeiten: ${nummer}`); // Placeholder
}

function deleteSwimmer(nummer) {
    if (confirm(`Schwimmer ${nummer} wirklich löschen?`)) {
        fetch('/admin', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "delete_swimmer",
                nummer: nummer
            }),
        })
            .then(response => response.text().then(text => {
                if (response.ok) {
                    showStatusMessage(`Benutzer ${nummer} gelöscht`, true);
                    showSwimmerTable();
                } else {
                    showStatusMessage(`Fehler beim Löschen:\n${text}`, false);
                }
            }))
            .catch(error => {
                showStatusMessage(`Netzwerkfehler: ${error}`, false);
                console.error('Netzwerkfehler:', error);
            });
    }
}

// *****************Ende Swimmer-Tabelle **************

function showActionsTable() {
    fetchAndFillTable('actions', 'actionsTable', 'get_table_actions', 'Actions');
}

function showChecksSection() {
    showSection('checks');
    const checkSection = document.getElementById('checks');
    checkSection.innerHTML = ''; // erst leeren 
    let button = document.createElement('button');
    button.innerText = "Anzahlen Prüfen";
    button.addEventListener('click', (e) => fetchAndFillTable(null, 'checkAnzahlenTable', 'get_checkAnzahlTable', 'Anzahlen'));
    checkSection.appendChild(button);
    const info = document.createElement('span');
    info.innerText = "Gibt Schwimmer aus, bei denen die Anzahlen in Actions nicht denen in der Schwimmer-Tabelle entspricht"
    checkSection.appendChild(info);
    let table = document.createElement('table');
    table.id = "checkAnzahlenTable";
    checkSection.appendChild(table);
    let heading = document.createElement('h2');
    heading.innerText = "ACTIONS importieren (JSON)";
    checkSection.appendChild(heading);
    // Bereich für die ImportDaten
    const adiv = document.createElement('div');
    adiv.id = 'actionsDiv';
    checkSection.appendChild(adiv);
    // Bereich für den Datenimport
    checkSection.appendChild(document.createElement('hr'));
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'jsonInput';
    checkSection.appendChild(input);
    const div = document.createElement('div');
    div.id = 'jsonPreviewContainer';
    checkSection.appendChild(div);
    button = document.createElement('button');
    button.id = "jsonSend";
    button.innerText = 'Importieren';
    checkSection.appendChild(button);
    initJSONImport('#jsonInput', '#jsonPreviewContainer', '#jsonSend', { url: '/action'});

}

function fetchAndFillTable(sectionId, tableId, actionName, titleName) {
    if (sectionId) showSection(sectionId);
    fetch('/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: actionName })
    })
        .then(response => response.json())
        .then(data => {
            console.log(`${titleName}-Table füllen, data.length`, data.length);

            if (sectionId) {
                const sectionTitle = document.querySelector(`#${sectionId} h2`);
                sectionTitle.textContent = `${titleName} (${data.length})`;
            }
            const table = document.getElementById(tableId);
            table.innerHTML = '';

            if (data.length > 0) {
                const headerRow = document.createElement('tr');
                Object.keys(data[0]).forEach(key => {
                    const th = document.createElement('th');
                    th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                    headerRow.appendChild(th);
                });
                table.appendChild(headerRow);

                data.forEach(entry => {
                    const row = document.createElement('tr');
                    Object.values(entry).forEach(value => {
                        const td = document.createElement('td');
                        td.classList.add('truncated');
                        td.textContent = value;
                        row.appendChild(td);
                    });
                    table.appendChild(row);
                });
            } else { //Data length == 0 - leere Rückgabe
                const headerRow = document.createElement('tr');
                const th = document.createElement('th');
                th.textContent = "Leere Tabelle"
                headerRow.appendChild(th);
                table.appendChild(headerRow);
            }
        })
        .catch(error => {
            console.error(`Fehler beim Abrufen der ${titleName}-Daten:`, error);
        });
}

function downloadCSV(data, customHeaders = null) {
    if (!data.length) return;

    const headers = customHeaders || Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // Kopfzeile
        ...data.map(obj =>
            headers.map(header => `"${(obj[header] ?? '').toString().replace(/"/g, '""')}"`).join(',')
        )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "schwimmerdaten.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function createUser(event) {
    event.preventDefault();

    const realname = document.getElementById("realname").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const isAdmin = document.getElementById("admin").checked;

    console.log("Benuzter anlegen", realname, username, isAdmin);
    const nameValid = /^[A-Za-zÄÖÜäöüß\s]+$/.test(realname);
    const usernameValid = /^[A-Za-z0-9]+$/.test(username);
    const passwordValid = password.length >= 3; // einfache Mindestlänge

    if (!nameValid || !usernameValid || !passwordValid) {
        alert("Bitte gültige Eingaben machen:\n- Name: nur Buchstaben/Leerzeichen\n- Benutzername: nur Buchstaben/Zahlen\n- Passwort: min. 6 Zeichen");
        return;
    }

    fetch("/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "create_user",
            realname,
            username,
            password,
            admin: isAdmin
        }),
    })
        .then((res) => res.text())
        .then((msg) => alert(msg));
}

//Navigationsleiste initialisieren
initNav();
// Admin-Menü (hambuger-Menü-links) initialisieren
initAdminMenu();
// Create User bekannt machen
window.createUser = createUser;

document.addEventListener("DOMContentLoaded", () => showSection("adduser"));
