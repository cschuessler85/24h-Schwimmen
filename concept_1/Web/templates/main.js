document.getElementById('schwimmerHinzufuegen').addEventListener('click', schwimmerHinzufuegen);
function schwimmerHinzufuegen() {
    var nummer = prompt("Nummer:");

    // Neue Zeile erstellen
    var neueZeile = document.createElement('tr');
      
    // Zellen in der neuen Zeile erstellen
    var nummerZelle = document.createElement('td');
    var bahnenZelle = document.createElement('td');
    
    // Text in die Zellen einfügen
    nummerZelle.innerText = nummer;
    bahnenZelle.innerText = 0;
    
    // Zellen zur neuen Zeile hinzufügen
    neueZeile.appendChild(nummerZelle);
    neueZeile.appendChild(bahnenZelle);
    
    // Die neue Zeile in die Tabelle einfügen
    var tabelle = document.getElementById('schwimmer');
    tabelle.appendChild(neueZeile);
}