# Roadmap: Prospect Avvocati | Search

Obiettivi: **più prospect al giorno** e **meno costi API**. Nel foglio finiscono solo persone con email, una per studio: il titolare.
Lavoriamo sulla copia di test. Ciò che funziona si misura nel Log prima di renderlo stabile.

Legenda: ✅ fatto · 🔄 in corso · ⏳ da fare · 💡 idea da valutare

---

## 📌 Da ricordare

- Il workflow è **non attivo**: gira solo a mano finché non decidiamo di attivarlo (06:00 e 18:00).
- **Regola pratica RocketReach:** non lanciare esecuzioni a meno di un'ora da Singapore A/B/C (00:00, 12:00) e da Prospect | Search (03:00, 15:00): stesso account, circa 70 ricerche l'ora.
- Il workflow "Setup foglio" è già stato eseguito: **non rilanciarlo** (creerebbe un secondo file).

## Fase 0: Setup ✅

- ✅ Copia del workflow base "Prospect | Search" (`f03lATvrzkJYAOw6`) salvata in `workflows/base-prospect-search.json`.
- ✅ Foglio Google separato **TEST | Prospect Avvocati | Search** creato dal workflow "Setup foglio", con le sei schede (Prospect AI, Mailup, Scartati, Log, Temi, Esclusioni).
- ✅ Workflow **Prospect Avvocati | Search** creato su n8n e collegato al nuovo foglio.
- ✅ Success Monitor rimosso (nella copia base era già scollegato).
- ✅ Sorgenti in repo (`workflows/codice`, `workflows/prompt`, `workflows/build.py`) e workflow **Deploy da GitHub** per portare su n8n le modifiche senza copiarle a mano.

## Fase 1: Adattamento agli avvocati penalisti ✅

- ✅ **Temi:** 69 nicchie in 34 paesi europei (esclusi Francia, Germania e Italia), divise per città o specializzazione e scritte nella lingua locale ("abogado penalista", "strafrechtadvocaat", "adwokat karnista"…). Più nicchie dove il mercato è più grande (Regno Unito 10, Spagna 7, Polonia 4…).
- ✅ **Rotazione:** 5 temi per esecuzione, al massimo 1 per paese (con 34 paesi ogni esecuzione tocca 5 paesi diversi).
- ✅ **Prompt AI** riscritto e accorciato (circa metà dei caratteri del base → meno token per ogni passo di ricerca):
  - solo avvocati che fanno davvero penale;
  - **un contatto per studio, il titolare**: l'avvocato stesso se lo studio è individuale; fondatore / managing partner / senior partner / name partner se è associato. Esclusi associati, praticanti, of counsel;
  - esclusi grandi studi, Big Four, PM e giudici, ordini e associazioni;
  - nuovi campi: tipo studio (individuale / associato), città, pagina contatti del sito (se l'AI l'ha già vista, senza ricerche apposta).
- ✅ **Esclusioni:** circa 115 grandi studi (internazionali e top nazionali dei paesi target) + Big Four. Lasciati fuori di proposito i boutique penali noti (es. Kingsley Napley, Peters & Peters): sono buoni prospect.

## Fase 2: Meno costi, più email gratis ✅ (da misurare)

