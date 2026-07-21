import { Router, Request, Response } from 'express';
import { query } from '../database';
import { getIO } from '../socket';

const router = Router();

router.get('/:clienteId', async (req: Request, res: Response) => {
  try {
    const mensajes = await query(
      'SELECT * FROM mensajes WHERE cliente_id = ? ORDER BY fecha_envio ASC',
      [req.params.clienteId]
    );
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

router.put('/:id/leer', async (req: Request, res: Response) => {
  try {
    await query('UPDATE mensajes SET leido = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar mensaje como leído' });
  }
});

router.post('/enviar', async (req: Request, res: Response) => {
  try {
    const { cliente_id, contenido, remitente, tipo } = req.body;
    if (!cliente_id || !contenido || !remitente) {
      res.status(400).json({ error: 'cliente_id, contenido y remitente requeridos' });
      return;
    }

    const result = await query(
      `INSERT INTO mensajes (cliente_id, remitente, contenido, tipo)
       VALUES (?, ?, ?, ?)`,
      [cliente_id, remitente, contenido, tipo || 'texto']
    ) as any;

    await query(
      `UPDATE clientes SET ultimo_mensaje = ?, ultima_interaccion = NOW()
       WHERE id = ?`,
      [contenido, cliente_id]
    );

    const mensajes = await query('SELECT * FROM mensajes WHERE id = ?', [result.insertId]) as any[];
    const msg = mensajes[0];

    getIO().to(`chat:${cliente_id}`).emit('message:new', msg);
    getIO().emit('chat:updated', { cliente_id });

    if (remitente === 'agente') {
      const clientes = await query(
        'SELECT telefono, canal_origen, facebook_psid, instagram_psid FROM clientes WHERE id = ?',
        [cliente_id]
      ) as any[];
      const cliente = clientes[0];

      if (cliente) {
        const n8nUrl = process.env.N8N_OUTBOUND_URL || process.env.N8N_RECEIVE_URL;
        if (n8nUrl) {
          try {
            await fetch(n8nUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'enviar_mensaje',
                cliente_id,
                contenido,
                canal: cliente.canal_origen || 'whatsapp',
                telefono: cliente.telefono || null,
                facebook_psid: cliente.facebook_psid || null,
                instagram_psid: cliente.instagram_psid || null,
                msg_id: msg.id,
              }),
            });
          } catch (n8nErr) {
            console.error('Error al enviar a n8n:', n8nErr);
          }
        }

        const EVO_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
        const EVO_KEY = process.env.EVOLUTION_API_KEY || '';
        const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'romicars';
        if (cliente.telefono && EVO_KEY) {
          try {
            await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
              body: JSON.stringify({ number: cliente.telefono, text: contenido }),
            });
          } catch (evoErr) {
            console.error('Error al enviar a Evolution API:', evoErr);
          }
        }
      }
    }

    res.json(msg);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

export default router;
