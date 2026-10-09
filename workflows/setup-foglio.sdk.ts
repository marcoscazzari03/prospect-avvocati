import { workflow, node, trigger, sticky, expr } from '@n8n/workflow-sdk';

const avvio = trigger({
  type: 'n8n-nodes-base.manualTrigger', version: 1,
  config: { name: 'Avvio manuale', position: [0, 0] },
  output: [{}]
});

const leggiTemi = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'GitHub - Temi iniziali',
    position: [220, 0],
    parameters: {
      url: 'https://raw.githubusercontent.com/marcoscazzari03/prospect-avvocati/claude/confident-maxwell-wcy0xf/data/temi-iniziali.csv',
      options: { response: { response: { responseFormat: 'text', outputPropertyName: 'csv' } } }
    }
  },
  output: [{ csv: 'ID,Paese,Settore,Tema,Attivo' }]
});

const leggiEsclusioni = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'GitHub - Esclusioni iniziali',
    position: [440, 0],
    executeOnce: true,
    parameters: {
      url: 'https://raw.githubusercontent.com/marcoscazzari03/prospect-avvocati/claude/confident-maxwell-wcy0xf/data/esclusioni-iniziali.csv',
      options: { response: { response: { responseFormat: 'text', outputPropertyName: 'csv' } } }
    }
  },
  output: [{ csv: 'Nome o marchio,Categoria,Attivo' }]
});

const preparaDati = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: {
    name: 'Prepara schede',
    position: [660, 0],
    parameters: {
      jsCode: "// Schede del foglio di test (gid fissi 101-106: il workflow le usa per gid).\nconst SCHEDE = [\n  [101, 'Prospect AI', ['Data', 'Nome', 'Azienda', 'Ruolo', 'Tipo studio', 'Città', 'Paese', 'Settore', 'Sito', 'Email certa', 'Tipo email', 'Fonte email', 'Stato email', 'Email probabili', 'LinkedIn']],\n  [102, 'Mailup', ['Nome', 'Cognome', 'Azienda', 'Ruolo', 'Settore', 'Email', 'Paese']],\n  [103, 'Scartati', ['Data', 'Nome', 'Azienda', 'Ruolo', 'Tipo studio', 'Città', 'Paese', 'Settore', 'Sito', 'Email probabili', 'LinkedIn', 'Motivo scarto', 'Nome Mailup', 'Cognome Mailup']],\n  [104, 'Log', ['Data ora', 'Execution ID', 'Lotti', 'Lotti falliti', 'Lotti recuperati', 'Candidati AI', 'Scartati deduplica', 'Nuovi candidati', '% nuovi', 'Email da sito', 'Email sito nominative', 'Lookup RocketReach', 'RocketReach non trovati', 'Email da RocketReach', 'Salvati Prospect AI', 'Scartati senza email', 'Righe Mailup', 'Riprovati da Scartati', 'Ricontrolli RocketReach', 'RocketReach rate limit', 'Da riprovare', 'Rinviati tetto RocketReach', 'Escluse grandi aziende', 'Abbandonati dopo tentativi']],\n  [105, 'Temi', ['ID', 'Paese', 'Settore', 'Tema', 'Attivo', 'Ultimo uso', 'Usi', 'Candidati totali', 'Nuovi totali', 'Ultimo esito']],\n  [106, 'Esclusioni', ['Nome o marchio', 'Categoria', 'Attivo']]\n];\n\n// CSV con campi tra virgolette.\nconst parseCsv = (testo) => {\n  const righe = [];\n  let riga = [], campo = '', q = false;\n  const s = String(testo).replace(/\\r/g, '');\n  for (let i = 0; i < s.length; i++) {\n    const c = s[i];\n    if (q) {\n      if (c === '\"' && s[i + 1] === '\"') { campo += '\"'; i++; }\n      else if (c === '\"') q = false;\n      else campo += c;\n    } else if (c === '\"') q = true;\n    else if (c === ',') { riga.push(campo); campo = ''; }\n    else if (c === '\\n') { riga.push(campo); righe.push(riga); riga = []; campo = ''; }\n    else campo += c;\n  }\n  if (campo || riga.length) { riga.push(campo); righe.push(riga); }\n  const [testa, ...corpo] = righe.filter(r => r.some(Boolean));\n  return corpo.map(r => Object.fromEntries(testa.map((h, k) => [h, r[k] ?? ''])));\n};\n\nconst temi = parseCsv($('GitHub - Temi iniziali').first().json.csv);\nconst esclusioni = parseCsv($('GitHub - Esclusioni iniziali').first().json.csv);\n\nconst data = SCHEDE.map(([, titolo, cols]) => {\n  const extra = titolo === 'Temi' ? temi : titolo === 'Esclusioni' ? esclusioni : [];\n  return {\n    range: `'${titolo}'!A1`,\n    values: [cols, ...extra.map(r => cols.map(c => r[c] ?? ''))]\n  };\n});\n\nreturn [{\n  json: {\n    creazione: {\n      properties: { title: 'TEST | Prospect Avvocati | Search', locale: 'it_IT', timeZone: 'Europe/Rome' },\n      sheets: SCHEDE.map(([gid, title]) => ({\n        properties: { sheetId: gid, title, gridProperties: { frozenRowCount: 1 } }\n      }))\n    },\n    valori: { valueInputOption: 'RAW', data },\n    temi: temi.length,\n    esclusioni: esclusioni.length\n  }\n}];"
    }
  },
  output: [{ creazione: {}, valori: {}, temi: 69, esclusioni: 127 }]
});

const creaFoglio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Crea foglio Google',
    position: [880, 0],
    parameters: {
      method: 'POST',
      url: 'https://sheets.googleapis.com/v4/spreadsheets',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify($json.creazione) }}')
    },
    credentials: { googleSheetsOAuth2Api: { id: 'ZayuDfh1wxejgzop', name: 'Spreadsheet ads.lefonti@gmail.com' } }
  },
  output: [{ spreadsheetId: 'abc', spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/abc/edit' }]
});

const scriviValori = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Scrivi intestazioni, Temi ed Esclusioni',
    position: [1100, 0],
    parameters: {
      method: 'POST',
      url: expr('https://sheets.googleapis.com/v4/spreadsheets/{{ $json.spreadsheetId }}/values:batchUpdate'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify($('Prepara schede').first().json.valori) }}")
    },
    credentials: { googleSheetsOAuth2Api: { id: 'ZayuDfh1wxejgzop', name: 'Spreadsheet ads.lefonti@gmail.com' } }
  },
  output: [{ spreadsheetId: 'abc', totalUpdatedRows: 10 }]
});

const nota = sticky('## Setup foglio (una tantum)\nCrea il file Google **TEST | Prospect Avvocati | Search** con le schede Prospect AI, Mailup, Scartati, Log, Temi ed Esclusioni (gid 101-106).\n\nIntestazioni, temi ed esclusioni iniziali arrivano da `data/` della repo GitHub prospect-avvocati.\n\n**Da eseguire una sola volta**: ogni esecuzione crea un file nuovo.', [leggiTemi, scriviValori], { color: 7 });

export default workflow('prospect-avvocati-setup', 'Prospect Avvocati | Setup foglio')
  .add(avvio)
  .to(leggiTemi)
  .to(leggiEsclusioni)
  .to(preparaDati)
  .to(creaFoglio)
  .to(scriviValori)
  .add(nota);
