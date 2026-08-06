import { Router, Request, Response } from 'express';
import { query } from '../database';
import { getIO } from '../socket';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const clientes = await query(
      `SELECT c.*,
        (SELECT contenido FROM mensajes WHERE cliente_id = c.id AND eliminado = 0 ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT remitente FROM mensajes WHERE cliente_id = c.id AND eliminado = 0 ORDER BY fecha_envio DESC LIMIT 1) as ultimo_remitente,
        (SELECT fecha_envio FROM mensajes WHERE cliente_id = c.id AND eliminado = 0 ORDER BY fecha_envio DESC LIMIT 1) as ultima_interaccion
       FROM clientes c
       WHERE c.eliminado = 0
       ORDER BY c.pinned DESC, ultima_interaccion DESC`
    );
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [cliente] = await query(
      `SELECT c.*,
        (SELECT contenido FROM mensajes WHERE cliente_id = c.id AND eliminado = 0 ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT remitente FROM mensajes WHERE cliente_id = c.id AND eliminado = 0 ORDER BY fecha_envio DESC LIMIT 1) as ultimo_remitente,
        (SELECT fecha_envio FROM mensajes WHERE cliente_id = c.id AND eliminado = 0 ORDER BY fecha_envio DESC LIMIT 1) as ultima_interaccion
       FROM clientes c WHERE c.id = ?`,
      [req.params.id]
    ) as any[];
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const allowedFields = ['nombre', 'telefono', 'marca_carro', 'modelo_carro', 'anio_carro', 'motor_carro', 'estado_venta', 'urgencia', 'acepta_promos', 'resumen_busqueda', 'pidio_fotos', 'estado_conversacion'] as const;
    const sets: string[] = [];
    const vals: any[] = [];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = ?`);
        vals.push(req.body[field]);
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Sin cambios' });
    vals.push(req.params.id);
    await query(`UPDATE clientes SET ${sets.join(', ')} WHERE id = ?`, vals);
    const [cliente] = await query('SELECT * FROM clientes WHERE id = ?', [req.params.id]) as any[];
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    getIO().emit('cliente:updated', cliente);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

router.post('/:id/transferir', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { resumen, motivo } = req.body;
    await query(
      `UPDATE clientes SET
        modo_atencion = 'transfiriendo',
        resumen_transferencia = ?
       WHERE id = ?`,
      [resumen || null, req.params.id]
    );
    const [cliente] = await query('SELECT * FROM clientes WHERE id = ?', [req.params.id]) as any[];
    if (!cliente) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    getIO().emit('chat:transferido', cliente);
    res.json({ success: true, cliente });
  } catch (error) {
    console.error('Error al transferir chat:', error);
    res.status(500).json({ error: 'Error al transferir chat' });
  }
});

router.post('/:id/takeover', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const agenteId = req.agente!.id;
    await query(
      `UPDATE clientes SET
        modo_atencion = 'agente',
        asignado_a = ?
       WHERE id = ?`,
      [agenteId, req.params.id]
    );
    const [cliente] = await query('SELECT * FROM clientes WHERE id = ?', [req.params.id]) as any[];
    if (!cliente) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    getIO().emit('chat:asignado', { cliente, agente: req.agente });
    res.json({ success: true, cliente });
  } catch (error) {
    console.error('Error al tomar chat:', error);
    res.status(500).json({ error: 'Error al tomar chat' });
  }
});

router.post('/:id/release', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `UPDATE clientes SET
        modo_atencion = 'bot',
        asignado_a = NULL,
        resumen_transferencia = NULL
       WHERE id = ?`,
      [req.params.id]
    );
    const [cliente] = await query('SELECT * FROM clientes WHERE id = ?', [req.params.id]) as any[];
    if (!cliente) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    getIO().emit('chat:liberado', cliente);
    res.json({ success: true, cliente });
  } catch (error) {
    console.error('Error al liberar chat:', error);
    res.status(500).json({ error: 'Error al liberar chat' });
  }
});

router.delete('/:id/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clienteId = Number(req.params.id);
    const existing = await query('SELECT id FROM clientes WHERE id = ?', [clienteId]) as any[];
    if (existing.length === 0) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    await query('DELETE FROM mensajes WHERE cliente_id = ?', [clienteId]);
    await query('UPDATE clientes SET ultimo_mensaje = NULL, ultima_interaccion = NULL WHERE id = ?', [clienteId]);
    getIO().to(`chat:${clienteId}`).emit('chat:deleted', { cliente_id: clienteId });
    getIO().emit('chat:updated', { cliente_id: clienteId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar chat:', error);
    res.status(500).json({ error: 'Error al eliminar chat' });
  }
});

router.put('/:id/pin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clienteId = Number(req.params.id);
    const rows = await query('SELECT pinned FROM clientes WHERE id = ?', [clienteId]) as any[];
    if (rows.length === 0) { res.status(404).json({ error: 'Cliente no encontrado' }); return; }
    const nuevoEstado = !rows[0].pinned;
    await query('UPDATE clientes SET pinned = ? WHERE id = ?', [nuevoEstado ? 1 : 0, clienteId]);
    getIO().emit('chat:pinned', { cliente_id: clienteId, pinned: nuevoEstado });
    res.json({ success: true, pinned: nuevoEstado });
  } catch (error) {
    console.error('Error al fijar chat:', error);
    res.status(500).json({ error: 'Error al fijar chat' });
  }
});

router.put('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { estado_conversacion } = req.body;
    const clienteId = req.params.id;

    const validStates = ['nuevo', 'en_progreso', 'resuelto', 'cerrado', 'en_pausa'];
    if (!validStates.includes(estado_conversacion)) {
      return res.status(400).json({ error: 'Estado de conversacion invalido' });
    }

    const [current] = await query('SELECT estado_conversacion FROM clientes WHERE id = ?', [clienteId]) as any[];
    if (!current) return res.status(404).json({ error: 'Cliente no encontrado' });

    await query(
      `UPDATE clientes SET estado_conversacion = ? WHERE id = ?`,
      [estado_conversacion, clienteId]
    );

    const [cliente] = await query('SELECT * FROM clientes WHERE id = ?', [clienteId]) as any[];
    getIO().emit('cliente:updated', cliente);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado de conversación' });
  }
});

router.get('/:id/sla', async (req: Request, res: Response) => {
  try {
    const [cliente] = await query(
      `SELECT sla_inicio, estado_conversacion,
        CASE WHEN sla_inicio IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, sla_inicio, NOW()) ELSE 0 END as minutos_transcurridos
       FROM clientes WHERE id = ?`,
      [req.params.id]
    ) as any[];
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({
      sla_inicio: cliente.sla_inicio,
      estado_conversacion: cliente.estado_conversacion,
      minutos_transcurridos: cliente.minutos_transcurridos || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener información de SLA' });
  }
});

export default router;
