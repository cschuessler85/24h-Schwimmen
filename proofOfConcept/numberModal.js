// Funktion, um das Modal anzuzeigen
function schwimmerNummerErfragen() {
    document.getElementById('schwimmerModal').style.display = 'block';
    checkNummerInput();
}

// Funktion zum Schließen des Modals
function closeModal() {
    document.getElementById('schwimmerModal').style.display = 'none';
}

// Funktion zum Bestätigen der Nummer
function confirmNummer() {
    const nummer = document.getElementById('nummer').value;
    if (nummer) {
        alert('Schwimmer Nummer ' + nummer + ' wurde bestätigt!');
        closeModal(); // Modal schließen nach Bestätigung
    } else {
        alert('Bitte eine Nummer eingeben!');
    }
}

function isNummerInputValid(value) {
    // Prüft, ob der Eingabewert eine durch Kommas getrennte Liste von Zahlen ist,
    // z. B. "3", "1,2", "10,20,30", aber kein leerer String.
    // Regulärer Ausdruck:
    // ^         → Anfang des Strings
    // \d+       → mindestens eine Ziffer
    // (,\d+)*   → optional beliebig viele Gruppen aus Komma gefolgt von mindestens einer Ziffer
    // $         → Ende des Strings
    return /^\d\d\d$/.test(value.trim());
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
    document.getElementById('nummer').value = ''; // Eingabefeld leeren
}

window.addEventListener('resize', () => {
   const ueberschrift = document.querySelector("h2");
   ueberschrift.style.color = "blue";
});

setInterval(() => {
    const ueberschrift = document.querySelector("h2");
    ueberschrift.style.color = "";
    const modalContent = document.getElementById("modalContent");
    modalContent.style.top = "10%";
  }, 5000);