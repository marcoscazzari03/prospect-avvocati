"""Schede e intestazioni del foglio "TEST | Prospect Avvocati | Search"."""
import csv, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'data')

TITOLO = 'TEST | Prospect Avvocati | Search'

# gid fissi: il workflow punta alle schede per gid.
SCHEDE = [
    (101, 'Prospect AI', ['Data', 'Nome', 'Azienda', 'Ruolo', 'Tipo studio', 'Città', 'Paese', 'Settore', 'Sito',
                          'Email certa', 'Tipo email', 'Fonte email', 'Stato email', 'Email probabili', 'LinkedIn']),
    (102, 'Mailup', ['Nome', 'Cognome', 'Azienda', 'Ruolo', 'Settore', 'Email', 'Paese']),
    (103, 'Scartati', ['Data', 'Nome', 'Azienda', 'Ruolo', 'Tipo studio', 'Città', 'Paese', 'Settore', 'Sito',
                       'Email probabili', 'LinkedIn', 'Motivo scarto', 'Nome Mailup', 'Cognome Mailup']),
    (104, 'Log', ['Data ora', 'Execution ID', 'Lotti', 'Lotti falliti', 'Lotti recuperati', 'Candidati AI',
                  'Scartati deduplica', 'Nuovi candidati', '% nuovi', 'Email da sito', 'Email sito nominative',
                  'Lookup RocketReach', 'RocketReach non trovati', 'Email da RocketReach', 'Salvati Prospect AI',
                  'Scartati senza email', 'Righe Mailup', 'Riprovati da Scartati', 'Ricontrolli RocketReach',
                  'RocketReach rate limit', 'Da riprovare', 'Rinviati tetto RocketReach', 'Escluse grandi aziende',
                  'Abbandonati dopo tentativi']),
    (105, 'Temi', ['ID', 'Paese', 'Settore', 'Tema', 'Attivo', 'Ultimo uso', 'Usi', 'Candidati totali',
                   'Nuovi totali', 'Ultimo esito']),
    (106, 'Esclusioni', ['Nome o marchio', 'Categoria', 'Attivo']),
]


def righe_csv(nome, colonne):
    with open(os.path.join(DATA, nome), newline='', encoding='utf-8') as f:
        return [[r.get(c, '') for c in colonne] for r in csv.DictReader(f)]


def corpo_creazione():
    return {
        'properties': {'title': TITOLO, 'locale': 'it_IT', 'timeZone': 'Europe/Rome'},
        'sheets': [{'properties': {'sheetId': gid, 'title': t, 'gridProperties': {'frozenRowCount': 1}}}
                   for gid, t, _ in SCHEDE],
    }


def corpo_valori():
    data = []
    for gid, titolo, cols in SCHEDE:
        valori = [cols]
        if titolo == 'Temi':
            valori += righe_csv('temi-iniziali.csv', cols)
        if titolo == 'Esclusioni':
            valori += righe_csv('esclusioni-iniziali.csv', cols)
        data.append({'range': f"'{titolo}'!A1", 'values': valori})
    return {'valueInputOption': 'RAW', 'data': data}
