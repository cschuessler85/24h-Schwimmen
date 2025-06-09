SELECT
  CAST(json_extract(parameter, '$[0]') AS INTEGER) AS schwimmerID,
  SUM(CASE 
        WHEN zeitstempel BETWEEN '2025-06-01T00:00:00' AND '2025-06-05T05:59:59' 
        THEN CAST(json_extract(parameter, '$[1]') AS INTEGER) 
        ELSE 0 
      END) AS anz_frueh,
  SUM(CASE 
        WHEN zeitstempel BETWEEN '2025-06-05T06:00:00' AND '2025-06-05T11:59:59' 
        THEN CAST(json_extract(parameter, '$[1]') AS INTEGER) 
        ELSE 0 
      END) AS anz_mittag,
  SUM(CASE 
        WHEN zeitstempel BETWEEN '2025-06-05T12:00:00' AND '2025-06-20T17:59:59' 
        THEN CAST(json_extract(parameter, '$[1]') AS INTEGER) 
        ELSE 0 
      END) AS anz_nachmittag
FROM actions
WHERE kommando = "ADD"
GROUP BY schwimmerID
ORDER BY schwimmerID;
