// Esclude SOLO i grandi studi e le grandi societa palesi (nessuna stima dell'AI):
// marchio nella scheda Esclusioni, riconosciuto dal dominio del sito
// (es. cliffordchance.com) o dal nome, se il marchio e di 2+ parole o il nome
// coincide esattamente (cosi "Vinge Law Office" di un avvocato singolo
// NON viene escluso per sbaglio da un marchio di una parola).
const norm = (v) => String(v ?? '')
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const azienda = norm($json.Azienda);
const host = String($json.Sito ?? '')
  .toLowerCase()
  .replace(/^https?:\/\//, '')
  .split('/')[0]
  .replace(/^www\./, '');
const etichette = host.split('.');

let motivo = '';

for (const r of $('Read Esclusioni').all()) {
  const j = r.json;
  if (String(j.Attivo ?? 'SI').trim().toUpperCase() === 'NO') continue;

  const p = norm(j['Nome o marchio']);
  if (!p) continue;

  const compatti = [p.replace(/ /g, ''), p.replace(/ and /g, ' ').replace(/ /g, '')];
  const perDominio = compatti.some(c => etichette.includes(c));
  const perNome =
    azienda === p ||
    (p.includes(' ') && ` ${azienda} `.includes(` ${p} `));

  if (perDominio || perNome) {
    motivo = `in lista Esclusioni (${j['Nome o marchio']})`;
    break;
  }
}

if (!motivo && /\bplc\b/.test(azienda)) {
  motivo = 'societa quotata (plc)';
}

return {
  json: {
    ...$json,
    esclusa: Boolean(motivo),
    motivo_esclusione: motivo
  }
};
