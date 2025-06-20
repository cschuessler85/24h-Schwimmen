  SELECT
	*,
	CAST(json_extract(parameter, '$[0]') AS INTEGER) AS schwimmerID, 
	json_extract(parameter, '$[1]') AS anzahl 
  FROM actions 
  WHERE kommando = "ADD" AND schwimmerID = 1 
ORDER BY zeitstempel ASC;
