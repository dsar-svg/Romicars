import { Router, Response } from 'express';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  getProductosMasVendidos,
  getProductosMenosVendidos,
  getTotalFacturado,
  getClientesUbicacion,
  getClientesConCoordenadas,
  getProfitDashboard,
} from '../services/profit';

const router = Router();

router.get('/dashboard', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getProfitDashboard();
    res.json(data);
  } catch (error) {
    console.error('Error en /profit/dashboard:', error);
    res.status(500).json({ error: 'Error al obtener dashboard de Profit' });
  }
});

router.get('/productos/mas-vendidos', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const data = await getProductosMasVendidos(limit);
    res.json(data);
  } catch (error) {
    console.error('Error en productos mas vendidos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/productos/menos-vendidos', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const data = await getProductosMenosVendidos(limit);
    res.json(data);
  } catch (error) {
    console.error('Error en productos menos vendidos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/facturacion', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getTotalFacturado();
    res.json(data);
  } catch (error) {
    console.error('Error en facturacion:', error);
    res.status(500).json({ error: 'Error al obtener facturación' });
  }
});

router.get('/clientes/mapa', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getClientesConCoordenadas();
    res.json(data);
  } catch (error) {
    console.error('Error en clientes mapa:', error);
    res.status(500).json({ error: 'Error al obtener ubicación de clientes' });
  }
});

router.get('/clientes', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getClientesUbicacion();
    res.json(data);
  } catch (error) {
    console.error('Error en clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

export default router;
