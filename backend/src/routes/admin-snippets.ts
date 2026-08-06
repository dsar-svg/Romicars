import { Router, Response } from 'express';
import { query } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede gestionar snippets' });
    }
    const snippets = await query(
      `SELECT s.*, a.nombre as agente_nombre
       FROM respuestas_rapidas s
       LEFT JOIN agentes a ON s.agente_id = a.id
       ORDER BY s.categoria, s.atajo`
    );
    res.json(snippets);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener snippets' });
  }
});

router.get('/agentes', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    const agentes = await query('SELECT id, nombre FROM agentes WHERE activo = 1 ORDER BY nombre');
    res.json(agentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener agentes' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede crear snippets' });
    }
    const { agente_id, atajo, contenido, categoria } = req.body;
    if (!atajo?.trim() || !contenido?.trim()) {
      return res.status(400).json({ error: 'Atajo y contenido son requeridos' });
    }
    const result = await query(
      'INSERT INTO respuestas_rapidas (agente_id, atajo, contenido, categoria) VALUES (?, ?, ?, ?)',
      [agente_id || null, atajo, contenido, categoria || 'general']
    );
    const [snippet] = await query(
      `SELECT s.*, a.nombre as agente_nombre
       FROM respuestas_rapidas s
       LEFT JOIN agentes a ON s.agente_id = a.id
       WHERE s.id = ?`,
      [(result as any).insertId]
    ) as any[];
    res.status(201).json(snippet);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear snippet' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede editar snippets' });
    }
    const { agente_id, atajo, contenido, categoria } = req.body;
    const [existing] = await query('SELECT * FROM respuestas_rapidas WHERE id = ?', [req.params.id]) as any[];
    if (!existing) return res.status(404).json({ error: 'Snippet no encontrado' });

    await query(
      'UPDATE respuestas_rapidas SET agente_id = ?, atajo = ?, contenido = ?, categoria = ? WHERE id = ?',
      [agente_id !== undefined ? (agente_id || null) : existing.agente_id, atajo ?? existing.atajo, contenido ?? existing.contenido, categoria ?? existing.categoria, req.params.id]
    );
    const [snippet] = await query(
      `SELECT s.*, a.nombre as agente_nombre
       FROM respuestas_rapidas s
       LEFT JOIN agentes a ON s.agente_id = a.id
       WHERE s.id = ?`,
      [req.params.id]
    ) as any[];
    res.json(snippet);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar snippet' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede eliminar snippets' });
    }
    await query('DELETE FROM respuestas_rapidas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar snippet' });
  }
});

export default router;
