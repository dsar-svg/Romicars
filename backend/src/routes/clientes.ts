import { Router, Request, Response } from 'express';
import { query } from '../database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const clientes = await query(
      `SELECT c.*,
        (SELECT contenido FROM mensajes WHERE cliente_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT fecha_envio FROM mensajes WHERE cliente_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as ultima_interaccion
       FROM clientes c
       ORDER BY ultima_interaccion DESC`
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
        (SELECT contenido FROM mensajes WHERE cliente_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
        (SELECT fecha_envio FROM mensajes WHERE cliente_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as ultima_interaccion
       FROM clientes c WHERE c.id = ?`,
      [req.params.id]
    ) as any[];
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { nombre, marca_carro, modelo_carro, anio_carro, motor_carro, estado_venta, urgencia, acepta_promos, resumen_busqueda, pidio_fotos } = req.body;
    await query(
      `UPDATE clientes SET
        nombre = ?, marca_carro = ?, modelo_carro = ?, anio_carro = ?,
        motor_carro = ?, estado_venta = ?, urgencia = ?, acepta_promos = ?,
        resumen_busqueda = ?, pidio_fotos = ?
       WHERE id = ?`,
      [nombre, marca_carro, modelo_carro, anio_carro, motor_carro, estado_venta, urgencia, acepta_promos, resumen_busqueda, pidio_fotos, req.params.id]
    );
    const [cliente] = await query('SELECT * FROM clientes WHERE id = ?', [req.params.id]) as any[];
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

export default router;
