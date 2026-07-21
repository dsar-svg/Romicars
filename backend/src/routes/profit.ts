import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getProductosMasVendidos, getProductosMenosVendidos, getTotalFacturado, getClientesConCoordenadas } from '../services/profit';

const router = Router();

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [masVendidos, menosVendidos, facturado, clientesMapa] = await Promise.all([
      getProductosMasVendidos(10),
      getProductosMenosVendidos(10),
      getTotalFacturado(),
      getClientesConCoordenadas(),
    ]);

    res.json({
      productos_mas_vendidos: masVendidos,
      productos_menos_vendidos: menosVendidos,
      total_facturado: facturado.total,
      facturas_periodo: facturado.facturas,
      clientes_ubicacion: clientesMapa,
    });
  } catch (error) {
    console.error('Error en profit:', error);
    res.status(500).json({ error: 'Error al obtener datos de Profit' });
  }
});

export default router;
