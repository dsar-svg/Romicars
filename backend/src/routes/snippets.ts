import { Router, Response } from 'express';
import { query } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const agenteId = req.agente!.id;
    const snippets = await query(
      `SELECT * FROM respuestas_rapidas
       WHERE agente_id = ? OR agente_id IS NULL
       ORDER BY categoria, atajo`,
      [agenteId]
    );
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener snippets' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { atajo, contenido, categoria } = req.body;
    const agente_id = req.agente!.id;
    const result = await query(
      `INSERT INTO respuestas_rapidas (agente_id, atajo, contenido, categoria) VALUES (?, ?, ?, ?)`,
      [agente_id, atajo, contenido, categoria || 'general']
    );
    const [snippet] = await query('SELECT * FROM respuestas_rapidas WHERE id = ?', [(result as any).insertId]) as any[];
    res.status(201).json(snippet);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear snippet' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { atajo, contenido, categoria } = req.body;
    const [existing] = await query('SELECT * FROM respuestas_rapidas WHERE id = ?', [req.params.id]) as any[];
    if (!existing) return res.status(404).json({ error: 'Snippet no encontrado' });
    if (existing.agente_id !== null && existing.agente_id !== req.agente!.id) {
      return res.status(403).json({ error: 'No autorizado para modificar este snippet' });
    }

    await query(
      `UPDATE respuestas_rapidas SET atajo = ?, contenido = ?, categoria = ? WHERE id = ?`,
      [atajo, contenido, categoria, req.params.id]
    );
    const [snippet] = await query('SELECT * FROM respuestas_rapidas WHERE id = ?', [req.params.id]) as any[];
    res.json(snippet);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar snippet' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const [existing] = await query('SELECT * FROM respuestas_rapidas WHERE id = ?', [req.params.id]) as any[];
    if (!existing) return res.status(404).json({ error: 'Snippet no encontrado' });
    if (existing.agente_id !== null && existing.agente_id !== req.agente!.id && req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado para eliminar este snippet' });
    }

    await query('DELETE FROM respuestas_rapidas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar snippet' });
  }
});

export default router;
