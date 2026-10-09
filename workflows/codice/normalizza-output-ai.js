// Rende robusto l'output dell'AI: un lotto con JSON malformato,
// troncato o in errore non deve far perdere gli altri lotti.
const raw = $json.output;
const errore = $json.error ? String($json.error.message ?? $json.error) : '';

const pulisci = (s) => String(s)
  .trim()
  .replace(/^```(?:json)?\s*/i, '')
  .replace(/```\s*$/i, '')
  .trim();

const tryParse = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

let candidati = null;
let stato = 'OK';

if (errore) {
  stato = 'ERRORE';
} else if (raw && typeof raw === 'object') {
  candidati = Array.isArray(raw.candidati)
    ? raw.candidati
    : (Array.isArray(raw) ? raw : null);
} else if (typeof raw === 'string') {
  const s = pulisci(raw);
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  const dati = tryParse(s) ?? (a >= 0 && b > a ? tryParse(s.slice(a, b + 1)) : null);

  if (dati && Array.isArray(dati.candidati)) {
    candidati = dati.candidati;
  } else {
    // Recupero: prendiamo i singoli candidati validi
    // anche se il JSON complessivo e rotto.
    const oggetti = s.match(/\{[^{}]*\}/g) || [];
    const recuperati = oggetti
      .map(tryParse)
      .filter(o => o && o.nome);

    if (recuperati.length) {
      candidati = recuperati;
      stato = 'RECUPERATO';
    }
  }
}

if (!candidati) {
  candidati = [];
  if (stato === 'OK') stato = 'JSON NON VALIDO';
}

let lotto = '';
let paese = '';
try {
  const g = $('Genera 5 Lotti').all()[$itemIndex]?.json ?? $('Genera 5 Lotti').item.json;
  lotto = g.lotto;
  paese = g.paese || '';
} catch {}

// Ogni candidato porta con se il paese del lotto.
candidati = candidati.map(c => ({ ...c, paese: c?.paese || paese }));

return {
  json: {
    output: JSON.stringify({ candidati }),
    lotto,
    stato_lotto: stato,
    candidati_lotto: candidati.length,
    errore
  }
};
