import { query } from '../database';
import { getIO } from '../socket';

let lastSeenId = 0;
let interval: ReturnType<typeof setInterval> | null = null;

export function startMessageWatcher(intervalMs = 3000) {
  query('SELECT MAX(id) as maxId FROM mensajes').then((rows: any) => {
    lastSeenId = rows[0]?.maxId || 0;
  }).catch(() => {});

  interval = setInterval(async () => {
    try {
      const mensajes = await query(
        'SELECT * FROM mensajes WHERE id > ? ORDER BY id ASC',
        [lastSeenId]
      ) as any[];

      for (const msg of mensajes) {
        if (msg.id > lastSeenId) lastSeenId = msg.id;

        if (msg.remitente === 'cliente' || msg.remitente === 'bot') {
          await query(
            'UPDATE clientes SET ultimo_mensaje = ?, ultima_interaccion = NOW() WHERE id = ?',
            [msg.contenido, msg.cliente_id]
          );
        }

        getIO().to(`chat:${msg.cliente_id}`).emit('message:new', msg);
        getIO().emit('chat:updated', { cliente_id: msg.cliente_id });
      }
    } catch (err) {
      console.error('Error en messageWatcher:', err);
    }
  }, intervalMs);
}

export function stopMessageWatcher() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
