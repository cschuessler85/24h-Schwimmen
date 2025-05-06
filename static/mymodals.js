
function initMyModal() {
    const modalHTML = `
    <div id="myModal" class="mymodal">
        <div id="modalContent" class="mymodal-content" style="text-align: center;">
        </div>
    </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML;
    document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
}


// Funktion, um das Modal anzuzeigen
function schwimmerNummerErfragen() {
    const innerHTML = `
            <h2>Schwimmer Nummer:</h2>
            <input type="number" id="nummer" name="nummer" oninput="checkNummerInput()" placeholder="xxx" maxlength="3" style="font-size: 3em;text-align: center; width: 100%;">
            <br>
            <button id="confirmBtn" onclick="confirmNummer()">Bestätigen</button>
            <button id="clearBtn" onclick="clearNummer()" style="display: none;">Löschen</button>
            <button onclick="closeModal()">Schließen</button>
    `;
    document.getElementById('modalContent').innerHTML = innerHTML;
    const input = document.getElementById("nummer");
    clearNummer();
    document.getElementById('myModal').style.display = 'block';
    input.focus();
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmNummer();
        }
    });
    checkNummerInput();
}

// Funktion zum Schließen des Modals
function closeModal() {
    document.getElementById('myModal').style.display = 'none';
}

// Funktion zum Bestätigen der Nummer
function confirmNummer() {
    const nummer = document.getElementById("nummer").value;
    if (nummer) {
        alert('Schwimmer Nummer ' + nummer + ' wurde bestätigt!');
        closeModal(); // Modal schließen nach Bestätigung
    } else {
        alert('Bitte eine Nummer eingeben!');
    }
}

function isNummerInputValid(value, regexp = /^\d\d\d$/) {
    // Prüft, ob der Eingabewert aus drei aufeinander folgenden Ziffern besteht
    // Regulärer Ausdruck:
    // ^         → Anfang des Strings
    // \d+       → mindestens eine Ziffer
    // (,\d+)*   → optional beliebig viele Gruppen aus Komma gefolgt von mindestens einer Ziffer
    // $         → Ende des Strings
    return regexp.test(value.trim());
}

function checkNummerInput() {
    const input = document.getElementById("nummer");
    const confirmBtn = document.getElementById("confirmBtn");
    if (isNummerInputValid(input.value)) {
        input.style.backgroundColor = ""; // gültig
        confirmBtn.disabled = false;
    } else {
        input.style.backgroundColor = "#fdd"; // ungültig (rot)
        confirmBtn.disabled = true;
    }
}

// Funktion zum Löschen der Eingabe
function clearNummer() {
    document.getElementById("nummer").value = ''; // Eingabefeld leeren
}

initMyModal();