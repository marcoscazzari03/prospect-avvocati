// Estrae le email dalla pagina scaricata (__FASE__) e sceglie la migliore
// tra quelle trovate finora. Ordine di preferenza:
// 5   email del dominio con il nome della persona (es. j.garcia@studio.es)
// 4.5 email gratuita/ordine (gmail, adv.oa.pt...) in un mailto con il nome
// 4   email generica del dominio (info@, contact@, kancelaria@...)
// 3   altra email personale del dominio (es. un collega)
// 2   email gratuita/ordine in un mailto, senza il nome
// 1   privacy@ / dpo@ / gdpr@ del dominio
const prospect = $('__SORGENTE__').item.json;
const FASE = '__FASE__';

let html = String($json.html ?? '');

const cleanHost = (raw) => String(raw ?? '').trim().toLowerCase()
  .replace(/^https?:\/\//i, '').replace(/^\/\//, '')
  .split('/')[0].split('?')[0].split('#')[0]
  .replace(/^www\./, '').replace(/:\d+$/, '');

const decodeCfEmail = (encoded) => {
  try {
    if (!encoded || encoded.length < 4) return '';
    const key = parseInt(encoded.slice(0, 2), 16);
    let email = '';
    for (let i = 2; i < encoded.length; i += 2) {
      email += String.fromCharCode(parseInt(encoded.slice(i, i + 2), 16) ^ key);
    }
    return email;
  } catch {
    return '';
  }
};

html = html
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&commat;/gi, '@')
  .replace(/&period;/gi, '.')
  .replace(/\\u0040/gi, '@')
  .replace(/\\u002e/gi, '.')
  .replace(/\\x40/gi, '@')
  .replace(/\\x2e/gi, '.')
  .replace(/%40/gi, '@')
  .replace(/%2e/gi, '.')
  .replace(/\s*\[\s*(?:at|chiocciola)\s*\]\s*/gi, '@')
  .replace(/\s*\(\s*(?:at|chiocciola)\s*\)\s*/gi, '@')
  .replace(/\s*\[\s*(?:dot|punto)\s*\]\s*/gi, '.')
  .replace(/\s*\(\s*(?:dot|punto)\s*\)\s*/gi, '.');

// --------------------------------------------------
// EMAIL NELLA PAGINA (sicure = mailto o Cloudflare)
// --------------------------------------------------
const sicure = new Set();
const tutte = [];

