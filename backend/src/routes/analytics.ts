import { Router, Response } from 'express';
import { query } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getProductosMasVendidos, getProductosMenosVendidos, getTotalFacturado, getClientesConCoordenadas } from '../services/profit';

const router = Router();

router.get('/', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [total] = await query('SELECT COUNT(*) as total FROM clientes') as any[];
    const [conversion] = await query(
      `SELECT
        COUNT(*) as total,
        SUM(estado_venta = 'Compro') as compraron,
        SUM(estado_venta = 'Lead') as leads,
        SUM(estado_venta = 'Interesado') as interesados,
        SUM(estado_venta = 'No Compro') as no_compraron
       FROM clientes`
    ) as any[];

    const [activos] = await query(
      `SELECT COUNT(*) as activos FROM clientes
       WHERE ultima_interaccion >= NOW() - INTERVAL 24 HOUR`
    ) as any[];

    const canales = await query(
      `SELECT canal_origen, COUNT(*) as total
       FROM clientes GROUP BY canal_origen`
    ) as any[];

    const funnel = [
      { etapa: 'Leads', valor: Number(conversion.leads) || 0, color: '#012980' },
      { etapa: 'Interesados', valor: Number(conversion.interesados) || 0, color: '#1976D2' },
      { etapa: 'Compraron', valor: Number(conversion.compraron) || 0, color: '#BD060A' },
      { etapa: 'No Compraron', valor: Number(conversion.no_compraron) || 0, color: '#6C757D' },
    ];

    const traffic = canales.reduce((acc: any, c: any) => {
      acc[c.canal_origen] = c.total;
      return acc;
    }, { whatsapp: 0, instagram: 0, facebook: 0 });

    const [nuevosHoy] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE DATE(created_at) = CURDATE()`
    ) as any[];

    const [pendientes] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE sla_inicio IS NOT NULL
       AND estado_conversacion NOT IN ('resuelto', 'cerrado')`
    ) as any[];

    const [porUrgencia] = await query(
      `SELECT urgencia, COUNT(*) as total FROM clientes
       WHERE eliminado = 0 GROUP BY urgencia`
    ) as any[];

    const urgenciaMap: Record<string, number> = { Alta: 0, Media: 0, Baja: 0 };
    (porUrgencia as any[]).forEach((r: any) => {
      if (urgenciaMap[r.urgencia] !== undefined) urgenciaMap[r.urgencia] = Number(r.total);
    });

    const [porAsignacion] = await query(
      `SELECT
        SUM(asignado_a IS NOT NULL) as asignados,
        SUM(asignado_a IS NULL) as sin_asignar
       FROM clientes WHERE eliminado = 0`
    ) as any[];

    const [porEstado] = await query(
      `SELECT estado_conversacion, COUNT(*) as total FROM clientes
       WHERE eliminado = 0 GROUP BY estado_conversacion`
    ) as any[];

    const estadoMap: Record<string, number> = { nuevo: 0, en_progreso: 0, resuelto: 0, cerrado: 0, en_pausa: 0 };
    (porEstado as any[]).forEach((r: any) => {
      if (estadoMap[r.estado_conversacion] !== undefined) estadoMap[r.estado_conversacion] = Number(r.total);
    });

    res.json({
      total_leads: Number(total.total) || 0,
      chats_activos: Number(activos.activos) || 0,
      tasa_conversion: Number(total.total) > 0
        ? Math.round((Number(conversion.compraron) / Number(total.total)) * 100)
        : 0,
      funnel,
      traffic: [
        { canal: 'WhatsApp', total: traffic.whatsapp, color: '#BD060A' },
        { canal: 'Instagram', total: traffic.instagram, color: '#012980' },
        { canal: 'Facebook', total: traffic.facebook, color: '#1976D2' },
      ],
      leads: {
        nuevos_hoy: Number(nuevosHoy.total) || 0,
        pendientes_respuesta: Number(pendientes.total) || 0,
        por_urgencia: urgenciaMap,
        por_asignacion: {
          asignados: Number(porAsignacion.asignados) || 0,
          sin_asignar: Number(porAsignacion.sin_asignar) || 0,
        },
        por_estado: estadoMap,
      },
    });
  } catch (error) {
    console.error('Error en analytics:', error);
    res.status(500).json({ error: 'Error al obtener analytics' });
  }
});

router.get('/profit', authMiddleware, async (_req: AuthRequest, res: Response) => {
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
    console.error('Error en analytics profit:', error);
    res.status(500).json({ error: 'Error al obtener datos de Profit' });
  }
});

export default router;