- ✅ **Deduplica per studio (dominio del sito):** mai due contatti dello stesso studio, né nella stessa esecuzione né rispetto all'archivio. Niente crediti RocketReach spesi su un secondo socio.
- ✅ **Siti non ufficiali scartati prima** (LinkedIn, directory di avvocati, pagine gialle…): non si scarica nulla e non si paga RocketReach su siti senza email dello studio.
- ✅ **Email dal sito su tre pagine, tutte gratis:**
  1. homepage;
  2. pagina contatti (o quella indicata dall'AI);
  3. note legali / Impressum / aviso legal / privacy: in Europa i professionisti devono indicare l'email sul sito (direttiva e-commerce), quindi spesso è lì.
  - Se il sito è in JavaScript e non ha link leggibili, si provano i percorsi tipici del paese (`/contacto`, `/kontakt`, `/impressum`…).
  - La terza pagina si scarica solo se manca ancora un'email nominativa o generica.
- ✅ **Scelta dell'email:** prima quella col nome del titolare, poi la generica dello studio (info@, kanzlei@, despacho@…), poi le altre. Il tipo è scritto nella colonna "Tipo email" (SITO - NOMINATIVA / GENERICA / ALTRA EMAIL / EMAIL GRATUITA / PRIVACY, oppure ROCKETREACH VALIDATA).
- ✅ **Email gratuite e degli ordini forensi** (gmail, hotmail, `adv.oa.pt`, `icam.es`, `icab.cat`…) accettate solo se compaiono in un link mailto del sito ufficiale: molti avvocati individuali usano queste caselle.
- ✅ Email offuscate riconosciute anche in forma "nome [at] studio [dot] es"; scartati indirizzi finti (noreply, example, immagini tipo logo@2x.png).
- ✅ **RocketReach:** tetto di 60 ricerche per esecuzione (come il base), precedenza ai "Da riprovare".
- ✅ **Max 3 tentativi a persona:** al terzo rinvio la persona va negli Scartati come "Abbandonato" e non viene più ripresa. Colonna nuova nel Log: "Abbandonati dopo tentativi".
- ✅ I "Da riprovare" il cui studio è già in archivio con un'altra persona non vengono più ripresi.

## Fase 3: Misura 🔄

- ✅ Prima esecuzione manuale di verifica (3475, vedi Misure): 75 salvati su 101 nuovi, **74% di email gratis dal sito**, 0 lotti falliti, durata 8 min.
- ✅ Correzioni dopo la 3475:
  - scartate le email segnaposto ("etunimi.sukunimi@", "firstname.lastname@"…);
  - un'email con lo stesso cognome ma un altro nome (es. un familiare nello studio) non conta più come nominativa;
  - la pagina 2 / 3 non punta più a feed, CSS, news o ancore della homepage; percorsi tipici aggiunti per Finlandia, Regno Unito, Irlanda, Ungheria (impresszum), Grecia, Balcani;
  - riconosciute come generiche anche ugyved@, web@, kontor@, advokatbyra@.
- ⏳ **RocketReach sugli avvocati:** nella 3475 **0 email su 26 ricerche** (20 persone non trovate, 6 senza email valida). Dopo 2–3 esecuzioni, se resta così, spegnere RocketReach (o tenerlo solo per Regno Unito / Irlanda) e far finire gli altri direttamente negli Scartati: costo RocketReach a zero.
- ⏳ Gli scartati senza email (26 nella 3475) sono soprattutto siti fatti con costruttori in JavaScript o con solo il modulo di contatto: valutare se vale la pena un servizio di rendering (a pagamento) o accettare la perdita.
- ⏳ Dopo 4–6 esecuzioni guardare nel Log:
  - % di email dal sito e quota di email nominative;
  - email RocketReach / ricerche RocketReach, per paese (Scartati + Prospect AI hanno la colonna Paese);
  - % di nuovi candidati per tema (scheda Temi).
- ⏳ **Decidere l'attivazione automatica** (06:00 e 18:00) dopo la verifica.

## Fase 4: Più prospect al giorno ⏳

- ⏳ **Scelta dei temi in base alla resa:** dare la precedenza alle nicchie con più "Nuovi totali / Candidati totali" e più email; spegnere quelle esaurite.
- ⏳ **Più esecuzioni al giorno** (es. 3: 06:00, 18:00 e 21:00) se il costo per prospect salvato resta basso. Limite: RocketReach (≈70 ricerche/ora e crediti mensili).
- 💡 **Partire dagli albi degli ordini forensi:** molti ordini (es. ICAM, Ordem dos Advogados, NOvA, Law Society, Naczelna Rada Adwokacka) hanno motori di ricerca pubblici per specializzazione. Scaricarli via HTTP è gratis; l'AI servirebbe solo per scegliere i titolari, senza ricerca web.
- 💡 **Dimensione dei lotti:** valutare 30 candidati per lotto se il Log non mostra timeout o lotti recuperati.

## Fase 5: Costi RocketReach ⏳

- ⏳ Valutare se RocketReach rende sugli avvocati: per studi individuali europei la copertura potrebbe essere bassa. Se il rapporto email / ricerche resta sotto il 20–25%, provare:
  - RocketReach solo per alcuni paesi (es. Regno Unito, Irlanda, Paesi Bassi, paesi nordici);
  - oppure niente RocketReach e solo email dal sito.
- 💡 Prima di RocketReach, provare un controllo gratuito delle email probabili (nome.cognome@dominio) con un servizio di verifica SMTP a basso costo.

---

## Misure

| Data | Esecuzione | Candidati AI | Nuovi | Email da sito (nominative) | Email RocketReach | Salvati | Scartati | Costo | Note |
|---|---|---|---|---|---|---|---|---|---|
| 2026-10-09 | 3475 | 103 | 101 (98%) | 75 (24 nominative, 44 generiche, 7 altre) | 0 / 26 ricerche | **75** | 26 | non misurato (prompt più corto del base, ~0,3 $ stimati) | Prima esecuzione, archivio vuoto. Temi: SE01, FI01, IE02, UK07, HU02. Salvati: Svezia 21/25, Irlanda 19/23, Finlandia 13/22, Regno Unito 12/17, Ungheria 10/14. 67 studi associati, 34 individuali. Durata 8 min. |
