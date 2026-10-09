import { workflow, node, trigger, sticky, expr } from '@n8n/workflow-sdk';

const avvio = trigger({
  type: 'n8n-nodes-base.manualTrigger', version: 1,
  config: { name: 'Avvio manuale', position: [0, 0] },
  output: [{}]
});

const leggiIstantanea = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'GitHub - Istantanea workflow',
    position: [220, 0],
    parameters: {
      url: 'https://api.github.com/repos/marcoscazzari03/prospect-avvocati/contents/workflows/prospect-avvocati-search.json?ref=claude/confident-maxwell-wcy0xf',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github.raw+json' }, { name: 'User-Agent', value: 'n8n-prospect-avvocati' }] },
      options: { response: { response: { responseFormat: 'json' } } }
    }
  },
  output: [{ name: 'Prospect Avvocati | Search', nodes: [], connections: {}, settings: {} }]
});

const aggiorna = node({
  type: 'n8n-nodes-base.n8n', version: 1,
  config: {
    name: 'Aggiorna Prospect Avvocati | Search',
    position: [440, 0],
    parameters: {
      resource: 'workflow',
      operation: 'update',
      workflowId: { __rl: true, mode: 'id', value: 'rKUcaJepe2momTLB' },
      workflowObject: expr('{{ JSON.stringify({ name: $json.name, nodes: $json.nodes, connections: $json.connections, settings: $json.settings }) }}')
    },
    credentials: { n8nApi: { id: 'ZF0e7oXtMU8MHCse', name: 'n8n account' } }
  },
  output: [{ id: 'rKUcaJepe2momTLB', name: 'Prospect Avvocati | Search' }]
});

const nota = sticky('## Deploy da GitHub\nCopia su n8n l\'istantanea `workflows/prospect-avvocati-search.json` della repo prospect-avvocati (generata da `workflows/build.py`) nel workflow **Prospect Avvocati | Search**.\n\nI gruppi di nodi non passano dall\'API: vanno reimpostati a parte.', [leggiIstantanea, aggiorna], { color: 7 });

export default workflow('prospect-avvocati-deploy', 'Prospect Avvocati | Deploy da GitHub')
  .add(avvio)
  .to(leggiIstantanea)
  .to(aggiorna)
  .add(nota);
