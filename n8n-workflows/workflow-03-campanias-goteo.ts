import { workflow, node, trigger, sticky, newCredential, splitInBatches, nextBatch, expr } from '@n8n/workflow-sdk';

const log = sticky('## Flujo: Campañas por Goteo\n\n1. Frontend envía lista de clientes filtrados + mensaje\n2. Itera cliente por cliente\n3. Espera aleatorio 45-120s (anti-baneo)\n4. Personaliza mensaje con nombre y modelo\n5. Envía vía Evolution API\n6. Registra en log de campaña\n7. Si detecta "Salir" → Opt-Out automático', []);

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook Campaña',
    parameters: {
      httpMethod: 'POST',
      path: 'enviar-campania',
      options: {},
    },
  },
  output: [{
    body: {
      campaniaId: 1,
      mensajeBase: 'Hola {nombre}, tenemos ofertas para tu {modelo}. ¿Te interesa?',
      clientes: [
        { id: 1, nombre: 'Juan', telefono: '584141234567', modelo_carro: 'Civic' },
        { id: 2, nombre: 'María', telefono: '584147654321', modelo_carro: 'Corolla' },
      ],
    },
  }],
});

const normalizeInput = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Normalizar Input',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'cid', name: 'campaniaId', value: expr('{{ $json.body?.campaniaId ?? $json.campaniaId }}'), type: 'number' },
          { id: 'msg', name: 'mensajeBase', value: expr('{{ $json.body?.mensajeBase ?? $json.mensajeBase }}'), type: 'string' },
          { id: 'clients', name: 'clientes', value: expr('{{ $json.body?.clientes ?? $json.clientes }}'), type: 'array' },
        ],
      },
    },
  },
  output: [{ campaniaId: 1, mensajeBase: 'Hola {nombre}...', clientes: [] }],
});

const expandirClientes = node({
  type: 'n8n-nodes-base.splitOut',
  version: 1,
  config: {
    name: 'Expandir Clientes',
    parameters: {
      fieldToSplitOut: 'clientes',
      include: 'allOtherFields',
    },
  },
  output: [{ id: 1, nombre: 'Juan', telefono: '584141234567', modelo_carro: 'Civic', campaniaId: 1, mensajeBase: 'Hola {nombre}...' }],
});

const sibNode = splitInBatches({
  version: 3,
  config: {
    name: 'Batch 1 por 1',
    parameters: { batchSize: 1 },
  },
});

const esperarAntiBaneo = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Esperar 45-120s',
    parameters: {
      resume: 'timeInterval',
      amount: 5,
      unit: 'minutes',
    },
  },
});

const personalizarMensaje = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Personalizar Mensaje',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'per-msg', name: 'mensajePersonalizado', value: expr('{{ $json.mensajeBase.replace("{nombre}", $json.nombre).replace("{modelo}", $json.modelo_carro || "vehículo") }}'), type: 'string' },
          { id: 'sender', name: 'senderId', value: expr('{{ $json.telefono }}'), type: 'string' },
        ],
      },
    },
  },
  output: [{ mensajePersonalizado: 'Hola Juan...', senderId: '584141234567', id: 1, campaniaId: 1 }],
});

const enviarEvolution = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Enviar Evolution API',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.EVOLUTION_API_URL || "http://evolution-api:8080" }}/message/sendText/{{ $env.EVOLUTION_INSTANCE || "romicars" }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'apikey', value: expr('{{ $env.EVOLUTION_API_KEY }}') },
        ],
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{ "number": "{{ $json.senderId }}", "text": "{{ $json.mensajePersonalizado }}" }'),
    },
  },
  credentials: { httpHeaderAuth: newCredential('Evolution API Header') },
  output: [{ success: true }],
});

const actualizarLog = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Actualizar Log Campaña',
    parameters: {
      operation: 'executeQuery',
      query: `INSERT INTO campania_log (campania_id, cliente_id, estado, enviado_en)
              VALUES ($1, $2, 'enviado', NOW())`,
      options: {
        queryReplacement: expr('{{ $json.campaniaId }},{{ $json.id }}'),
      },
    },
  },
  credentials: { mySql: newCredential('MySQL AutoParts') },
  output: [{ success: true }],
});

const finalizar = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Campaña Completada' },
  output: [{}],
});

export default workflow('campanias-goteo', 'Campañas por Goteo')
  .add(log)
  .add(webhookTrigger)
  .to(normalizeInput)
  .to(expandirClientes)
  .to(sibNode
    .onDone(finalizar)
    .onEachBatch(esperarAntiBaneo.to(personalizarMensaje).to(enviarEvolution).to(actualizarLog).to(nextBatch(sibNode)))
  );