let m;
const cfRegex = /data-cfemail=["']([0-9a-f]+)["']/gi;
while ((m = cfRegex.exec(html)) !== null) {
  const e = decodeCfEmail(m[1]);
  if (e) { sicure.add(e.toLowerCase()); tutte.push(e); }
}

const mailtoRegex = /mailto:([^"'?#\s<>]+)/gi;
while ((m = mailtoRegex.exec(html)) !== null) {
  let v = m[1];
  try { v = decodeURIComponent(v); } catch {}
  sicure.add(v.toLowerCase().trim());
  tutte.push(v);
}

tutte.push(...(html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []));

const ESTENSIONI = /\.(png|jpe?g|gif|svg|webp|css|js|ico|woff2?|ttf|pdf)$/i;
const SCARTA_LOCALI = /^(no-?reply|do-?not-?reply|donotreply|noreply|mailer-daemon|postmaster|abuse|example|test|user|email|e-mail|name|nome|your|youremail|yourname|you|tuonome|sentry|wordpress|webmaster|hostmaster|jobs?|careers?|recruit(ment|ing)?|cv|hr|bewerbung|praktikum|stage|empleo|trabaja|vacatures|rekrutacja|kariera)$/;
const SCARTA_DOMINI = /(^|\.)(example\.(com|org)|sentry\.io|sentry-next\.wixpress\.com|wixpress\.com|domain\.com|email\.com|yoursite\.com|godaddy\.com|wix\.com|squarespace\.com)$/;

// Email gratuite e degli ordini forensi: valide solo se in un mailto del sito.
const GRATUITE = /(^|\.)(gmail\.com|googlemail\.com|icloud\.com|me\.com|aol\.com|protonmail\.(com|ch)|proton\.me|mail\.com|zoho\.(com|eu)|(hotmail|outlook|live|yahoo|gmx|msn)\.[a-z.]+|seznam\.cz|centrum\.(cz|sk)|email\.cz|post\.cz|wp\.pl|o2\.pl|onet\.(pl|eu)|interia\.(pl|eu)|op\.pl|abv\.bg|mail\.bg|otenet\.gr|hol\.gr|freemail\.hu|citromail\.hu|sapo\.pt|adv\.oa\.pt|icam\.es|icab\.(cat|es)|icav\.es|telenet\.be|skynet\.be|ziggo\.nl|kpnmail\.nl|planet\.nl|bluewin\.ch|hispeed\.ch|aon\.at|chello\.at|eircom\.net|btinternet\.com|btconnect\.com|virginmedia\.com|sky\.com|telia\.com|online\.no|t-online\.hu|azet\.sk|zoznam\.sk|inbox\.lv|inbox\.lt|mail\.ee|tvnet\.lv|net\.hr|t-com\.hr|siol\.net|yandex\.(com|ru)|libero\.it)$/;

const GENERICHE = new Set([
  'info', 'hello', 'contact', 'contacts', 'kontakt', 'kontakty', 'contacto', 'contato', 'contacte',
  'office', 'mail', 'post', 'postmottak', 'posta', 'email', 'admin', 'secretaria', 'secretariat', 'secretariaat',
  'sekretariat', 'sekretariaat', 'secretary', 'reception', 'recepcion', 'receptie', 'enquiries', 'enquiry',
  'inquiries', 'inquiry', 'general', 'geral', 'administracion', 'administracao', 'administration', 'administratie', 'recepcja', 'despacho', 'bufete', 'abogados', 'advogados', 'advocaten',
  'avocats', 'avocat', 'cabinet', 'kanzlei', 'kancelaria', 'biuro', 'kancelar', 'kancelarija', 'ured', 'pisarna',
  'iroda', 'ugyved', 'ugyvediiroda', 'web', 'kontor', 'advokatbyra', 'office1', 'law', 'legal', 'lawyers', 'solicitors', 'criminal', 'crime', 'defence', 'defense',
  'penal', 'strafrecht', 'advokat', 'advokatfirma', 'byra', 'toimisto', 'mailbox', 'studio', 'studiolegale'
]);
const PRIVACY = /^(privacy|dpo|gdpr|rodo|datenschutz|dataprotection|data\.protection|protecciondedatos|lopd|rgpd|avg)$/;

const dominio = cleanHost(prospect.Sito);
const titoli = new Set(['dr', 'mr', 'mrs', 'ms', 'prof', 'avv', 'me', 'mag', 'mgr', 'adw', 'adv', 'lic', 'ldo', 'dra', 'jur', 'kc', 'qc', 'judr', 'ing']);
const parti = String(prospect.Nome ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .split(/[\s-]+/).map(p => p.replace(/[^a-z]/g, '')).filter(p => p && !titoli.has(p));
const primo = parti[0] || '';
const ultimo = parti.length > 1 ? parti[parti.length - 1] : '';

// Segnaposto tipo "nome.cognome@" nelle varie lingue.
const SEGNAPOSTO = /^(firstname|first\.?name|name|nome|nombre|prenom|vorname|voornaam|imie|jmeno|etunimi|fornamn|fornavn)[._-]?(lastname|last\.?name|surname|cognome|apellidos?|nom|nachname|achternaam|nazwisko|prijmeni|sukunimi|efternamn|etternavn)?$/;

const conNome = (local) => {
  const l = local.replace(/[^a-z]/g, '');
  if (ultimo.length >= 3 && l.includes(ultimo)) return true;
  if (primo.length >= 3 && ultimo && l.startsWith(primo)) return true;
  if (primo && ultimo && l === primo[0] + ultimo) return true;
  // Altri cognomi (nomi composti spagnoli / portoghesi)
  return parti.slice(1, -1).some(p => p.length >= 4 && l.includes(p));
};

const punteggio = (email) => {
  const [local, dom] = email.split('@');
  if (!local || !dom || SCARTA_LOCALI.test(local) || SCARTA_DOMINI.test(dom) || ESTENSIONI.test(email)) return 0;
  if (dom.startsWith('www.')) return 0;
  const delDominio = dominio && (dom === dominio || dom.endsWith('.' + dominio));
  if (SEGNAPOSTO.test(local)) return 0;
  if (delDominio) {
    if (conNome(local)) {
      // Stesso cognome ma un altro nome (es. un familiare nello studio): non e il titolare.
      const altroNome = local.split(/[._-]+/).some(t =>
        /^[a-z]{3,}$/.test(t) && !parti.some(p => p === t || t.includes(p) || p.includes(t)));
      return altroNome ? 3 : 5;
    }
    if (GENERICHE.has(local)) return 4;
    if (PRIVACY.test(local)) return 1;
    return 3;
  }
  if (GRATUITE.test(dom) && sicure.has(email)) return conNome(local) ? 4.5 : 2;
  return 0;
};

const fonte = __CAMPO_FONTE__;

const precedenti = Array.isArray(prospect._emailSito) ? prospect._emailSito : [];
const trovate = [...precedenti];
const giaViste = new Set(precedenti.map(x => x.email));

for (const raw of tutte) {
  const email = String(raw).toLowerCase().trim().replace(/^[^a-z0-9]+/, '').replace(/[),.;:'"]+$/g, '');
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) || giaViste.has(email)) continue;
  giaViste.add(email);
  const p = punteggio(email);
  if (p > 0) trovate.push({ email, p, fonte });
}

trovate.sort((a, b) => b.p - a.p);
const migliore = trovate[0];

const tipo = !migliore ? '' :
  migliore.p >= 4.5 ? 'SITO - NOMINATIVA' :
  migliore.p >= 4 ? 'SITO - GENERICA' :
  migliore.p >= 3 ? 'SITO - ALTRA EMAIL' :
  migliore.p >= 2 ? 'SITO - EMAIL GRATUITA' : 'SITO - PRIVACY';

// Si cerca su un'altra pagina finche non c'e un'email nominativa o generica.
const basta = Boolean(migliore && migliore.p >= 4);

const out = {
  ...prospect,
  _emailSito: trovate.slice(0, 8),
  'Email trovata sito': migliore ? migliore.email : '',
  'Email trovate sito': trovate.slice(0, 6).map(x => x.email).join(', '),
  'Tipo email sito': tipo,
  'Fonte email': migliore ? migliore.fonte : '',
  'Stato ricerca email': (migliore ? 'TROVATA ' : 'NON TROVATA ') + FASE
};

//__PAGINE__

return { json: out };
