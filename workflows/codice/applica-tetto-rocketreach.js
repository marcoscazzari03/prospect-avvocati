// Tetto alle ricerche RocketReach per esecuzione: RocketReach ha un
// limite orario (~70 ricerche). Precedenza ai prospect ripresi da
// 'Da riprovare'; chi resta fuori va negli Scartati come 'Da riprovare'.
const TETTO = 60;

const norm = (v) => String(v ?? '').trim().toLowerCase();

const ripresi = new Set();
try {
  for (const it of $('Aggiungi da riprovare').all()) {
    if (it.json.stato_lotto !== 'RIPROVA') continue;
    const candidati = JSON.parse(it.json.output || '{}').candidati || [];
    for (const c of candidati) ripresi.add(norm(c?.nome));
  }
} catch {}

const ordinati = $input.all()
  .map((it, i) => ({ it, i, prio: ripresi.has(norm(it.json.Nome)) ? 0 : 1 }))
  .sort((a, b) => a.prio - b.prio || a.i - b.i);

return ordinati.map((x, pos) => ({
  json: { ...x.it.json, entro_tetto_rr: pos < TETTO },
  pairedItem: { item: x.i }
}));
