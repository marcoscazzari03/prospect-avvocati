// Reinserisce (max 40) i prospect scartati 'Da riprovare'
// (limite RocketReach): ripassano dalla ricerca email
// senza pagare una nuova ricerca AI. Vanno in testa, cosi hanno
// la precedenza sia nella deduplica per studio sia nel tetto RocketReach.
const items = $input.all();
const archivio = $('Prepara archivio').first().json;
const bloccati = new Set(archivio.nomi_esistenti || []);
const dominiBloccati = new Set(archivio.domini_esistenti || []);
const tentativi = archivio.tentativi_rr || {};

const norm = (v) => String(v ?? '')
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const chiaveDominio = (sito) => {
  const s = String(sito ?? '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '');
  const [host, primo] = s.split(/[?#]/)[0].split('/');
  if (!host) return '';
  return ['sites.google.com', 'linktr.ee'].includes(host) && primo ? `${host}/${primo}` : host;
};

const MAX = 40;
const visti = new Set();
const candidati = [];

for (const r of $('Read Scartati').all()) {
  const j = r.json;
  if (!String(j['Motivo scarto'] ?? '').startsWith('Da riprovare')) continue;

  const n = norm(j.Nome);
  const sito = String(j.Sito ?? '').trim();
  if (!n || !sito || bloccati.has(n) || visti.has(n)) continue;
  // Studio gia in archivio con un'altra persona: niente nuovo tentativo.
  if (dominiBloccati.has(chiaveDominio(sito))) continue;

  visti.add(n);
  const parti = String(j.Nome).trim().split(/\s+/);

  candidati.push({
    nome: j.Nome,
    nome_proprio: j['Nome Mailup'] || parti[0],
    cognome: j['Cognome Mailup'] || parti.slice(1).join(' '),
    azienda: j.Azienda,
    paese: j.Paese || '',
    ruolo: j.Ruolo,
    tipo_studio: j['Tipo studio'] || '',
    citta: j['Città'] || '',
    settore: j.Settore,
    sito,
    fonte: /^https?:\/\//i.test(sito) ? sito : 'https://' + sito,
    tentativi: tentativi[n] || 1
  });

  if (candidati.length >= MAX) break;
}

if (candidati.length) {
  items.unshift({
    json: {
      output: JSON.stringify({ candidati }),
      lotto: 'riprova',
      stato_lotto: 'RIPROVA',
      candidati_lotto: 0,
      riprovati: candidati.length
    }
  });
}

return items;
