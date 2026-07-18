import { Router, Request, Response } from 'express';
import { query } from '../database';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
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

    const [respuesta] = await query(
      `SELECT COALESCE(AVG(diff), 0) as promedio FROM (
         SELECT TIMESTAMPDIFF(SECOND, MIN(fecha_envio), MAX(fecha_envio)) as diff
         FROM mensajes
         WHERE remitente IN ('cliente', 'agente')
         GROUP BY cliente_id, DATE(fecha_envio)
       ) t`
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

    res.json({
      total_leads: Number(total.total) || 0,
      chats_activos: Number(activos.activos) || 0,
      tasa_conversion: Number(total.total) > 0
        ? Math.round((Number(conversion.compraron) / Number(total.total)) * 100)
        : 0,
      respuesta_promedio: Math.round(Number(respuesta.promedio) / 60) || 0,
      funnel,
      traffic: [
        { canal: 'WhatsApp', total: traffic.whatsapp, color: '#BD060A' },
        { canal: 'Instagram', total: traffic.instagram, color: '#012980' },
        { canal: 'Facebook', total: traffic.facebook, color: '#1976D2' },
      ],
    });
  } catch (error) {
    console.error('Error en analytics:', error);
    res.status(500).json({ error: 'Error al obtener analytics' });
  }
});

export default router;
