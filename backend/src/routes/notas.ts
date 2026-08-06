import { Router, Response } from 'express';
import { query } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:clienteId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notas = await query(
      `SELECT n.*, a.nombre as agente_nombre
       FROM notas_internas n
       JOIN agentes a ON n.agente_id = a.id
       WHERE n.cliente_id = ?
       ORDER BY n.created_at DESC`,
      [req.params.clienteId]
    );
    res.json(notas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notas' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { cliente_id, contenido } = req.body;
    const agente_id = req.agente!.id;
    const result = await query(
      `INSERT INTO notas_internas (cliente_id, agente_id, contenido) VALUES (?, ?, ?)`,
      [cliente_id, agente_id, contenido]
    );
    const [nota] = await query(
      `SELECT n.*, a.nombre as agente_nombre
       FROM notas_internas n
       JOIN agentes a ON n.agente_id = a.id
       WHERE n.id = ?`,
      [(result as any).insertId]
    ) as any[];
    res.status(201).json(nota);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear nota' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [nota] = await query('SELECT * FROM notas_internas WHERE id = ?', [req.params.id]) as any[];
    if (!nota) return res.status(404).json({ error: 'Nota no encontrada' });

    if (nota.agente_id !== req.agente!.id && req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado para eliminar esta nota' });
    }

    await query('DELETE FROM notas_internas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
});

export default router;
