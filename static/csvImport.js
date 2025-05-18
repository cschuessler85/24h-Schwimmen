export function initCSVImport(fileInputSelector, previewContainerSelector, sendButtonSelector, options = {}) {
    const fileInput = document.querySelector(fileInputSelector);
    const previewContainer = document.querySelector(previewContainerSelector);
    const sendButton = document.querySelector(sendButtonSelector);

    let parsedData = [];

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        parsedData = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
        });

        renderPreview(headers, parsedData, previewContainer);
    });

    sendButton.addEventListener('click', async () => {
        if (parsedData.length === 0) return;
        try {
            const url = options.url || '/admin';
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'import_schwimmer',
                    data: parsedData
                })
            });
            const result = await response.json();
            //TODO Antwort auswerten bzw. anzahl der Importierten Schwimmer anzeigen
            alert(result.message || 'Import abgeschlossen.');
        } catch (error) {
            //TODO - muss hier ggf auch ein Verbindungsverlust geprüft werden?
            alert(`Fehler beim Senden: ${error.message}`);
        }
    });
}

let currentPage = 0;
let csvHeaders = [];
let csvData = [];

function renderPreview(headers, data, container) {
    // Bei erstem Aufruf: Initialisiere Daten und baue Steuerelemente
    if (headers && data) {
        csvHeaders = headers;
        csvData = data;
        currentPage = 0;

        container.innerHTML = `
      <div>
        Zeige 
        <input type="number" id="previewSize" value="20" min="1" style="width: 4ch;"> Einträge pro Seite
      </div>
      <div id="csvTableContainer"></div>
      <div>
        <button id="prevPage">Zurück</button>
        <span id="pageInfo"></span>
        <button id="nextPage">Weiter</button>
      </div>
    `;

        document.getElementById("previewSize").addEventListener("input", () => {
            currentPage = 0;
            renderPreview(); // Nur Tabelle neu
        });

        document.getElementById("prevPage").addEventListener("click", () => {
            if (currentPage > 0) {
                currentPage--;
                renderPreview();
            }
        });

        document.getElementById("nextPage").addEventListener("click", () => {
            const previewSize = parseInt(document.getElementById("previewSize").value, 10) || 20;
            if ((currentPage + 1) * previewSize < csvData.length) {
                currentPage++;
                renderPreview();
            }
        });
    }

    // Tabelle neu rendern
    const tableContainer = document.getElementById("csvTableContainer");
    const previewSize = parseInt(document.getElementById("previewSize").value, 10) || 20;
    const start = currentPage * previewSize;
    const end = start + previewSize;
    const pageRows = csvData.slice(start, end);

    const table = document.createElement("table");
    table.innerHTML = `<thead><tr>${csvHeaders.map(h => `<th>${h}</th>`).join("")}</tr></thead>`;

    const tbody = document.createElement("tbody");
    for (const row of pageRows) {
        const tr = document.createElement("tr");
        tr.innerHTML = csvHeaders.map(h => `<td>${row[h] ?? ""}</td>`).join("");
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    tableContainer.innerHTML = "";
    tableContainer.appendChild(table);

    // Seiteninfo aktualisieren
    const totalPages = Math.ceil(csvData.length / previewSize);
    document.getElementById("pageInfo").textContent = `Seite ${currentPage + 1} / ${totalPages}`;
}
