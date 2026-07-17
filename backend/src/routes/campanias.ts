import { Router, Request, Response } from 'express';
import { query } from '../database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const campanias = await query(
      `SELECT c.*, a.nombre as creador_nombre,
        (SELECT COUNT(*) FROM campania_log WHERE campania_id = c.id) as total_enviados
       FROM campañas c
       LEFT JOIN agentes a ON c.creada_por = a.id
       ORDER BY c.created_at DESC`
    );
    res.json(campanias);
  } catch (error) {
    console.error('Error al obtener campañas:', error);
    res.status(500).json({ error: 'Error al obtener campañas' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { nombre, mensaje, destinatarios, creada_por } = req.body;
    if (!nombre || !mensaje) {
      res.status(400).json({ error: 'Nombre y mensaje requeridos' });
      return;
    }
    const result = await query(
      `INSERT INTO campañas (nombre, mensaje, destinatarios, creada_por)
       VALUES (?, ?, ?, ?)`,
      [nombre, mensaje, destinatarios || 0, creada_por || null]
    ) as any;
    const [campania] = await query('SELECT * FROM campañas WHERE id = ?', [result.insertId]) as any[];
    res.json(campania);
  } catch (error) {
    console.error('Error al crear campaña:', error);
    res.status(500).json({ error: 'Error al crear campaña' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { nombre, mensaje, estado } = req.body;
    await query(
      'UPDATE campañas SET nombre = COALESCE(?, nombre), mensaje = COALESCE(?, mensaje), estado = COALESCE(?, estado) WHERE id = ?',
      [nombre, mensaje, estado, req.params.id]
    );
    const [campania] = await query('SELECT * FROM campañas WHERE id = ?', [req.params.id]) as any[];
    res.json(campania);
  } catch (error) {
    console.error('Error al actualizar campaña:', error);
    res.status(500).json({ error: 'Error al actualizar campaña' });
  }
});

router.get('/:id/log', async (req: Request, res: Response) => {
  try {
    const log = await query(
      `SELECT cl.*, c.nombre as cliente_nombre, c.telefono
       FROM campania_log cl
       JOIN clientes c ON cl.cliente_id = c.id
       WHERE cl.campania_id = ?
       ORDER BY cl.enviado_en DESC`,
      [req.params.id]
    );
    res.json(log);
  } catch (error) {
    console.error('Error al obtener log:', error);
    res.status(500).json({ error: 'Error al obtener log' });
  }
});

router.get('/preview', async (req: Request, res: Response) => {
  try {
    const { marca, modelo, estado_venta } = req.query;
    let sql = 'SELECT id, nombre, telefono, modelo_carro FROM clientes WHERE acepta_promos = TRUE';
    const params: any[] = [];

    if (marca) { sql += ' AND marca_carro = ?'; params.push(marca); }
    if (modelo) { sql += ' AND modelo_carro = ?'; params.push(modelo); }
    if (estado_venta) { sql += ' AND estado_venta = ?'; params.push(estado_venta); }

    const clientes = await query(sql, params);
    res.json(clientes);
  } catch (error) {
    console.error('Error al previsualizar:', error);
    res.status(500).json({ error: 'Error al previsualizar' });
  }
});

export default router;
