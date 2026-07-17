import { workflow, node, trigger, sticky, newCredential, ifElse, switchCase, expr } from '@n8n/workflow-sdk';

const log = sticky('## Flujo: Recepción Unificada\n\n1. Recibe mensaje vía webhook (Evolution API / FB / IG)\n2. Normaliza datos del mensaje (senderId, channel)\n3. Buffer Redis: acumula mensajes por 7s (debounce anti-chunks)\n4. Busca cliente por columna dinámica (telefono/facebook_psid/instagram_psid según channel)\n5. Crea cliente nuevo si no existe\n6. Guarda mensaje en BD\n7. Verifica SLA de 15 min\n8. Si no respondió agente, activa IA', []);

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
          { id: 'sender-id', name: 'senderId', value: expr('{{ $json.body?.sender ?? $json.body?.senderId ?? $json.sender ?? "" }}'), type: 'string' },
          { id: 'msg', name: 'message', value: expr('{{ $json.body?.message ?? $json.message ?? "" }}'), type: 'string' },
          { id: 'chnl', name: 'channel', value: expr('{{ $json.body?.channel ?? $json.channel ?? "whatsapp" }}'), type: 'string' },
          { id: 'ts', name: 'timestamp', value: expr('{{ $json.body?.timestamp ?? $json.timestamp ?? $now.toISO() }}'), type: 'string' },
          { id: 'nm', name: 'clientName', value: expr('{{ $json.body?.name ?? $json.body?.pushName ?? $json.name ?? "" }}'), type: 'string' },
          { id: 'conv-id', name: 'conversacionId', value: expr('{{ $json.body?.conversacionId ?? $json.conversacionId ?? $json.body?.sender ?? $json.sender ?? $json.senderId }}'), type: 'string' },
        ],
      },
    },
  },
});

const pushRedis = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Agregar Mensaje a Cola',
    parameters: {
      operation: 'push',
      list: expr('{{ $json.conversacionId }}'),
      messageData: expr('={ "mensaje": "' + '{{ $json.message }}' + '", "timestamp": "' + '{{ $json.timestamp }}' + '", "senderId": "' + '{{ $json.senderId }}' + '" }'),
      tail: true,
    },
  },
  credentials: { redis: newCredential('Redis n8n') },
});

const getRedis = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Consultar Historial Temporal',
    parameters: {
      operation: 'get',
      propertyName: 'Mensaje',
      keyType: 'list',
      key: expr('{{ $json.conversacionId }}'),
      options: {},
    },
  },
  credentials: { redis: newCredential('Redis n8n') },
});

const checkTime = switchCase({
  version: 3.2,
  config: {
    name: 'Pasaron 7s de silencio',
    parameters: {
      rules: {
        values: [
          {
            outputKey: 'Tiempo cumplido (Responder)',
            conditions: {
              options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
              conditions: [{
                leftValue: expr('{{ DateTime.fromJSDate(new Date(JSON.parse($json.Mensaje[0]).timestamp)).toISO() }}'),
                operator: { type: 'dateTime', operation: 'before' },
                rightValue: expr('{{ $now.minus({ seconds: 7 }).toISO() }}'),
              }],
              combinator: 'and',
            },
          },
        ],
      },
      options: {
        fallbackOutput: 'extra',
        renameFallbackOutput: 'Aún escribiendo (Reintentar)',
      },
    },
  },
});

const deleteRedis = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Limpiar Buffer de Conversación',
    parameters: {
      operation: 'delete',
      key: expr('{{ $json.conversacionId }}'),
    },
  },
  credentials: { redis: newCredential('Redis n8n') },
});

const concatMessages = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Concatenar Mensajes',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'concat-msg', name: 'message', value: expr('{{ $json.Mensaje.map(m => JSON.parse(m).mensaje).join("\\n") }}'), type: 'string' },
          { id: 'concat-sid', name: 'senderId', value: expr('{{ JSON.parse($json.Mensaje[0]).senderId }}'), type: 'string' },
          { id: 'concat-chn', name: 'channel', value: expr('{{ $json.channel }}'), type: 'string' },
          { id: 'concat-nm', name: 'clientName', value: expr('{{ $json.clientName }}'), type: 'string' },
        ],
      },
    },
  },
});

const waitDebounce = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Ciclo de Debounce (7s)',
    parameters: {
      resume: 'timeInterval',
      amount: 7,
      unit: 'seconds',
    },
  },
});

const buildSearchColumn = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Definir Columna Búsqueda',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          {
            id: 'search-col',
            name: 'searchColumn',
            value: expr('{{ $json.channel == "whatsapp" ? "telefono" : ($json.channel == "facebook" ? "facebook_psid" : "instagram_psid") }}'),
            type: 'string',
          },
        ],
      },
    },
  },
});

const buscarCliente = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Buscar Cliente',
    alwaysOutputData: true,
    parameters: {
      operation: 'executeQuery',
      query: expr('=SELECT * FROM clientes WHERE {{ $json.searchColumn }} = "{{ $json.senderId }}" LIMIT 1'),
      options: {},
    },
  },
  credentials: { mySql: newCredential('MySQL Demo') },
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
          { column: 'telefono', value: expr('{{ $json.channel == "whatsapp" ? $json.senderId : null }}') },
          { column: 'facebook_psid', value: expr('{{ $json.channel == "facebook" ? $json.senderId : null }}') },
          { column: 'instagram_psid', value: expr('{{ $json.channel == "instagram" ? $json.senderId : null }}') },
          { column: 'nombre', value: expr('{{ $json.clientName }}') },
          { column: 'canal_origen', value: expr('{{ $json.channel }}') },
        ],
      },
    },
  },
  credentials: { mySql: newCredential('MySQL Demo') },
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
  credentials: { mySql: newCredential('MySQL Demo') },
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
  credentials: { mySql: newCredential('MySQL Demo') },
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
      jsonBody: {
        clienteId: expr('{{ $json.clienteId }}'),
        message: expr('{{ $json.message }}'),
        senderId: expr('{{ $json.senderId }}'),
        channel: expr('{{ $json.channel }}'),
        clientName: expr('{{ $json.clientName }}'),
      },
    },
  },
});

const finSLA = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'SLA OK - Agente responde' },
});

const postChain = guardarMensaje
  .to(verificarSLA)
  .to(slaCumplido
    .onTrue(finSLA)
    .onFalse(activarBot)
  );

export default workflow('reception-unificada', 'Recepción Unificada')
  .add(log)
  .add(webhookTrigger)
  .to(normalizeMsg)
  .to(pushRedis)
  .to(getRedis)
  .to(checkTime
    .onCase('Tiempo cumplido (Responder)', deleteRedis.to(concatMessages).to(buildSearchColumn).to(buscarCliente).to(clienteExiste
      .onTrue(prepararDatosCliente.to(postChain))
      .onFalse(crearCliente.to(prepararDatosCliente.to(postChain)))
    ))
    .onDefault(waitDebounce)
  );
// IMPORTANTE: Conectar manualmente "Ciclo de Debounce (7s)" → "Consultar Historial Temporal" en la UI de n8n
