// Nel foglio Mailup vogliamo solo prospect con una email certa.
const pulito = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');

return $input.all()
  .map(i => i.json)
  .filter(j => pulito(j['Email certa']))
  .map(j => ({
    json: {
      Nome: pulito(j['Nome Mailup']),
      Cognome: pulito(j['Cognome Mailup']),
      Azienda: pulito(j.Azienda),
      Ruolo: pulito(j.Ruolo),
      Settore: pulito(j.Settore),
      Email: pulito(j['Email certa']),
      Paese: pulito(j.Paese)
    }
  }));
