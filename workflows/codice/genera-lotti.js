// Rotazione dei temi: dalla scheda Temi prendiamo le 5 nicchie
// attive usate meno di recente (a parita: meno usate, poi a caso),
// bilanciando i paesi (al massimo 1 lotto per paese se i paesi sono 5+).
// Cosi l'AI non torna sempre sugli stessi nomi.
const NUM_LOTTI = 5;
const TARGET_LOTTO = 25;

const temi = $('Read Temi').all()
  .map(i => i.json)
  .filter(t =>
    t.ID &&
    t.Tema &&
    String(t.Attivo ?? 'SI').trim().toUpperCase() !== 'NO'
  );

let scelti;

if (temi.length) {
  scelti = temi
    .map(t => ({ t, r: Math.random() }))
    .sort((a, b) =>
      String(a.t['Ultimo uso'] || '').localeCompare(String(b.t['Ultimo uso'] || '')) ||
      (Number(a.t.Usi) || 0) - (Number(b.t.Usi) || 0) ||
      a.r - b.r
    )
    .map(x => x.t);

  // Bilanciamento paesi: al massimo ceil(5 / n. paesi) lotti per paese,
  // poi si completa con i temi rimasti nell'ordine di rotazione.
  const paesi = [...new Set(scelti.map(t => t.Paese || ''))];
  const maxPerPaese = Math.ceil(NUM_LOTTI / paesi.length);
  const perPaese = {};
  const bilanciati = [];
  for (const t of scelti) {
    const p = t.Paese || '';
    if ((perPaese[p] || 0) >= maxPerPaese) continue;
    perPaese[p] = (perPaese[p] || 0) + 1;
    bilanciati.push(t);
    if (bilanciati.length >= NUM_LOTTI) break;
  }
  for (const t of scelti) {
    if (bilanciati.length >= NUM_LOTTI) break;
    if (!bilanciati.includes(t)) bilanciati.push(t);
  }
  scelti = bilanciati;
} else {
  // Fallback se la scheda Temi e vuota o illeggibile
  scelti = [
    ['Spagna', 'abogados penalistas y despachos de derecho penal en Madrid'],
    ['Regno Unito', 'criminal defence solicitors in London (independent firms)'],
    ['Polonia', 'adwokat karnista i kancelarie prawa karnego w Warszawie'],
    ['Paesi Bassi', 'strafrechtadvocaten in Amsterdam'],
    ['Portogallo', 'advogados de direito penal em Lisboa']
  ].map(([Paese, Tema]) => ({ ID: '', Paese, Settore: 'Diritto penale', Tema }));
}

return scelti.map((t, i) => ({
  json: {
    paese: t.Paese || '',
    lotto: i + 1,
    tema: t.Tema,
    settore: t.Settore || 'Diritto penale',
    tema_id: t.ID || '',
    target_lotto: TARGET_LOTTO
  }
}));
