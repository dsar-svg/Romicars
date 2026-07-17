import { Router, Request, Response } from 'express';
import { query } from '../database';

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

export default router;
