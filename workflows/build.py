"""Costruisce "Prospect Avvocati | Search" a partire da "Prospect | Search".

Uso:  python3 workflows/build.py
Legge  workflows/base-prospect-search.json  (export del workflow base),
       workflows/codice/*.js e workflows/prompt/*.txt
Scrive workflows/prospect-avvocati-search.json (istantanea del workflow).
"""
import copy
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
CODICE = os.path.join(HERE, 'codice')
PROMPT = os.path.join(HERE, 'prompt')

NOME = 'Prospect Avvocati | Search'
TRIGGER = 'Ogni 12 ore | 06:00 - 18:00'
FOGLIO_ID = '1g0XfNM3vj5icNmfeEROydjFKHERVh5jqgRPo_nHO0Bs'
FOGLIO_NOME = 'TEST | Prospect Avvocati | Search'
SCHEDE = {'Prospect AI': 101, 'Mailup': 102, 'Scartati': 103, 'Log': 104, 'Temi': 105, 'Esclusioni': 106}
COLONNE_PROSPECT = ['Data', 'Nome', 'Azienda', 'Ruolo', 'Tipo studio', 'Città', 'Paese', 'Settore', 'Sito',
                    'Email certa', 'Tipo email', 'Fonte email', 'Stato email', 'Email probabili', 'LinkedIn']
COLONNE_MAILUP = ['Nome', 'Cognome', 'Azienda', 'Ruolo', 'Settore', 'Email', 'Paese']
ACCEPT_LANGUAGE = 'en,es;q=0.9,pt;q=0.8,nl;q=0.8,pl;q=0.7,de;q=0.7,fr;q=0.6,*;q=0.5'

RIMOSSI = {'Fine salvataggi', 'Prepara notifica successo', 'Call Singapore V3.3 | Success Monitor'}

CODICE_NODI = {
    'Prepara archivio': 'prepara-archivio.js',
    'Genera 5 Lotti': 'genera-lotti.js',
    'Normalizza output AI': 'normalizza-output-ai.js',
    'Prepara aggiornamento temi': 'prepara-aggiornamento-temi.js',
    'Aggiungi da riprovare': 'aggiungi-da-riprovare.js',
    'Deduplica e prepara righe': 'deduplica.js',
    'Controllo grandi aziende': 'controllo-grandi-aziende.js',
    'Prepara esclusa': 'prepara-esclusa.js',
    'Applica tetto RocketReach': 'applica-tetto-rocketreach.js',
    'Rinvia (tetto RocketReach)': 'rinvia-tetto-rocketreach.js',
    'Prospect non trovato RocketReach': 'prospect-non-trovato-rocketreach.js',
    'Normalizza RocketReach': 'normalizza-rocketreach.js',
    'Prepara righe finali': 'prepara-righe-finali.js',
    'Prepara Mailup': 'prepara-mailup.js',
    'Calcola statistiche': 'calcola-statistiche.js',
}

NOTA = """## Prospect Avvocati | Search
Cerca **avvocati penalisti** in Europa (esclusi Francia, Germania e Italia) e salva **solo chi ha un'email**. Per ogni studio un solo contatto: il **titolare** (l'avvocato stesso se lo studio è individuale, altrimenti fondatore / managing partner). Gira alle **06:00 e 18:00**.

**Flusso:** archivio e temi → 5 ricerche AI (temi a rotazione, 5 paesi diversi) → deduplica per persona e per studio (dominio) + esclusione grandi studi → email gratis dal sito (homepage, contatti, note legali / Impressum; preferita l'email col nome del titolare) → RocketReach (max 60 ricerche, max 3 tentativi a persona) → salvataggio + Log.

**Si configura dal foglio Google *TEST | Prospect Avvocati | Search*:**
- **Temi**: nicchie per paese e città (scrivi `NO` in *Attivo* per spegnerne una)
- **Esclusioni**: grandi studi da non contattare mai
- **Log**: una riga di statistiche per ogni esecuzione

Roadmap e storico: GitHub `marcoscazzari03/prospect-avvocati`"""


def leggi(*parti):
    with open(os.path.join(*parti), encoding='utf-8') as f:
        return f.read()


def codice_estrai(fase):
    t = leggi(CODICE, 'estrai-email.template.js')
    if fase == 'home':
        r = {'__SORGENTE__': 'Deduplica e prepara righe', '__FASE__': 'HOMEPAGE',
             '__CAMPO_FONTE__': 'prospect.Sito',
             '//__PAGINE__': leggi(CODICE, 'pagine-homepage.snippet.js').rstrip()}
    elif fase == 'p2':
        r = {'__SORGENTE__': 'Ha pagina secondaria?', '__FASE__': 'PAGINA 2',
             '__CAMPO_FONTE__': "prospect['Pagina da controllare']",
             '//__PAGINE__': "// La terza pagina serve solo se manca ancora un'email nominativa o generica.\n"
                             "if (basta) out['Pagina da controllare 2'] = '';"}
    else:
        r = {'__SORGENTE__': 'Serve terza pagina?', '__FASE__': 'PAGINA 3',
             '__CAMPO_FONTE__': "prospect['Pagina da controllare 2']", '//__PAGINE__': ''}
    for k, v in r.items():
        t = t.replace(k, v)
    return t.replace('\n\n\n\nreturn', '\n\nreturn').replace('\n\n\nreturn', '\n\nreturn')


