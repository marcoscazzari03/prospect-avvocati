const norm = (v) => String(v ?? '')
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const normCompany = (v) => norm(v)
  .replace(/\b(llp|ltd|limited|plc|solicitors?|law firm|law offices?|legal|abogados?|advogados?|advocaten|advocatenkantoor|avocats?|rechtsanwalte|rechtsanwaltskanzlei|kanzlei|kancelaria|adwokacka|adwokat|advokat(ni|ska)?|sl|slp|lda|bv|sprl|srl|gmbh|kg|og|ab|as|oy|sp k|sp j|s r o|and partners|and co|partners)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const parse = (raw) => {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const host = (sito) => String(sito ?? '').trim().toLowerCase()
  .replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  .split('/')[0].split('?')[0].split('#')[0].trim();

// Chiave dello studio = dominio del sito (uno studio, un contatto).
const chiaveDominio = (sito) => {
  const s = String(sito ?? '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '');
  const [h, primo] = s.split(/[?#]/)[0].split('/');
  if (!h) return '';
  return ['sites.google.com', 'linktr.ee'].includes(h) && primo ? `${h}/${primo}` : h;
};

// Siti che non sono il sito ufficiale dello studio.
const NON_UFFICIALI = /(^|\.)(linkedin|facebook|instagram|twitter|x|youtube|tiktok|google|goo|yelp|trustpilot|doctolib|abogados365|legal500|chambers|chambersandpartners|lawyers|justia|avvo|solicitors|lawsociety|thelawyer|iclg|martindale|bestlawyers|doyleslegal|leaders?league|wikipedia|kompass|europages|infobel|paginasamarillas|yellowpages|gelbeseiten|pagesjaunes|herold|panoramafirm|firmy|zlatestranky)\.[a-z.]+$/;

const cleanNamePart = (v) => String(v ?? '')
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

const prefissiDaIgnorare = new Set([
  'dr', 'doctor', 'mr', 'mrs', 'ms', 'miss', 'prof', 'professor', 'sir', 'madam', 'md',
  'avv', 'avvocato', 'me', 'maitre', 'mag', 'mgr', 'mec', 'adw', 'adv', 'lic', 'ldo', 'lda',
  'dra', 'jur', 'kc', 'qc', 'mjur', 'ing', 'judr', 'phdr', 'mudr'
]);

const generaEmail = (nomeCompleto, dominio) => {
  if (!nomeCompleto || !dominio) return [];
  const parti = String(nomeCompleto).trim().split(/\s+/).map(cleanNamePart).filter(Boolean);
  while (parti.length > 1 && prefissiDaIgnorare.has(parti[0])) parti.shift();
  if (!parti.length) return [];
  const first = parti[0];
  if (parti.length === 1) return [`${first}@${dominio}`];
  const last = parti[parti.length - 1];
  return [`${first}.${last}@${dominio}`, `${first}@${dominio}`, `${first.charAt(0)}${last}@${dominio}`];
};

const archivio = $('Prepara archivio').first().json;
const visti = new Set(archivio.chiavi_esistenti || []);
const nomiVisti = new Set(archivio.nomi_esistenti || []);
const dominiVisti = new Set(archivio.domini_esistenti || []);

const nuovi = [];

for (const item of $input.all()) {
  const dati = parse(item.json.output);
  if (!dati || !Array.isArray(dati.candidati)) continue;

  for (const c of dati.candidati) {
    const pulito = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

    const nome = pulito(c?.nome);
    const azienda = pulito(c?.azienda);
    const nomeN = norm(nome);
    const aziendaN = normCompany(azienda) || norm(azienda);
    if (!nomeN || !aziendaN) continue;

    // Persona o nome + studio gia presenti
    const key = `${nomeN}|${aziendaN}`;
    if (visti.has(key) || nomiVisti.has(nomeN)) continue;

    const fonte = typeof c?.fonte === 'string' && /^https?:\/\//i.test(c.fonte.trim())
      ? c.fonte.trim()
      : '';
    if (!fonte) continue;

    const sito = c?.sito ? String(c.sito).trim() : '';
    const dominio = host(sito);
    if (!sito || !dominio || NON_UFFICIALI.test(dominio)) continue;

    // Studio gia contattato (o gia preso in questa esecuzione)
    const studio = chiaveDominio(sito);
    if (dominiVisti.has(studio)) continue;

    const paginaContatti = typeof c?.pagina_contatti === 'string' &&
      /^https?:\/\//i.test(c.pagina_contatti.trim()) &&
      host(c.pagina_contatti) === dominio
        ? c.pagina_contatti.trim()
        : '';

    visti.add(key);
    nomiVisti.add(nomeN);
    dominiVisti.add(studio);

    nuovi.push({
      json: {
        'Nome': nome,
        'Nome Mailup': pulito(c?.nome_proprio),
        'Cognome Mailup': pulito(c?.cognome),
        'Azienda': azienda,
        'Ruolo proposto': pulito(c?.ruolo),
        'Tipo studio': pulito(c?.tipo_studio),
        'Città': pulito(c?.citta),
        'Paese': pulito(c?.paese),
        'Settore': pulito(c?.settore) || 'Diritto penale',
        'Sito': sito,
        'Email probabile/i': generaEmail(nome, dominio).join(', '),
        'Fonte analizzata': fonte,
        'Pagina contatti AI': paginaContatti,
        'Tentativi precedenti': Number(c?.tentativi) || 0
      }
    });
  }
}

return nuovi;
