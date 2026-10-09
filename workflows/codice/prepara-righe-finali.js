const emailSito = String($json['Email trovata sito'] || '').trim();
const emailRR = String($json['Email RocketReach'] || '').trim();
const emailFinale = emailSito || emailRR || '';

let tipoEmail = '';
let fonteEmail = '';
let statoEmail = '';

if (emailSito) {
  tipoEmail = $json['Tipo email sito'] || 'SITO UFFICIALE';
  fonteEmail = $json['Fonte email'] || $json.Sito || '';
  statoEmail = 'EMAIL TROVATA';
} else if (emailRR) {
  tipoEmail = 'ROCKETREACH VALIDATA';
  fonteEmail = 'RocketReach';
  statoEmail = 'EMAIL TROVATA';
} else {
  tipoEmail = 'SOLO EMAIL PROBABILI';
  fonteEmail = '';
  statoEmail = 'EMAIL NON TROVATA';
}

return {
  json: {
    Data: $now.setZone('Europe/Rome').toFormat('yyyy-MM-dd'),
    Nome: $json.Nome || '',
    'Nome Mailup': $json['Nome Mailup'] || '',
    'Cognome Mailup': $json['Cognome Mailup'] || '',
    Azienda: $json.Azienda || '',
    Ruolo: $json['Ruolo proposto'] || '',
    'Tipo studio': $json['Tipo studio'] || '',
    'Città': $json['Città'] || '',
    Paese: $json.Paese || '',
    Settore: $json.Settore || '',
    Sito: $json.Sito || '',
    'Email certa': emailFinale,
    'Tipo email': tipoEmail,
    'Fonte email': fonteEmail,
    'Stato email': statoEmail,
    'Email probabili': $json['Email probabile/i'] || '',
    LinkedIn: $json['LinkedIn RocketReach'] || '',
    // Usati solo per decidere il motivo dello scarto
    'Stato RocketReach': $json['Stato RocketReach'] || '',
    'Tentativi precedenti': Number($json['Tentativi precedenti']) || 0
  }
};