def schema(colonne):
    return [{'id': c, 'displayName': c, 'required': False, 'defaultMatch': False, 'display': True,
             'type': 'string', 'canBeUsedToMatch': True} for c in colonne]


def foglio(params, scheda):
    params['documentId'] = {'__rl': True, 'mode': 'list', 'value': FOGLIO_ID, 'cachedResultName': FOGLIO_NOME,
                            'cachedResultUrl': f'https://docs.google.com/spreadsheets/d/{FOGLIO_ID}/edit'}
    gid = SCHEDE[scheda]
    params['sheetName'] = {'__rl': True, 'mode': 'list', 'value': gid, 'cachedResultName': scheda,
                           'cachedResultUrl': f'https://docs.google.com/spreadsheets/d/{FOGLIO_ID}/edit#gid={gid}'}


def build():
    base = json.loads(leggi(HERE, 'base-prospect-search.json'))
    nodi = {n['name']: copy.deepcopy(n) for n in base['nodes'] if n['name'] not in RIMOSSI}

    # Trigger: 06:00 e 18:00 (Europe/Rome), sfalsato rispetto a Singapore A/B/C (00/12)
    # e a Prospect | Search (03/15), che usano lo stesso account RocketReach.
    t = nodi.pop('Ogni 12 ore | 03:00 - 15:00')
    t['name'] = TRIGGER
    t['parameters'] = {'rule': {'interval': [{'field': 'cronExpression', 'expression': '0 6,18 * * *'}]}}
    nodi[TRIGGER] = t

    for nome, file in CODICE_NODI.items():
        nodi[nome]['parameters']['jsCode'] = leggi(CODICE, file).rstrip() + '\n'
    nodi['Estrai email homepage']['parameters']['jsCode'] = codice_estrai('home')
    nodi['Estrai email pagina secondaria']['parameters']['jsCode'] = codice_estrai('p2')

    agente = nodi['Ricerca prospect AI']['parameters']
    agente['text'] = leggi(PROMPT, 'prompt.txt').rstrip() + '\n'
    agente['options'] = {'systemMessage': leggi(PROMPT, 'system.txt').rstrip()}

    for nome, scheda in [('Read Prospect', 'Prospect AI'), ('Read Scartati', 'Scartati'), ('Read Temi', 'Temi'),
                         ('Read Esclusioni', 'Esclusioni'), ('Append - Prospect', 'Prospect AI'),
                         ('Append - Mailup', 'Mailup'), ('Append - Scartati', 'Scartati'),
                         ('Append - Log', 'Log'), ('Update - Temi', 'Temi')]:
        foglio(nodi[nome]['parameters'], scheda)
    nodi['Append - Prospect']['parameters']['columns']['schema'] = schema(COLONNE_PROSPECT)
    nodi['Append - Mailup']['parameters']['columns']['schema'] = schema(COLONNE_MAILUP)

    for nome in ['HTTP - Homepage', 'HTTP - Pagina secondaria']:
        for h in nodi[nome]['parameters']['headerParameters']['parameters']:
            if h['name'] == 'Accept-Language':
                h['value'] = ACCEPT_LANGUAGE

    # Scartati: data in ora italiana, campi studio, abbandono dopo 3 tentativi.
    ass = nodi['Prepara scartati']['parameters']['assignments']['assignments']
    for a in ass:
        if a['name'] == 'Data':
            a['value'] = "={{ $now.setZone('Europe/Rome').toFormat('yyyy-MM-dd') }}"
        if a['name'] == 'Motivo scarto':
            a['value'] = ("={{ String($json['Stato RocketReach'] || '').startsWith('ESCLUSA') "
                          "? 'Esclusa: grande azienda - ' + String($json['Stato RocketReach']).slice(9) "
                          ": (['RATE LIMIT', 'RICERCA NON COMPLETATA', 'RINVIATO (TETTO)'].includes($json['Stato RocketReach']) "
                          "? ((Number($json['Tentativi precedenti']) || 0) + 1 >= 3 "
                          "? 'Abbandonato: RocketReach non raggiunto dopo 3 tentativi' "
                          ": 'Da riprovare (limite RocketReach)') "
                          ": 'Nessuna email trovata (sito + RocketReach)') }}")
    ass += [{'id': 's13', 'name': 'Tipo studio', 'type': 'string', 'value': "={{ $json['Tipo studio'] }}"},
            {'id': 's14', 'name': 'Città', 'type': 'string', 'value': "={{ $json['Città'] }}"}]

    # Terza pagina (note legali / Impressum / privacy) se manca ancora l'email.
    sposta = 672
    for n in nodi.values():
        if n['position'][0] >= 4400:
            n['position'] = [n['position'][0] + sposta, n['position'][1]]

    se2 = copy.deepcopy(nodi['Ha pagina secondaria?'])
    se2.update(name='Serve terza pagina?', id='b7c1e2d3-0a4f-4b6e-9c21-7d3e5f6a8b90', position=[4400, -176])
    se2['parameters']['conditions']['conditions'][0].update(
        id='c2d3e4f5-1b2c-4d3e-8f4a-5b6c7d8e9f01', leftValue='={{ $json["Pagina da controllare 2"] }}')
    nodi[se2['name']] = se2

    http3 = copy.deepcopy(nodi['HTTP - Pagina secondaria'])
    http3.update(name='HTTP - Terza pagina', id='d3e4f5a6-2c3d-4e4f-9a5b-6c7d8e9f0a12', position=[4624, -352])
    http3['parameters']['url'] = '={{ $json["Pagina da controllare 2"] }}'
    nodi[http3['name']] = http3

    estrai3 = copy.deepcopy(nodi['Estrai email pagina secondaria'])
    estrai3.update(name='Estrai email terza pagina', id='e4f5a6b7-3d4e-4f5a-8b6c-7d8e9f0a1b23', position=[4848, -352])
    estrai3['parameters']['jsCode'] = codice_estrai('p3')
    nodi[estrai3['name']] = estrai3

    nodi['Riunisci risultati email']['parameters'] = {'numberInputs': 3}

    nota = nodi['Nota: come funziona']
    nota['parameters'].update(content=NOTA, height=420, width=1240)

    # Connessioni
    conn = copy.deepcopy(base['connections'])
    for r in RIMOSSI:
        conn.pop(r, None)
    for src in list(conn):
        for typ in conn[src]:
            conn[src][typ] = [[c for c in uscita if c['node'] not in RIMOSSI] for uscita in conn[src][typ]]
    conn[TRIGGER] = conn.pop('Ogni 12 ore | 03:00 - 15:00')

    def link(a, b, ia=0, ib=0):
        uscite = conn.setdefault(a, {}).setdefault('main', [])
        while len(uscite) <= ia:
            uscite.append([])
        uscite[ia].append({'node': b, 'type': 'main', 'index': ib})

    conn['Estrai email pagina secondaria'] = {'main': [[]]}
    link('Estrai email pagina secondaria', 'Serve terza pagina?')
    link('Serve terza pagina?', 'HTTP - Terza pagina', 0)
    link('Serve terza pagina?', 'Riunisci risultati email', 1, 2)
    link('HTTP - Terza pagina', 'Estrai email terza pagina')
    link('Estrai email terza pagina', 'Riunisci risultati email', 0, 0)

    gruppi = [g for g in base['nodeGroups'] if not g['name'].startswith('Success Monitor')]
    for g in gruppi:
        if g['name'].startswith('6 '):
            g['nodeNames'] += ['Serve terza pagina?', 'HTTP - Terza pagina', 'Estrai email terza pagina']
            g['description'] = ('Homepage, pagina contatti e note legali / Impressum: email gratis dal sito, '
                                'preferita quella col nome del titolare.')
        if g['name'].startswith('4 '):
            g['description'] = 'Riprende i "Da riprovare" (max 3 tentativi) e scarta persone e studi (dominio) già in archivio.'
        if g['name'].startswith('5 '):
            g['description'] = 'Esclude i grandi studi e le Big Four della scheda Esclusioni, prima di spendere crediti.'

    ordine = [TRIGGER] + [n['name'] for n in base['nodes'] if n['name'] in nodi and n['name'] != 'Ogni 12 ore | 03:00 - 15:00']
    ordine += [n for n in nodi if n not in ordine]

    return {
        'name': NOME,
        'nodes': [nodi[n] for n in ordine],
        'connections': conn,
        'nodeGroups': [{'name': g['name'], 'nodeNames': g['nodeNames'], 'description': g.get('description', '')}
                       for g in gruppi],
        'settings': {'executionOrder': 'v1', 'timezone': 'Europe/Rome', 'callerPolicy': 'workflowsFromSameOwner'},
    }


if __name__ == '__main__':
    wf = build()
    with open(os.path.join(HERE, 'prospect-avvocati-search.json'), 'w', encoding='utf-8') as f:
        json.dump(wf, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(len(wf['nodes']), 'nodi')
