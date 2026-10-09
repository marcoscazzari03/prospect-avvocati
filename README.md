# prospect-avvocati

Workflow n8n per la ricerca automatica di prospect per i **Le Fonti Awards** tra gli **avvocati penalisti in Europa**, esclusi **Francia, Germania e Italia**.

È una copia adattata di "Prospect | Search" (repo [`marcoscazzari03/prospect`](https://github.com/marcoscazzari03/prospect)), di cui riprende la logica: rotazione dei temi, deduplica, email gratis dal sito, RocketReach con tetto e "Da riprovare", filtro grandi aziende, Log.

**Obiettivi:**

1. il maggior numero possibile di prospect al giorno;
2. il minor costo possibile in API (OpenAI, RocketReach).

**Regole fisse:**

- nel foglio finiscono **solo persone con email**. Va bene anche l'email dello studio (info@, contact@, kanzlei@...) trovata sul sito ufficiale;
- per ogni studio **un solo contatto, il titolare**: l'avvocato stesso se lo studio è individuale, altrimenti il fondatore / managing partner / senior partner.

La roadmap con lo stato dei lavori e i prossimi passi è in [ROADMAP.md](ROADMAP.md).

## Ambienti

| | Test |
|---|---|
| Workflow n8n | **Prospect Avvocati \| Search** (`rKUcaJepe2momTLB`), **attivo dal 9 ottobre 2026**, 06:00 e 18:00 (ora italiana) |
| Google Sheets | **TEST \| Prospect Avvocati \| Search** (`1g0XfNM3vj5icNmfeEROydjFKHERVh5jqgRPo_nHO0Bs`, account `ads.lefonti@gmail.com`) |
| Monitor | nessuno |
| Workflow di servizio | **Prospect Avvocati \| Setup foglio** (`wzJfijNP6pvbBDJ3`, già eseguito: non rilanciarlo, crea un file nuovo) · **Prospect Avvocati \| Deploy da GitHub** (`ukFESbZg52G35hja`) |

Gli orari 06:00 / 18:00 sono sfalsati rispetto a Singapore A/B/C (00:00 / 12:00) e a Prospect | Search (03:00 / 15:00), perché usano tutti lo stesso account RocketReach, che ha un limite di circa 70 ricerche l'ora.

Il file Google ha sei schede (stesse del workflow base, con qualche colonna in più):

- **Prospect AI**: prospect con email (Data, Nome, Azienda = studio, Ruolo, Tipo studio, Città, Paese, Settore, Sito, Email certa, Tipo email, Fonte email…);
- **Mailup**: gli stessi prospect nel formato per Mailup, più la colonna Paese;
- **Scartati**: chi non ha email. "Da riprovare" = ripreso all'esecuzione successiva; dopo 3 rinvii diventa "Abbandonato";
- **Log**: una riga di statistiche per ogni esecuzione;
- **Temi**: 69 nicchie per paese e città (34 paesi). A ogni esecuzione ne vengono usate 5, di 5 paesi diversi, a rotazione. Si possono aggiungere righe o spegnerle scrivendo `NO` in "Attivo";
- **Esclusioni**: grandi studi internazionali e nazionali e Big Four da non contattare mai. Si possono aggiungere righe o spegnerle con `NO`.

## Differenze rispetto a Prospect | Search

| | Prospect \| Search | Prospect Avvocati \| Search |
|---|---|---|
| Target | PMI di SG / MY / ID | Avvocati penalisti, titolari di studio, 34 paesi europei |
| Prompt AI | lungo, generico | più corto (meno token), solo penalisti titolari, chiede anche tipo studio, città e pagina contatti |
| Deduplica | per persona | per persona **e per studio** (dominio del sito): mai due contatti dello stesso studio |
| Email dal sito | homepage + 1 pagina | homepage + pagina contatti + **note legali / Impressum / privacy**, con percorsi tipici per paese se il sito è in JavaScript |
| Scelta dell'email | prima la generica | prima quella **col nome del titolare**, poi la generica dello studio, poi le altre |
| Email accettate | solo del dominio | del dominio + gmail/hotmail/… e caselle degli ordini forensi (es. `adv.oa.pt`, `icam.es`) se sono in un link mailto del sito |
| "Da riprovare" | senza limite | **max 3 tentativi** a persona, poi "Abbandonato" |
| Esclusioni | marchi + Tbk / Berhad / plc | marchi (grandi studi, Big Four) + plc |
| Success Monitor | scollegato | rimosso |

## Contenuto della repo

| Percorso | Cosa contiene |
|---|---|
| `workflows/base-prospect-search.json` | Export di "Prospect \| Search" (`f03lATvrzkJYAOw6`) usato come base. Non va modificato. |
| `workflows/codice/*.js` | Codice dei nodi Code. `estrai-email.template.js` genera i tre nodi "Estrai email…"; `pagine-homepage.snippet.js` sceglie le pagine da controllare. |
| `workflows/prompt/` | Prompt e system message della ricerca AI. |
| `workflows/build.py` | Costruisce il workflow a partire dalla base + codice + prompt. |
| `workflows/prospect-avvocati-search.json` | Istantanea del workflow generata da `build.py`: è quello che gira su n8n. |
| `workflows/setup-foglio.sdk.ts`, `workflows/deploy.sdk.ts` | Sorgenti dei due workflow di servizio. |
| `data/temi-iniziali.csv` | Elenco iniziale delle nicchie (scheda Temi). |
| `data/esclusioni-iniziali.csv` | Elenco iniziale delle esclusioni (scheda Esclusioni). |

## Come modificare il workflow

1. Modificare `workflows/codice/`, `workflows/prompt/` o `workflows/build.py`.
2. `python3 workflows/build.py` per rigenerare `workflows/prospect-avvocati-search.json`.
3. Commit e push.
4. Su n8n eseguire **Prospect Avvocati \| Deploy da GitHub**: copia l'istantanea nel workflow. I gruppi di nodi (riquadri sul canvas) restano quelli già presenti su n8n: se se ne aggiungono, vanno impostati a parte.

Se invece si modifica il workflow direttamente su n8n, riportare la modifica nei file sorgente, altrimenti il deploy successivo la cancella.
