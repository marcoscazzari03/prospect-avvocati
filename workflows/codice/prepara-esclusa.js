// Grande azienda palese: niente ricerca email ne RocketReach.
// Finisce negli Scartati con motivo definitivo.
return {
  json: {
    ...$json,
    'Email trovata sito': '',
    'Email RocketReach': '',
    'LinkedIn RocketReach': '',
    'Stato RocketReach': 'ESCLUSA: ' + $json.motivo_esclusione
  }
};
