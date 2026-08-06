import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../database';
import { getIO } from '../socket';

const BACKEND_PUBLIC_URL = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

router.get('/:clienteId', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const rows = await query(
      `SELECT * FROM mensajes WHERE cliente_id = ? AND eliminado = 0 ORDER BY fecha_envio DESC LIMIT ${limit} OFFSET ${offset}`,
      [req.params.clienteId]
    ) as any[];
    res.json(rows.reverse());
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

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT cliente_id FROM mensajes WHERE id = ?', [req.params.id]) as any[];
    if (rows.length === 0) { res.status(404).json({ error: 'Mensaje no encontrado' }); return; }
    const clienteId = rows[0].cliente_id;
    await query('DELETE FROM mensajes WHERE id = ?', [req.params.id]);
    getIO().to(`chat:${clienteId}`).emit('message:deleted', { mensaje_id: Number(req.params.id), cliente_id: clienteId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
});

router.put('/:id/pin', async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT pinned, cliente_id FROM mensajes WHERE id = ?', [req.params.id]) as any[];
    if (rows.length === 0) { res.status(404).json({ error: 'Mensaje no encontrado' }); return; }
    const nuevoEstado = !rows[0].pinned;
    await query('UPDATE mensajes SET pinned = ? WHERE id = ?', [nuevoEstado ? 1 : 0, req.params.id]);
    getIO().to(`chat:${rows[0].cliente_id}`).emit('message:pinned', { mensaje_id: Number(req.params.id), pinned: nuevoEstado, cliente_id: rows[0].cliente_id });
    res.json({ success: true, pinned: nuevoEstado });
  } catch (error) {
    res.status(500).json({ error: 'Error al fijar mensaje' });
  }
});

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) { res.status(400).json({ error: 'Archivo requerido' }); return; }
    const ext = path.extname(req.file.originalname).toLowerCase();
    let tipo: string = 'archivo';
    if (['.jpg','.jpeg','.png','.gif','.webp','.svg'].includes(ext)) tipo = 'imagen';
    else if (['.mp3','.wav','.ogg','.aac','.m4a'].includes(ext)) tipo = 'audio';
    else if (['.mp4','.webm','.mov','.avi'].includes(ext)) tipo = 'video';
    const originalName = encodeURIComponent(req.file.originalname);
    const url = BACKEND_PUBLIC_URL
      ? `${BACKEND_PUBLIC_URL}/uploads/${req.file.filename}?filename=${originalName}`
      : `/uploads/${req.file.filename}?filename=${originalName}`;
    res.json({ url, tipo });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir archivo' });
  }
});

router.post('/enviar', async (req: Request, res: Response) => {
  try {
    const { cliente_id, contenido, remitente, tipo, url_multimedia } = req.body;
    if (!cliente_id || !remitente) {
      res.status(400).json({ error: 'cliente_id y remitente requeridos' });
      return;
    }
    const msgTipo = tipo || 'texto';

    const result = await query(
      `INSERT INTO mensajes (cliente_id, remitente, contenido, tipo, url_multimedia)
       VALUES (?, ?, ?, ?, ?)`,
      [cliente_id, remitente, contenido || '', msgTipo, url_multimedia || null]
    ) as any;

    await query(
      `UPDATE clientes SET ultimo_mensaje = ?, ultima_interaccion = NOW()
       WHERE id = ?`,
      [contenido || (url_multimedia || msgTipo), cliente_id]
    );

    const mensajes = await query('SELECT * FROM mensajes WHERE id = ?', [result.insertId]) as any[];
    const msg = mensajes[0];

    if (remitente === 'agente' || remitente === 'bot') {
      await query('UPDATE clientes SET sla_inicio = NULL WHERE id = ?', [cliente_id]);
    }

    getIO().emit('message:new', msg);
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
          let mediaUrl = url_multimedia || null;
          if (mediaUrl && mediaUrl.startsWith('/') && BACKEND_PUBLIC_URL) {
            mediaUrl = `${BACKEND_PUBLIC_URL}${mediaUrl}`;
          }
          try {
            await fetch(n8nUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'enviar_mensaje',
                cliente_id,
                contenido: contenido || '',
                tipo: msgTipo,
                url_multimedia: mediaUrl,
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
            if (msgTipo === 'texto') {
              await fetch(`${EVO_URL}/message/sendText/${EVO_INSTANCE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
                body: JSON.stringify({ number: cliente.telefono, text: contenido }),
              });
            } else if (url_multimedia) {
              await fetch(`${EVO_URL}/message/sendMedia/${EVO_INSTANCE}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', apikey: EVO_KEY },
                body: JSON.stringify({
                  number: cliente.telefono,
                  media: url_multimedia,
                  mediatype: msgTipo === 'imagen' ? 'image' : msgTipo === 'audio' ? 'audio' : 'document',
                  caption: contenido || '',
                }),
              });
            }
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
