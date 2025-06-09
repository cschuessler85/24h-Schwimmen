select 
  a.schwimmerID,
  s.name,
  s.bahnanzahl as Anz,
  a.anzahl as ActionAnz,
  a.kommando
FROM (
  SELECT
	kommando,
	CAST(json_extract(parameter, '$[0]') AS INTEGER) AS schwimmerID, 
	count(json_extract(parameter, '$[1]')) AS anzahl 
  FROM actions 
  WHERE kommando = "ADD" 
  GROUP BY schwimmerID 
) a
JOIN schwimmer s ON s.nummer = a.schwimmerID 
WHERE Anz <> ActionAnz
ORDER BY schwimmerID ASC;
