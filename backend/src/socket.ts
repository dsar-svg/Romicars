import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { query } from './database';

let io: Server;

export function setupSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    socket.on('join:chat', (clienteId: number) => {
      if (typeof clienteId === 'number' && clienteId > 0) {
        socket.join(`chat:${clienteId}`);
      }
    });

    socket.on('leave:chat', (clienteId: number) => {
      if (typeof clienteId === 'number' && clienteId > 0) {
        socket.leave(`chat:${clienteId}`);
      }
    });

    socket.on('message:send', async (data: { cliente_id: number; contenido: string; remitente: string }) => {
      try {
        if (!data.cliente_id || !data.contenido?.trim() || !data.remitente) {
          socket.emit('message:error', { error: 'Datos incompletos' });
          return;
        }
        if (data.contenido.length > 5000) {
          socket.emit('message:error', { error: 'Mensaje demasiado largo' });
          return;
        }
        const result = await query(
          `INSERT INTO mensajes (cliente_id, remitente, contenido, tipo)
           VALUES (?, ?, ?, 'texto')`,
          [data.cliente_id, data.remitente, data.contenido]
        );

        const mensaje = await query(
          'SELECT * FROM mensajes WHERE id = ?',
          [(result as any).insertId]
        );

        const msg = (mensaje as any[])[0];

        if (data.remitente === 'agente' || data.remitente === 'bot') {
          await query('UPDATE clientes SET sla_inicio = NULL WHERE id = ?', [data.cliente_id]);
        }

        await query(
          `UPDATE clientes SET ultimo_mensaje = ?, ultima_interaccion = NOW()
           WHERE id = ?`,
          [data.contenido, data.cliente_id]
        );

        io.emit('message:new', msg);
        io.emit('chat:updated', { cliente_id: data.cliente_id });
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('message:error', { error: 'Error al enviar mensaje' });
      }
    });

    socket.on('chat:request-takeover', async (data: { cliente_id: number }) => {
      socket.to(`chat:${data.cliente_id}`).emit('chat:being-taken', {
        cliente_id: data.cliente_id,
        taken_by: socket.id,
      });
    });

    socket.on('typing:start', (data: { cliente_id: number; nombre: string }) => {
      if (typeof data.cliente_id === 'number' && data.cliente_id > 0) {
        socket.to(`chat:${data.cliente_id}`).emit('typing:started', {
          cliente_id: data.cliente_id,
          agente_id: socket.id,
          nombre: data.nombre || 'Alguien',
        });
      }
    });

    socket.on('typing:stop', (data: { cliente_id: number }) => {
      if (typeof data.cliente_id === 'number' && data.cliente_id > 0) {
        socket.to(`chat:${data.cliente_id}`).emit('typing:stopped', {
          cliente_id: data.cliente_id,
          agente_id: socket.id,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO no ha sido inicializado');
  return io;
}
