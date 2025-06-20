SELECT client_id, zeitstempel, kommando, parameter, COUNT(*) as anzahl
FROM actions
GROUP BY client_id, zeitstempel, kommando, parameter
HAVING COUNT(*) > 1;
