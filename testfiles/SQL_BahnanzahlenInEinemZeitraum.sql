SELECT
  CAST(json_extract(parameter, '$[0]') AS INTEGER) AS schwimmerID,
  SUM(CAST(json_extract(parameter, '$[1]') AS INTEGER)) AS geisterstunde
FROM actions
WHERE kommando = "ADD"
  AND zeitstempel BETWEEN '2025-06-04T18:00:00' AND '2025-06-04T20:10:00'
GROUP BY schwimmerID
ORDER BY schwimmerID;
