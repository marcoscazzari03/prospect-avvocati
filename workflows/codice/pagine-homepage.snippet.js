// --------------------------------------------------
// PAGINE DA CONTROLLARE DOPO LA HOMEPAGE (gratis)
// 1) contatti (o la pagina indicata dall'AI); 2) note legali / Impressum /
// privacy, dove per legge c'e quasi sempre l'email dello studio.
// --------------------------------------------------
const sitoRaw = String(prospect.Sito ?? '').trim();
const sitoConProtocollo = /^https?:\/\//i.test(sitoRaw) ? sitoRaw : 'https://' + sitoRaw;
const originMatch = sitoConProtocollo.match(/^(https?:\/\/[^\/?#]+)/i);
const origin = originMatch ? originMatch[1] : '';

const normalizeUrl = (raw) => {
  const s = String(raw ?? '').trim().replace(/^https?:\/\//i, '').replace(/^\/\//, '');
  const [h, ...resto] = s.split('/');
  const path = ('/' + resto.join('/')).split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  return h.toLowerCase().replace(/^www\./, '') + path.toLowerCase();
};

const rendiAssoluto = (href) => {
  let link = String(href ?? '').trim().replace(/&amp;/gi, '&');
  if (!link || /^(#|mailto:|tel:|javascript:|data:|whatsapp:)/i.test(link)) return '';
  if (/^https?:\/\//i.test(link)) return link;
  if (/^\/\//.test(link)) return 'https:' + link;
  if (!origin) return '';
  if (link.startsWith('/')) return origin + link;
  return origin + '/' + link.replace(/^\.\//, '');
};

const categoria = (url) => {
  const u = String(url).toLowerCase().split('?')[0].split('#')[0];
  if (/contact|kontakt|contacto|contato|contatti|contacte|get-in-touch|reach-us|enquir|inquir|epikoinonia|yhteys|kapcsolat|elerhetoseg|hubungi|find-us|location|where-we-are|donde-estamos|onde-estamos|biuro|ufficio|oficina/.test(u)) return ['CONTATTI', 100];
  if (/impressum|impresszum|aviso-legal|avisolegal|nota-legal|legal-notice|legal-notices|mentions-legales|mentions|colofon|disclaimer|legal|privacy|privacidad|privacidade|polityka|rodo|datenschutz|gdpr|cookies?-policy|terms|terminos|termos|ochrana-osobnich|adatvedelem|integritet|tietosuoja/.test(u)) return ['LEGALE', 80];
  if (/about|chi-siamo|quienes-somos|quem-somos|over-ons|o-nas|uber-uns|ueber-uns|qui-sommes|despacho|kancelaria|kanzlei|firm|studio/.test(u)) return ['STUDIO', 60];
  if (/team|equipo|equipa|abogados|advogados|lawyers|people|attorneys|solicitors|advocaten|avocats|anwalte|anwaelte|zespol|nasi|socios|partners|tym/.test(u)) return ['TEAM', 50];
  return ['', 0];
};

const linkTrovati = [];
const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
const homeNorm = normalizeUrl(prospect.Sito);
while ((m = hrefRegex.exec(html)) !== null) {
  const url = rendiAssoluto(m[1]);
  const h = cleanHost(url);
  if (!url || !h || !dominio || !(h === dominio || h.endsWith('.' + dominio))) continue;
  const percorso = url.split('?')[0].split('#')[0];
  if (/\.(pdf|jpe?g|png|gif|svg|webp|docx?|zip|css|js|xml|json|ico)$/i.test(percorso)) continue;
  if (/\/(wp-content|wp-includes|wp-json|feed|news|blog|uutiset|nyheter|noticias|aktualnosci|hirek|insights|articles?|cdn-cgi)(\/|$)/i.test(percorso)) continue;
  if (normalizeUrl(url) === homeNorm) continue;
  linkTrovati.push(url.split('#')[0]);
}

const candidate = [...new Set(linkTrovati)]
  .map(url => { const [cat, score] = categoria(url); return { url, cat, score }; })
  .filter(x => x.score > 0)
  .sort((a, b) => b.score - a.score || a.url.length - b.url.length);

const paginaAI = String(prospect['Pagina contatti AI'] ?? '');
if (paginaAI && normalizeUrl(paginaAI) !== homeNorm) {
  candidate.unshift({ url: paginaAI, cat: categoria(paginaAI)[0] || 'AI', score: 110 });
}

// Siti fatti in JavaScript (nessun link leggibile): proviamo i percorsi tipici.
if (!candidate.length && origin) {
  const p = String(prospect.Paese || '');
  const ipotesi = {
    'Spagna': ['/contacto', '/aviso-legal'], 'Portogallo': ['/contactos', '/contacto'],
    'Paesi Bassi': ['/contact', '/colofon'], 'Belgio': ['/contact', '/mentions-legales'],
    'Austria': ['/kontakt', '/impressum'], 'Svizzera': ['/kontakt', '/impressum'], 'Liechtenstein': ['/kontakt', '/impressum'],
    'Polonia': ['/kontakt', '/polityka-prywatnosci'], 'Repubblica Ceca': ['/kontakt', '/kontakty'],
    'Slovacchia': ['/kontakt', '/kontakty'], 'Svezia': ['/kontakt', '/integritetspolicy'], 'Danimarca': ['/kontakt', '/om-os'],
    'Norvegia': ['/kontakt', '/om-oss'], 'Ungheria': ['/kapcsolat', '/impresszum'], 'Romania': ['/contact', '/despre-noi'],
    'Finlandia': ['/yhteystiedot', '/tietosuojaseloste'], 'Regno Unito': ['/contact-us', '/privacy-policy'],
    'Irlanda': ['/contact-us', '/privacy-policy'], 'Grecia': ['/epikoinonia', '/contact'], 'Croazia': ['/kontakt', '/impressum'],
    'Slovenia': ['/kontakt', '/o-nas'], 'Serbia': ['/kontakt', '/o-nama'],
    'Lussemburgo': ['/contact', '/mentions-legales'], 'Monaco': ['/contact', '/mentions-legales']
  }[p] || ['/contact', '/contact-us'];
  ipotesi.forEach((path, k) => candidate.push({ url: origin + path, cat: 'IPOTESI', score: 1 - k / 10 }));
}

const pagina1 = candidate[0];
const pagina2 = pagina1
  ? (candidate.find(x => x !== pagina1 && x.cat !== pagina1.cat && normalizeUrl(x.url) !== normalizeUrl(pagina1.url)) ||
     candidate.find(x => x !== pagina1 && normalizeUrl(x.url) !== normalizeUrl(pagina1.url)))
  : null;

out['Pagina da controllare'] = basta || !pagina1 ? '' : pagina1.url;
out['Pagina da controllare 2'] = basta || !pagina2 ? '' : pagina2.url;
out['Pagine candidate trovate'] = candidate.slice(0, 5).map(x => x.url).join(', ');
