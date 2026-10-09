// RocketReach non ha restituito un ID: persona non trovata
// oppure richiesta respinta per rate limit (da riprovare).
const prospect = $('Email certa trovata?').item.json;
const testo = String($json.response ?? $json.detail ?? $json.message ?? '');
const stato = /rate limit/i.test(testo) ? 'RATE LIMIT' : 'PERSONA NON TROVATA';

return {
  json: {
    ...prospect,
    'Email RocketReach': '',
    'Email RocketReach tutte': '',
    'LinkedIn RocketReach': '',
    'Stato RocketReach': stato
  }
};
