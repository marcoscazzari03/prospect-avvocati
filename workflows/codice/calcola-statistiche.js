// Una riga di statistiche per esecuzione (scheda Log).
// Parte dopo tutti i salvataggi.
const n = (nome, ramo) => {
  try {
    return $(nome).all(ramo ?? 0).length;
  } catch {
    return 0;
  }
};

const conta = (nome, ramo, f) => {
  try {
    return $(nome).all(ramo ?? 0).filter(f).length;
  } catch {
    return 0;
  }
};

const tutti = $('Aggiungi da riprovare').all().map(i => i.json);
const lotti = tutti.filter(l => l.stato_lotto !== 'RIPROVA');
const riprovati = tutti.reduce((s, l) => s + (l.riprovati || 0), 0);

const candidatiAI = lotti.reduce((s, l) => s + (l.candidati_lotto || 0), 0);

// La deduplica emette un item vuoto quando non ci sono nuovi prospect.
// I ripresi da 'Da riprovare' hanno 'Tentativi precedenti' > 0.
let nuoviAI = 0;
try {
  nuoviAI = $('Deduplica e prepara righe').all()
    .filter(i => i.json.Nome && !(Number(i.json['Tentativi precedenti']) > 0)).length;
} catch {}

const stato = (s) => conta('Prepara righe finali', 0, i => i.json['Stato RocketReach'] === s);
const motivo = (prefisso) => conta('Prepara scartati', 0, i =>
  String(i.json['Motivo scarto'] ?? '').startsWith(prefisso)
);
const daRiprovare = motivo('Da riprovare');
const escluse = motivo('Esclusa');

return [{
  json: {
    'Data ora': $now.setZone('Europe/Rome').toFormat('yyyy-MM-dd HH:mm'),
    'Execution ID': $execution.id,
    'Lotti': lotti.length,
    'Lotti falliti': lotti.filter(l =>
      l.stato_lotto === 'ERRORE' || l.stato_lotto === 'JSON NON VALIDO'
    ).length,
    'Lotti recuperati': lotti.filter(l => l.stato_lotto === 'RECUPERATO').length,
    'Candidati AI': candidatiAI,
    'Scartati deduplica': Math.max(candidatiAI - nuoviAI, 0),
    'Nuovi candidati': nuoviAI,
    '% nuovi': candidatiAI ? Math.round(nuoviAI / candidatiAI * 100) : 0,
    'Email da sito': n('Email certa trovata?', 0),
    'Email sito nominative': conta('Prepara righe finali', 0, i => i.json['Tipo email'] === 'SITO - NOMINATIVA'),
    'Lookup RocketReach': n('RocketReach - Lookup persona'),
    'RocketReach non trovati': stato('PERSONA NON TROVATA'),
    'Email da RocketReach': n('Email RocketReach trovata?', 0),
    'Salvati Prospect AI': n('Ha email?', 0),
    'Scartati senza email': n('Ha email?', 1) - daRiprovare - escluse,
    'Righe Mailup': n('Prepara Mailup'),
    'Riprovati da Scartati': riprovati,
    'Ricontrolli RocketReach': n('RocketReach - Status check 2'),
    'RocketReach rate limit': stato('RATE LIMIT'),
    'Da riprovare': daRiprovare,
    'Rinviati tetto RocketReach': stato('RINVIATO (TETTO)'),
    'Escluse grandi aziende': escluse,
    'Abbandonati dopo tentativi': motivo('Abbandonato')
  }
}];
