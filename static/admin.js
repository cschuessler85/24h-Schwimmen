
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

document
    .getElementById("downloadBackupBtn")
    .addEventListener("click", () => {
        fetch("/admin/backup")
            .then((res) => res.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "backup.json";
                a.click();
                URL.revokeObjectURL(url);
            });
    });

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

function showSwimmerTable() {
    fetchAndFillTable('swimmer', 'swimmerTable', 'get_table_swimmer', 'Schwimmer');
}

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

document.addEventListener("DOMContentLoaded", () => showSection("adduser"));