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
      const EVO_URL = process.env.EVOLUTION_API_URL || 'http://evolution-api:8080';
      const EVO_KEY = process.env.EVOLUTION_API_KEY || '';
      const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE || 'romicars';

      const clientes = await query('SELECT telefono FROM clientes WHERE id = ?', [cliente_id]) as any[];
      if (clientes[0]?.telefono && EVO_KEY) {
        try {
          await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
            body: JSON.stringify({ number: clientes[0].telefono, text: contenido }),
          });
        } catch (evoErr) {
          console.error('Error al enviar a Evolution API:', evoErr);
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
