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
        const url = options.url || '/import_schwimmer';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsedData)
        });
        const result = await response.json();
        alert(result.message || 'Import abgeschlossen.');
    });
}

function renderPreview(headers, rows, container) {
    container.innerHTML = '';
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        th.style.border = '1px solid #ccc';
        th.style.padding = '4px';
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            td.textContent = row[h] ?? '';
            td.style.border = '1px solid #ccc';
            td.style.padding = '4px';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
}
