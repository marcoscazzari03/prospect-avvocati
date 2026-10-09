const prospect = $('Email certa trovata?').item.json;
const rr = $json;

const testoErrore = String(rr.response ?? rr.detail ?? rr.message ?? '');
const rateLimit = /rate limit/i.test(testoErrore);
const inCorso = ['progress', 'searching', 'waiting', 'queued', 'not queued']
  .includes(String(rr.status ?? '').toLowerCase());

const emails = Array.isArray(rr.emails) ? rr.emails : [];

// Prendiamo SOLO email professionali realmente validate
const valideProfessionali = emails.filter(e =>
  e &&
  e.email &&
  e.type === 'professional' &&
  e.smtp_valid === 'valid'
);

// Preferiamo quella consigliata da RocketReach
let emailRocketReach = '';

if (
  rr.recommended_professional_email &&
  valideProfessionali.some(e => e.email === rr.recommended_professional_email)
) {
  emailRocketReach = rr.recommended_professional_email;
} else if (valideProfessionali.length) {
  emailRocketReach = valideProfessionali[0].email;
}

// RATE LIMIT e RICERCA NON COMPLETATA finiscono negli Scartati
// come 'Da riprovare' e vengono ripresi all'esecuzione successiva.
let stato;
if (emailRocketReach) stato = 'EMAIL VALIDATA';
else if (rateLimit) stato = 'RATE LIMIT';
else if (inCorso) stato = 'RICERCA NON COMPLETATA';
else if (rr.detail) stato = 'PERSONA NON TROVATA';
else stato = 'NESSUNA EMAIL VALIDA';

return {
  json: {
    ...prospect,
    'Email RocketReach': emailRocketReach,
    'Email RocketReach tutte': valideProfessionali.map(e => e.email).join(', '),
    'LinkedIn RocketReach': rr.linkedin_url || '',
    'Stato RocketReach': stato
  }
};
