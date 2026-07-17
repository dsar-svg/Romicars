import { workflow, node, trigger, sticky, placeholder, newCredential, ifElse, languageModel, outputParser, expr } from '@n8n/workflow-sdk';

const log = sticky('## Flujo: Bot de Contingencia + Resumen IA\n\n1. Recibe datos del cliente desde Workflow 1\n2. IA genera respuesta personalizada para el cliente\n3. IA extrae resumen estructurado (qué busca, urgencia, fotos)\n4. Guarda mensaje del bot en BD (remitente=bot)\n5. Actualiza resumen en ficha del cliente\n6. Envía respuesta vía Evolution API', []);

const webhookTrigger = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook Bot',
    parameters: {
      httpMethod: 'POST',
      path: 'bot-contingencia',
      options: {},
    },
  },
  output: [{
    body: {
      clienteId: 1,
      message: 'Hola, necesito un repuesto para mi carro',
      senderId: '584141234567',
      channel: 'whatsapp',
      clientName: 'Juan Pérez',
    },
  }],
});

const normalizeInput = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Normalizar Input Bot',
    parameters: {
      mode: 'manual',
      includeOtherFields: false,
      assignments: {
        assignments: [
          { id: 'cid', name: 'clienteId', value: expr('{{ $json.body?.clienteId ?? $json.clienteId }}'), type: 'number' },
          { id: 'msg', name: 'incomingMessage', value: expr('{{ $json.body?.message ?? $json.message }}'), type: 'string' },
          { id: 'sid', name: 'senderId', value: expr('{{ $json.body?.senderId ?? $json.senderId }}'), type: 'string' },
          { id: 'chn', name: 'channel', value: expr('{{ $json.body?.channel ?? $json.channel ?? "whatsapp" }}'), type: 'string' },
          { id: 'cn', name: 'clientName', value: expr('{{ $json.body?.clientName ?? $json.clientName ?? "" }}'), type: 'string' },
        ],
      },
    },
  },
  output: [{ clienteId: 1, incomingMessage: 'Hola, necesito un repuesto', senderId: '584141234567', channel: 'whatsapp', clientName: 'Juan Pérez' }],
});

const openAiModel = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'OpenAI Chat Model',
    parameters: {},
    credentials: { openAiApi: newCredential('OpenAI') },
  },
});

const structuredParser = outputParser({
  type: '@n8n/n8n-nodes-langchain.outputParserStructured',
  version: 1.3,
  config: {
    name: 'Structured Output Parser',
    parameters: {
      schemaType: 'fromJson',
      jsonSchemaExample: JSON.stringify({
        respuesta_cliente: 'Hola Juan, claro podemos ayudarte con ese repuesto. ¿Podrías indicarme la marca y modelo de tu carro?',
        que_busca: 'Repuesto no especificado',
        urgencia: 'Media',
        pidio_fotos: false,
        es_despedida: false,
      }),
    },
  },
});

const aiAgent = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Agente IA Repuestos',
    parameters: {
      promptType: 'define',
      text: expr(`Eres un asesor de atención al cliente de ROMICARS, una tienda de repuestos automotrices.

Mensaje del cliente: {{ $json.incomingMessage }}
Nombre: {{ $json.clientName }}

Tu trabajo es:
1. Responde al cliente de manera cordial y profesional preguntando por: marca, modelo, año y motor del vehículo si no los mencionó.
2. Clasifica la urgencia del mensaje (Alta si menciona "urgente", "varado", "para hoy", "emergencia" - Media si es consulta normal - Baja si solo saluda)
3. Detecta si el cliente pide fotos del repuesto (pidio_fotos = true/false)
4. Extrae qué repuesto está buscando (que_busca)

REGLA IMPORTANTE: Si el cliente se despide o la conversación termina, marca es_despedida = true.`),
      hasOutputParser: true,
    },
    subnodes: { model: openAiModel, outputParser: structuredParser },
  },
  output: [{
    output: {
      respuesta_cliente: 'Hola Juan, claro podemos ayudarte...',
      que_busca: 'Repuesto',
      urgencia: 'Media',
      pidio_fotos: false,
      es_despedida: false,
    },
  }],
});

const esDespedida = ifElse({
  version: 2.3,
  config: {
    name: 'Es despedida?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [{
          leftValue: expr('{{ $json.output.es_despedida }}'),
          operator: { type: 'boolean', operation: 'equals', singleValue: true },
          rightValue: 'true',
        }],
        combinator: 'and',
      },
    },
  },
});

const guardarMensajeBot = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Guardar Mensaje Bot',
    parameters: {
      operation: 'insert',
      table: { __rl: true, mode: 'list', value: 'mensajes' },
      dataMode: 'defineBelow',
      valuesToSend: {
        values: [
          { column: 'cliente_id', value: expr('{{ $json.clienteId }}') },
          { column: 'remitente', value: 'bot' },
          { column: 'contenido', value: expr('{{ $json.output.respuesta_cliente }}') },
          { column: 'tipo', value: 'texto' },
        ],
      },
    },
  },
  credentials: { mySql: newCredential('MySQL AutoParts') },
  output: [{ id: 1 }],
});

const actualizarResumen = node({
  type: 'n8n-nodes-base.mySql',
  version: 2.5,
  config: {
    name: 'Actualizar Resumen Cliente',
    parameters: {
      operation: 'executeQuery',
      query: `UPDATE clientes SET resumen_busqueda = $1, urgencia = $2, pidio_fotos = $3,
              ultimo_mensaje = $4, ultima_interaccion = NOW()
              WHERE id = $5`,
      options: {
        queryReplacement: expr('{{ $json.output.que_busca }},{{ $json.output.urgencia }},{{ $json.output.pidio_fotos }},{{ $json.output.respuesta_cliente }},{{ $json.clienteId }}'),
      },
    },
  },
  credentials: { mySql: newCredential('MySQL AutoParts') },
  output: [{ updated: true }],
});

const enviarRespuesta = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Enviar vía Evolution API',
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
      jsonBody: expr('{ "number": "{{ $json.senderId }}", "text": "{{ $json.output.respuesta_cliente }}" }'),
    },
  },
  credentials: { httpHeaderAuth: newCredential('Evolution API Header') },
  output: [{ success: true }],
});

const finConversacion = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Conversación finalizada' },
  output: [{}],
});

export default workflow('bot-contingencia', 'Bot de Contingencia + Resumen IA')
  .add(log)
  .add(webhookTrigger)
  .to(normalizeInput)
  .to(aiAgent)
  .to(guardarMensajeBot)
  .to(actualizarResumen)
  .to(esDespedida
    .onTrue(finConversacion)
    .onFalse(enviarRespuesta)
  );
