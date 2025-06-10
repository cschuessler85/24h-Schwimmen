// Hooks werden aus dem React Objekt geholt
// useState: Speichert und verwaltet veränderliche Daten, die beim Rendern die UI beeinflussen
//           (z.B. Schwimmerdaten, Filterzustand).
// useEffect: Führt Nebenwirkungen aus, z.B. Daten laden, Timer starten, oder Scroll-Intervalle
//            einrichten – also Code, der nicht direkt beim Rendern passiert.
// useRef: Hält veränderliche Werte oder DOM-Referenzen, die sich ändern können, ohne ein
//         erneutes Rendern auszulösen (z.B. Scroll-Position oder Zugriff auf das linke Container-Element).

const { useState, useEffect, useRef } = React;

let lastupdate = new Date("2000-01-01T00:00:00Z").toISOString();
const offsetInMinutes = new Date().getTimezoneOffset();
const offsetInMillis = -offsetInMinutes * 60 * 1000;

function gibNeueEintraege(neueListe, vorhandeneListe) {
    return neueListe.filter(neu =>
        !vorhandeneListe.some(alt =>
            alt.kommando === neu.kommando &&
            alt.parameter === neu.parameter &&
            alt.zeitstempel === neu.zeitstempel
        )
    );
}

function App() {
    let curSwimmerMap = {};
    let curActions = [];
    const [swimmerMap, setSwimmerMap] = useState({});
    // Referenz zum Zwischenspeichern des jeweils aktuellen swimmerMap-States
    const [filterAuswahl, setFilterAuswahl] = useState("");
    const [shiftLockAktiv, setShiftLockAktiv] = useState(false);
    const swimmerMapRef = useRef(swimmerMap);
    const [lapLog, setLapLog] = useState([]);
    const [filter, setFilter] = useState({ gruppe: null, nurKinder: false, sortierung: "bahnanzahl" });
    const leftRef = useRef();
    const scrollPosition = useRef(0);
    let spezialzeiten = [];

    function initSpezialzeiten(date=new Date()) {
        const tomorrow = (new Date(date))
        tomorrow.setHours(date.getHours()+24);
        spezialzeiten = [
            {name: "Tag1", start: (new Date(date)).setHours(0,0,0), end: (new Date(date).setHours(23,59,59))},
            {name: "Geisterstunde", start: (new Date(tomorrow)).setHours(0,0,0), end: (new Date(tomorrow).setHours(0,59,59))},
            {name: "Gute Nacht", start: (new Date(tomorrow)).setHours(1,0,0), end: (new Date(tomorrow).setHours(4,59,59))},
            {name: "Frühaufsteher", start: (new Date(tomorrow)).setHours(5,0,0), end: (new Date(tomorrow).setHours(5,59,59))},
            {name: "Tag2", start: (new Date(tomorrow)).setHours(6,0,0), end: (new Date(tomorrow).setHours(23,59,59))}
        ];
        console.log("Spezialzeiten", spezialzeiten);
    }

    function downloadCSV(headers = ["nummer", "vorname", "nachname", "bahnanzahl"]) {
        const maxID = Math.max(...Object.keys(curSwimmerMap).map(s => parseInt(s)));
        console.log("Maximum:", maxID);
        headersspezial = spezialzeiten.map((szeit) => szeit.name);
        console.log(`headersspezial: ${headersspezial}`);
        headers = headers.concat(headersspezial);
        console.log("curSwimmerMap", curSwimmerMap);

        let csvRows = [
            "id," + headers.join(',') // Kopfzeile
        ];

        for (let i = 0; i < maxID; i++) {
            if (curSwimmerMap[i + 1]) {
                csvRows.push(`${i + 1},` +
                    headers.map(header => `"${(curSwimmerMap[i + 1][header] ?? '').toString().replace(/"/g, '""')}"`).join(',')
                );
            } else {
                csvRows.push(`${i + 1},` +
                    headers.map(header => `"0"`).join(',')
                );
            }
        }

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

    function updateBahnen(schwimmerID, anzahl = 1, zeit = new Date().toISOString()) {
        if (curSwimmerMap[schwimmerID]) {
            const s = { ...curSwimmerMap[schwimmerID] }
            s.bahnanzahl += anzahl;
            zeitD = new Date(zeit);
            spezialzeiten.forEach((t) => {
                if (zeitD>t.start && zeitD < t.end) {
                    console.log(`${t.name} bei Schwimmer ${schwimmerID} - Zeit: ${zeit}`);
                    s[t.name] = (s[t.name] ? s[t.name]+anzahl : 1); // Mit 1 initialisieren - erste Bahn dieses Typs
                }
            })
            curSwimmerMap[schwimmerID] = s;
            setSwimmerMap({ ...curSwimmerMap });
            const newlapcount = s.bahnanzahl
            const lzeit = new Date((new Date(zeit)).getTime() + offsetInMillis);
            setLapLog((prev) => [{
                schwimmer: schwimmerID,
                zeit: lzeit.toISOString(),
                laps: newlapcount,
                vorname: s.vorname
            }, ...prev.slice(0, 19)]);
        }
    }

    function holeNeueDaten(since) {
        fetch('/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([{ 'kommando': "VIEW", 'parameter': (since ? [since] : []), 'timestamp': new Date().toISOString() }])
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.swimmerMap) {
                    data.swimmerMap.forEach(s => {
                        s.bahnanzahl = 0;
                        spezialzeiten.forEach(szeit => s[szeit.name]=0);
                        curSwimmerMap[s.nummer] = s;
                    })
                    //console.log(`curSwimmerMap ist ein Array ${Array.isArray(curSwimmerMap)}`);
                    //console.log("curSwimmerMap", JSON.stringify(curSwimmerMap));

                    setSwimmerMap({ ...curSwimmerMap })
                }
                if (data.lapLog) setLapLog(data.lapLog);
                if (data.actions) {
                    //console.log("data.actions", JSON.stringify(data.actions));
                    let datasorted = data.actions.filter((x) => x.kommando == "ADD")
                    datasorted.sort((a, b) => a.zeitstempel.localeCompare(b.zeitstempel));
                    const neueElemente = gibNeueEintraege(datasorted, curActions);
                    neueElemente.forEach(element => {
                        // Wenn noch nicht in curActions vorhanden, einfügen
                        curActions.push(element);
                        // und Bahnazahl aktualisieren
                        const parameter = JSON.parse(element.parameter);
                        if (curSwimmerMap[parameter[0]]) {
                            if (lastupdate < element.zeitstempel) lastupdate = element.zeitstempel
                            //console.log(`Update ${parameter[0]} - ${parameter[1]}, ${element.zeitstempel}`);
                            updateBahnen(parseInt(parameter[0]), parseInt(parameter[1]), element.zeitstempel);
                        } else {
                            console.log(`Schwimmer ${parameter[0]} gibt es noch nicht`);
                        }
                    });
                }
                if (data.filter) setFilter(data.filter);
            })
            .catch((err) => console.error("Fehler beim Laden:", err));
    }

    // Effekt: immer wenn swimmerMap sich ändert, aktualisiere die Ref
    useEffect(() => {
        swimmerMapRef.current = swimmerMap;
    }, [swimmerMap]);

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.shiftKey && e.key === "L") {
                setShiftLockAktiv((prev) => !prev);
            } else if (e.shiftKey && e.key === "D") {
                console.log("Download gedrückt");
                downloadCSV();
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        holeNeueDaten();
        initSpezialzeiten(new Date("2025-06-09T00:00:00Z"));
    }, []); // [] - sorgt dafür, dass dieser Effect (diese Funktion) nur ein einziges Mal ausgeführt wird

    // Der Timer für das holen neuer Daten
    useEffect(() => {
        const interval10 = setInterval(() => {
            const date = new Date(lastupdate);
            date.setHours(date.getHours() - 1); // Hole die Daten der letzten Stunde
            holeNeueDaten(date);
        }, 5000); // alle 5 Sekunden
        return () => clearInterval(interval10); // Aufräumen bei Komponentendemontage
    }, []);

    // Der Timer wird in Use-Effect gepackt, damit er erst nach dem ersten Rendern ausgeführt wird
    useEffect(() => {
        if (!shiftLockAktiv) return; // Nur aktivieren wenn Shift Lock aktiv

        const scrollInt = setInterval(() => {
            const container = leftRef.current;
            if (!container) return;
            scrollPosition.current += 8;
            if (scrollPosition.current >= container.scrollHeight - container.clientHeight) {
                scrollPosition.current = 0;
            }
            container.scrollTop = scrollPosition.current;
        }, 100);

        return () => clearInterval(scrollInt); // Aufräumen
    }, [shiftLockAktiv]); // Neu starten bei Änderung von shiftLockAktiv


    let gefiltert = Object.values(swimmerMap);
    if (filterAuswahl === "nurKinder") {
        gefiltert = gefiltert.filter((s) => s.istKind);
    } else if (filterAuswahl.startsWith("gruppe-")) {
        const gruppe = filterAuswahl.split("-")[1];
        gefiltert = gefiltert.filter((s) => s.gruppe === gruppe);
    }
    gefiltert.sort((a, b) => b.bahnanzahl - a.bahnanzahl);

    return React.createElement('div', { id: 'root' },
        React.createElement('div', { className: 'left', ref: leftRef },
            React.createElement('h2', null, 'Ranking'),
            React.createElement('select', { value: filterAuswahl, onChange: (e) => setFilterAuswahl(e.target.value) },
                React.createElement('option', { value: '' }, 'Alle anzeigen'),
                React.createElement('option', { value: 'nurKinder' }, 'Nur Kinder')
            ),
            React.createElement('table', null,
                React.createElement('thead', null,
                    React.createElement('tr', null,
                        React.createElement('th', null, '#'),
                        React.createElement('th', null, 'Name'),
                        React.createElement('th', null, 'Gruppe'),
                        React.createElement('th', null, 'Bahnen')
                    )
                ),
                React.createElement('tbody', null,
                    gefiltert.map((s, i) =>
                        React.createElement('tr', { key: s.nummer },
                            React.createElement('td', null, i + 1),
                            React.createElement('td', null, `(${s.nummer}) ${s.vorname} ${s.nachname}`),
                            React.createElement('td', null, s.gruppe),
                            React.createElement('td', null, s.bahnanzahl)
                        )
                    )
                )
            )
        ),
        React.createElement('div', { className: 'right' },
            React.createElement('h2', null, 'Letzte Bahnen'),
            lapLog.map((l, i) =>
                React.createElement('div', { key: i },
                    `${l.zeit.split("T")[1].split(".")[0]} – ${l.vorname} (${l.schwimmer}) hat angeschlagen: ${l.laps} Bahnen`
                )
            )
        )
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));