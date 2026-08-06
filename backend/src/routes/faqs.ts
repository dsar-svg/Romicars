import { Router, Response } from 'express';
import { query } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const faqs = await query('SELECT * FROM faqs ORDER BY categoria, id');
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener FAQs' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede crear FAQs' });
    }
    const { categoria, pregunta, respuesta } = req.body;
    if (!pregunta?.trim() || !respuesta?.trim()) {
      return res.status(400).json({ error: 'Pregunta y respuesta son requeridas' });
    }
    const result = await query(
      'INSERT INTO faqs (categoria, pregunta, respuesta) VALUES (?, ?, ?)',
      [categoria || 'General', pregunta, respuesta]
    );
    const [faq] = await query('SELECT * FROM faqs WHERE id = ?', [(result as any).insertId]) as any[];
    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear FAQ' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede editar FAQs' });
    }
    const { categoria, pregunta, respuesta, activo } = req.body;
    const [existing] = await query('SELECT * FROM faqs WHERE id = ?', [req.params.id]) as any[];
    if (!existing) return res.status(404).json({ error: 'FAQ no encontrada' });

    await query(
      'UPDATE faqs SET categoria = ?, pregunta = ?, respuesta = ?, activo = ? WHERE id = ?',
      [categoria ?? existing.categoria, pregunta ?? existing.pregunta, respuesta ?? existing.respuesta, activo ?? existing.activo, req.params.id]
    );
    const [faq] = await query('SELECT * FROM faqs WHERE id = ?', [req.params.id]) as any[];
    res.json(faq);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar FAQ' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.agente!.rol_nombre !== 'superadmin') {
      return res.status(403).json({ error: 'Solo superadmin puede eliminar FAQs' });
    }
    await query('DELETE FROM faqs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar FAQ' });
  }
});

export default router;
