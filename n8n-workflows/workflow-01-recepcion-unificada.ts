import { workflow, node, trigger, sticky, placeholder, newCredential, ifElse, expr } from '@n8n/workflow-sdk';

const log = sticky('## Flujo: Recepción Unificada\n\n1. Recibe mensaje vía webhook (Evolution API / FB / IG)\n2. Normaliza datos del mensaje\n3. Busca o crea cliente en MySQL\n4. Guarda mensaje en BD\n5. Verifica SLA de 15 min\n6. Si no respondió agente, activa IA', []);

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook Reception',
    parameters: {
      httpMethod: 'POST',
      path: 'receive-message',
      options: {},
    },
  },
  output: [{
    body: {
      sender: '584141234567',
      message: 'Hola, necesito un repuesto para mi carro',
      channel: 'whatsapp',
      timestamp: '2026-07-17T15:00:00Z',
      name: 'Juan Pérez',
    },
  }],
});

const normalizeMsg = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Normalizar Mensaje',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'sender-id', name: 'senderId', value: expr('{{ $json.body?.sender ?? $json.sender ?? "" }}'), type: 'string' },
          { id: 'msg', name: 'message', value: expr('{{ $json.body?.message ?? $json.message ?? "" }}'), type: 'string' },
          { id: 'chnl', name: 'channel', value: expr('{{ $json.body?.channel ?? $json.channel ?? "whatsapp" }}'), type: 'string' },
          { id: 'ts', name: 'timestamp', value: expr('{{ $json.body?.timestamp ?? $json.timestamp ?? $now.toISO() }}'), type: 'string' },
          { id: 'nm', name: 'clientName', value: expr('{{ $json.body?.name ?? $json.name ?? "" }}'), type: 'string' },
        ],
      },
    },
  },
  output: [{
    senderId: '584141234567',
    message: 'Hola, necesito un repuesto para mi carro',
    channel: 'whatsapp',
    timestamp: '2026-07-17T15:00:00Z',
    clientName: 'Juan Pérez',
  }],
});

const buscarCliente = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Buscar Cliente',
    parameters: {
      operation: 'executeQuery',
      query: 'SELECT * FROM clientes WHERE telefono = $1 LIMIT 1',
      options: {
        queryReplacement: expr('{{ $json.senderId }}'),
      },
    },
  },
  output: [{ id: 1, nombre: 'Juan Pérez', telefono: '584141234567', canal_origen: 'whatsapp' }],
});

const clienteExiste = ifElse({
  version: 2.3,
  config: {
    name: 'Cliente existe?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
        conditions: [{
          leftValue: expr('{{ $json.id }}'),
          operator: { type: 'number', operation: 'notEmpty', singleValue: true },
        }],
        combinator: 'and',
      },
    },
  },
});

const crearCliente = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Crear Cliente Nuevo',
    parameters: {
      operation: 'insert',
      table: { __rl: true, mode: 'list', value: 'clientes' },
      dataMode: 'defineBelow',
      valuesToSend: {
        values: [
          { column: 'telefono', value: expr('{{ $json.senderId }}') },
          { column: 'nombre', value: expr('{{ $json.clientName }}') },
          { column: 'canal_origen', value: expr('{{ $json.channel }}') },
        ],
      },
    },
  },
  credentials: { mySql: newCredential('MySQL AutoParts') },
  output: [{ id: 2, telefono: '584141234567' }],
});

const prepararDatosCliente = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Preparar ID Cliente',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          { id: 'cliente-id', name: 'clienteId', value: expr('{{ $json.id ?? $json.insertId }}'), type: 'number' },
        ],
      },
    },
  },
  output: [{ clienteId: 1, message: 'Hola', senderId: '584141234567' }],
});

const guardarMensaje = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Guardar Mensaje en BD',
    parameters: {
      operation: 'insert',
      table: { __rl: true, mode: 'list', value: 'mensajes' },
      dataMode: 'defineBelow',
      valuesToSend: {
        values: [
          { column: 'cliente_id', value: expr('{{ $json.clienteId }}') },
          { column: 'remitente', value: 'cliente' },
          { column: 'contenido', value: expr('{{ $json.message }}') },
          { column: 'tipo', value: 'texto' },
        ],
      },
    },
  },
  credentials: { mySql: newCredential('MySQL AutoParts') },
  output: [{ id: 1, cliente_id: 1 }],
});

const verificarSLA = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Verificar SLA 15 min',
    parameters: {
      operation: 'executeQuery',
      query: `SELECT COUNT(*) as agente_respondio FROM mensajes
              WHERE cliente_id = $1 AND remitente = 'agente'
              AND fecha_envio >= NOW() - INTERVAL 15 MINUTE`,
      options: {
        queryReplacement: expr('{{ $json.clienteId }}'),
      },
    },
  },
  credentials: { mySql: newCredential('MySQL AutoParts') },
  output: [{ agente_respondio: 0 }],
});

const slaCumplido = ifElse({
  version: 2.3,
  config: {
    name: 'Agente respondió?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.agente_respondio }}'),
          operator: { type: 'number', operation: 'larger', singleValue: true },
          rightValue: '0',
        }],
        combinator: 'and',
      },
    },
  },
});

const activarBot = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Activar Bot IA',
    parameters: {
      method: 'POST',
      url: expr('{{ $env.WEBHOOK_BOT_URL || "http://n8n:5678/webhook/bot-contingencia" }}'),
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{ "clienteId": {{ $json.clienteId }}, "message": {{ $json.message }}, "senderId": {{ $json.senderId }}, "channel": {{ $json.channel }}, "clientName": {{ $json.clientName }} }'),
    },
  },
  output: [{ success: true }],
});

const finSLA = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'SLA OK - Agente responde' },
  output: [{}],
});

// Build the post-SLA chain (shared in both branches)
const postSlaChain = slaCumplido
  .onTrue(finSLA)
  .onFalse(activarBot);

export default workflow('reception-unificada', 'Recepción Unificada')
  .add(log)
  .add(webhookTrigger)
  .to(normalizeMsg)
  .to(buscarCliente)
  .to(clienteExiste
    .onTrue(
      prepararDatosCliente
        .to(guardarMensaje)
        .to(verificarSLA)
        .to(postSlaChain)
    )
    .onFalse(
      crearCliente
        .to(prepararDatosCliente)
        .to(guardarMensaje)
        .to(verificarSLA)
        .to(postSlaChain)
    )
  );
