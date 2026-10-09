// Aggiorna la scheda Temi: ultimo uso, numero di usi,
// candidati restituiti e quanti erano nuovi (non in archivio).
const norm = (v) => String(v ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const temi = Object.fromEntries(
  $('Read Temi').all().map(i => [String(i.json.ID), i.json])
);
const genera = $('Genera 5 Lotti').all().map(i => i.json);
const lotti = Object.fromEntries(genera.map(g => [String(g.lotto), g]));
const archivio = $('Prepara archivio').first().json;
const nomiEsistenti = new Set(archivio.nomi_esistenti || []);

const ora = $now.setZone('Europe/Rome').toFormat('yyyy-MM-dd HH:mm');
const out = [];

$input.all().forEach((it, idx) => {
  const j = it.json;
  // Un lotto AI per ogni lotto generato, nello stesso ordine.
  const g = lotti[String(j.lotto)] || genera[idx];
  if (!g || !g.tema_id) return;

  const t = temi[String(g.tema_id)] || {};

  let candidati = [];
  try {
    candidati = JSON.parse(j.output).candidati || [];
  } catch {}

  const nuovi = candidati.filter(c => {
    const n = norm(c?.nome);
    return n && !nomiEsistenti.has(n);
  }).length;

  out.push({
    json: {
      ID: g.tema_id,
      'Ultimo uso': ora,
      'Usi': String((Number(t.Usi) || 0) + 1),
      'Candidati totali': String((Number(t['Candidati totali']) || 0) + candidati.length),
      'Nuovi totali': String((Number(t['Nuovi totali']) || 0) + nuovi),
      'Ultimo esito': `${j.stato_lotto}: ${nuovi}/${candidati.length} nuovi`
    }
  });
});

return out;
