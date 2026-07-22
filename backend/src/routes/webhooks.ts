import { Router, Request, Response } from 'express';
import { query } from '../database';
import { getIO } from '../socket';

const router = Router();

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'romicars_verify_2026';
const N8N_RECEIVE_URL = process.env.N8N_RECEIVE_URL || 'https://n8n.supricom.com.ve/webhook/receive-message';
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || '';

router.get('/facebook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook Facebook verificado correctamente');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Verificación fallida');
  }
});

router.post('/facebook', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (body.object !== 'page') {
      res.sendStatus(400);
      return;
    }

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const sender = event.sender?.id;
        const message = event.message?.text;
        const timestamp = event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString();

        if (!sender || !message) continue;

        let name = '';
        if (FB_PAGE_TOKEN) {
          try {
            const fbResp = await fetch(
              `https://graph.facebook.com/v22.0/${sender}?fields=name&access_token=${FB_PAGE_TOKEN}`
            );
            const fbData = await fbResp.json() as any;
            name = fbData.name || '';
          } catch (err) {
            console.error('Error al obtener nombre de Facebook:', err);
          }
        }

        let clientes = await query(
          'SELECT id FROM clientes WHERE facebook_psid = ?', [sender]
        ) as any[];
        let clienteId = clientes[0]?.id;

        if (!clienteId) {
          const result = await query(
            `INSERT INTO clientes (nombre, telefono, canal_origen, facebook_psid, ultima_interaccion)
             VALUES (?, '', 'facebook', ?, NOW())`,
            [name || `FB_${sender.slice(-6)}`, sender]
          ) as any;
          clienteId = result.insertId;
          getIO().emit('chat:updated', { cliente_id: clienteId });
        }

        const msgResult = await query(
          `INSERT INTO mensajes (cliente_id, remitente, contenido, tipo)
           VALUES (?, 'cliente', ?, 'texto')`,
          [clienteId, message]
        ) as any;

        const mensajes = await query('SELECT * FROM mensajes WHERE id = ?', [msgResult.insertId]) as any[];
        const msg = mensajes[0];

        await query(
          'UPDATE clientes SET ultimo_mensaje = ?, ultima_interaccion = NOW() WHERE id = ?',
          [message, clienteId]
        );

        getIO().to(`chat:${clienteId}`).emit('message:new', msg);
        getIO().emit('chat:updated', { cliente_id: clienteId });

        if (N8N_RECEIVE_URL) {
          fetch(N8N_RECEIVE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sender, message, channel: 'facebook', timestamp, name,
              cliente_id: clienteId,
            }),
          }).catch(() => {});
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook Facebook:', error);
    res.sendStatus(200);
  }
});

router.post('/n8n', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const tipo = body.tipo || (body.remitente === 'cliente' ? 'nuevo_mensaje' : body.tipo);
    const clienteId = body.cliente_id || body.clienteId;
    const contenido = body.contenido || body.mensaje || body.message;

    console.log('[webhook:n8n] recibido:', JSON.stringify(body));

    if (!clienteId || !contenido) {
      console.log('[webhook:n8n] falta clienteId o contenido');
      res.json({ success: false, error: 'faltan datos' });
      return;
    }

    if (tipo === 'nuevo_mensaje' || body.remitente === 'cliente') {
      const result = await query(
        `INSERT INTO mensajes (cliente_id, remitente, contenido, tipo)
         VALUES (?, ?, ?, 'texto')`,
        [clienteId, body.remitente || 'cliente', contenido]
      ) as any;

      const mensajes = await query('SELECT * FROM mensajes WHERE id = ?', [result.insertId]) as any[];
      const msg = mensajes[0];

      await query(
        'UPDATE clientes SET ultimo_mensaje = ?, ultima_interaccion = NOW() WHERE id = ?',
        [contenido, clienteId]
      );

      getIO().to(`chat:${clienteId}`).emit('message:new', msg);
      getIO().emit('message:new', msg);
      getIO().emit('chat:updated', { cliente_id: clienteId });

      console.log('[webhook:n8n] mensaje guardado y emitido:', msg.id, 'para cliente:', clienteId);
    }

    if (tipo === 'resumen_actualizado' && clienteId) {
      const clientes = await query('SELECT * FROM clientes WHERE id = ?', [clienteId]) as any[];
      if (clientes[0]) {
        getIO().emit('cliente:updated', clientes[0]);
      }
    }

    if (tipo === 'campania_log' && body.campaniaId) {
      getIO().emit('campania:updated', { campaniaId: body.campaniaId, estado: body.estado });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error en webhook n8n:', error);
    res.status(500).json({ error: 'Error al procesar webhook' });
  }
});

router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const sender = body.key?.remoteJid?.replace('@s.whatsapp.net', '') || body.from;
    const message = body.message?.conversation || body.message?.extendedTextMessage?.text || body.text || body.message;
    const pushName = body.pushName || body.key?.participant || sender;

    if (!sender || !message) {
      res.sendStatus(200);
      return;
    }

    let clientes = await query(
      'SELECT id FROM clientes WHERE telefono = ?', [sender]
    ) as any[];
    let clienteId = clientes[0]?.id;

    if (!clienteId) {
      const result = await query(
        `INSERT INTO clientes (nombre, telefono, canal_origen, ultima_interaccion)
         VALUES (?, ?, 'whatsapp', NOW())`,
        [pushName || `WA_${sender.slice(-6)}`, sender]
      ) as any;
      clienteId = result.insertId;
      getIO().emit('chat:updated', { cliente_id: clienteId });
    }

    const msgResult = await query(
      `INSERT INTO mensajes (cliente_id, remitente, contenido, tipo)
       VALUES (?, 'cliente', ?, 'texto')`,
      [clienteId, message]
    ) as any;

    const mensajes = await query('SELECT * FROM mensajes WHERE id = ?', [msgResult.insertId]) as any[];
    const msg = mensajes[0];

    await query(
      'UPDATE clientes SET ultimo_mensaje = ?, ultima_interaccion = NOW() WHERE id = ?',
      [message, clienteId]
    );

    getIO().to(`chat:${clienteId}`).emit('message:new', msg);
    getIO().emit('chat:updated', { cliente_id: clienteId });

    if (N8N_RECEIVE_URL) {
      fetch(N8N_RECEIVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender, message, channel: 'whatsapp', pushName,
          cliente_id: clienteId,
        }),
      }).catch(() => {});
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook WhatsApp:', error);
    res.sendStatus(200);
  }
});

export default router;
