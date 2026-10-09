"""Genera il codice SDK del workflow "Prospect Avvocati | Setup foglio"."""
import json, sys
import schema_foglio as s

CRED = "{ googleSheetsOAuth2Api: { id: 'ZayuDfh1wxejgzop', name: 'Spreadsheet ads.lefonti@gmail.com' } }"
crea = json.dumps(json.dumps(s.corpo_creazione(), ensure_ascii=False), ensure_ascii=False)
valori = json.dumps(json.dumps(s.corpo_valori(), ensure_ascii=False), ensure_ascii=False)

code = f"""import {{ workflow, node, trigger, sticky, expr }} from '@n8n/workflow-sdk';

const avvio = trigger({{
  type: 'n8n-nodes-base.manualTrigger', version: 1,
  config: {{ name: 'Avvio manuale', position: [0, 0] }},
  output: [{{}}]
}});

const creaFoglio = node({{
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {{
    name: 'Crea foglio Google',
    position: [240, 0],
    parameters: {{
      method: 'POST',
      url: 'https://sheets.googleapis.com/v4/spreadsheets',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {crea}
    }},
    credentials: {CRED}
  }},
  output: [{{ spreadsheetId: 'abc', spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/abc/edit' }}]
}});

const scriviIntestazioni = node({{
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {{
    name: 'Scrivi intestazioni, Temi ed Esclusioni',
    position: [480, 0],
    parameters: {{
      method: 'POST',
      url: expr('https://sheets.googleapis.com/v4/spreadsheets/{{{{ $json.spreadsheetId }}}}/values:batchUpdate'),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'googleSheetsOAuth2Api',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: {valori}
    }},
    credentials: {CRED}
  }},
  output: [{{ spreadsheetId: 'abc', totalUpdatedRows: 10 }}]
}});

const nota = sticky('## Setup foglio (una tantum)\\nCrea il file Google **{s.TITOLO}** con le schede Prospect AI, Mailup, Scartati, Log, Temi ed Esclusioni (gid 101-106) e scrive intestazioni, temi ed esclusioni iniziali da `data/` della repo prospect-avvocati.\\n\\nDa eseguire **una sola volta**: ogni esecuzione crea un file nuovo.', [creaFoglio, scriviIntestazioni], {{ color: 7 }});

export default workflow('prospect-avvocati-setup', 'Prospect Avvocati | Setup foglio')
  .add(avvio)
  .to(creaFoglio)
  .to(scriviIntestazioni)
  .add(nota);
"""
open(sys.argv[1], 'w').write(code)
