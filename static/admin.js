import { showStatusMessage } from './mymodals.js'
import { initCSVImport } from './csvImport.js'

// Globale Variablen für die Schwimmer Tabelle
let swimmerData = [];
let swimmerCurrentPage = 1;
let swimmerRowsPerPage = 10;

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

function showUserTable() {
    fetchAndFillTable('user', 'userTable', 'get_table_benutzer', 'Benutzer');
}

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
            csvbutton.addEventListener("click", () => downloadCSV(swimmerData, ["nummer","name","bahnanzahl"]));
            section.appendChild(csvbutton);
            // Seitendarstellungskontrolle
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
            initCSVImport('#csvInput', '#csvPreviewContainer', '#csvSend', { url: '/admin' });
            renderSwimmerTable();
        })
        .catch(error => {
            console.error('Fehler beim Abrufen der Schwimmer-Daten:', error);
        });
}

function renderSwimmerTable() {
    const table = document.getElementById('swimmerTable');
    table.innerHTML = ''; // Erst mal löschen
    table.style.margin = '5px auto';

    // Tabellen-Header erzeugen
    const headerRow = document.createElement('tr');
    ['Nummer', 'Name', 'Bahnanzahl', 'auf_bahn', 'aktiv', 'Aktionen'].forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Daten sortieren
    const sorted = [...swimmerData].sort((a, b) => parseInt(a.nummer) - parseInt(b.nummer));

    // Seitenanzahl
    const start = (swimmerCurrentPage - 1) * swimmerRowsPerPage;
    const pageData = swimmerRowsPerPage === 0 ? sorted : sorted.slice(start, start + swimmerRowsPerPage);

    pageData.forEach(entry => {
        const row = document.createElement('tr');

        // Nummer klickbar
        const nummerCell = document.createElement('td');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = entry.nummer;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            editSwimmer(entry.nummer);
        });
        nummerCell.appendChild(link);
        row.appendChild(nummerCell);

        // Name, Bahnanzahl, auf_bahn, aktiv
        ['name', 'bahnanzahl', 'auf_bahn', 'aktiv'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = (entry[key] ? entry[key] : (entry[key] == 0 ? '0' : ''));
            td.style.whiteSpace = 'nowrap';
            row.appendChild(td);
        });

        // Aktionen
        const actionTd = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Löschen';
        delBtn.onclick = () => deleteSwimmer(entry.nummer);
        actionTd.appendChild(delBtn);
        row.appendChild(actionTd);

        table.appendChild(row);
    });

    renderPaginationControls();
}

function renderPaginationControls() {
    const controls = document.getElementById('paginationControls');
    controls.innerHTML = '';
    const totalPages = swimmerRowsPerPage === 0 ? 1 : Math.ceil(swimmerData.length / swimmerRowsPerPage);

    const back = document.createElement('button');
    back.textContent = 'Zurück';
    back.disabled = swimmerCurrentPage === 1;
    back.onclick = () => { swimmerCurrentPage--; renderSwimmerTable(); };

    const next = document.createElement('button');
    next.textContent = 'Weiter';
    next.disabled = swimmerCurrentPage === totalPages;
    next.onclick = () => { swimmerCurrentPage++; renderSwimmerTable(); };

    const label = document.createElement('span');
    label.innerText = 'Einträge pro Seite:';
    label.style.marginLeft = '20px';

    const select = document.createElement('select');
    select.style.margin = '0px 20px 0px 0px';
    [10, 20, 50, 0].forEach(size => {
        const option = document.createElement('option');
        option.value = size;
        option.textContent = size === 0 ? 'Alle' : size;
        if (swimmerRowsPerPage === size) option.selected = true;
        select.appendChild(option);
    });
    select.onchange = (e) => {
        swimmerRowsPerPage = parseInt(e.target.value);
        swimmerCurrentPage = 1;
        renderSwimmerTable();
    };


    controls.appendChild(back);
    controls.appendChild(label)
    controls.appendChild(select);
    controls.appendChild(next);
}

function editSwimmer(nummer) {
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

function fetchAndFillTable(sectionId, tableId, actionName, titleName) {
    showSection(sectionId);
    fetch('/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action: actionName })
    })
        .then(response => response.json())
        .then(data => {
            console.log(`${titleName}-Table füllen, data.length`, data.length);

            const sectionTitle = document.querySelector(`#${sectionId} h2`);
            sectionTitle.textContent = `${titleName} (${data.length})`;

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
