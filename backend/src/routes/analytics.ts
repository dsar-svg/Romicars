import { Router, Response } from 'express';
import { query } from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getProductosMasVendidos, getProductosMenosVendidos, getTotalFacturado, getClientesConCoordenadas } from '../services/profit';
import { generarInsights } from '../services/ai';

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

router.get('/tendencias', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const leads = await query(
      `SELECT DATE(created_at) as fecha, COUNT(*) as total
       FROM clientes
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY fecha`
    ) as any[];

    const ventas = await query(
      `SELECT DATE(created_at) as fecha, COUNT(*) as total
       FROM clientes
       WHERE estado_venta = 'Compro'
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY fecha`
    ) as any[];

    const leadsMap = new Map(leads.map((l: any) => [l.fecha, Number(l.total)]));
    const ventasMap = new Map(ventas.map((v: any) => [v.fecha, Number(v.total)]));

    const tendencias = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const fecha = d.toISOString().slice(0, 10);
      tendencias.push({
        fecha,
        leads: leadsMap.get(fecha) || 0,
        ventas: ventasMap.get(fecha) || 0,
      });
    }

    res.json({ tendencias });
  } catch (error) {
    console.error('Error en tendencias:', error);
    res.status(500).json({ error: 'Error al obtener tendencias' });
  }
});

router.get('/respuesta', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const tiempos = await query(
      `SELECT
        c.id as cliente_id,
        c.nombre,
        c.canal_origen,
        MIN(
          TIMESTAMPDIFF(SECOND, m_cliente.fecha_envio, m_agente.fecha_envio)
        ) as tiempo_primera_respuesta
       FROM clientes c
       JOIN mensajes m_cliente ON m_cliente.cliente_id = c.id
         AND m_cliente.remitente = 'cliente'
       JOIN mensajes m_agente ON m_agente.cliente_id = c.id
         AND m_agente.remitente = 'agente'
         AND m_agente.fecha_envio > m_cliente.fecha_envio
       WHERE c.eliminado = 0
       GROUP BY c.id, c.nombre, c.canal_origen`
    ) as any[];

    const porCanal: Record<string, { total: number; suma: number }> = {};
    tiempos.forEach((t: any) => {
      const canal = t.canal_origen || 'desconocido';
      if (!porCanal[canal]) porCanal[canal] = { total: 0, suma: 0 };
      porCanal[canal].total++;
      porCanal[canal].suma += Number(t.tiempo_primera_respuesta) || 0;
    });

    const promedioPorCanal = Object.entries(porCanal).map(([canal, data]) => ({
      canal,
      promedio_segundos: data.total > 0 ? Math.round(data.suma / data.total) : 0,
      total_conversaciones: data.total,
    }));

    const totalSuma = tiempos.reduce((sum: number, t: any) => sum + (Number(t.tiempo_primera_respuesta) || 0), 0);
    const promedioGeneral = tiempos.length > 0 ? Math.round(totalSuma / tiempos.length) : 0;

    const rapidas = tiempos.filter((t: any) => Number(t.tiempo_primera_respuesta) <= 300).length;
    const lentas = tiempos.filter((t: any) => Number(t.tiempo_primera_respuesta) > 3600).length;

    res.json({
      promedio_general_segundos: promedioGeneral,
      por_canal: promedioPorCanal,
      total_conversaciones: tiempos.length,
      respuestas_rapidas: rapidas,
      respuestas_lentas: lentas,
    });
  } catch (error) {
    console.error('Error en respuesta:', error);
    res.status(500).json({ error: 'Error al obtener tiempos de respuesta' });
  }
});

router.get('/agentes', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const agentes = await query(
      `SELECT
        a.id,
        a.nombre,
        COUNT(DISTINCT c.id) as chats_asignados,
        SUM(CASE WHEN c.estado_venta = 'Compro' THEN 1 ELSE 0 END) as ventas_cerradas,
        SUM(CASE WHEN c.estado_venta = 'No Compro' THEN 1 ELSE 0 END) as no_ventas,
        AVG(TIMESTAMPDIFF(HOUR, c.created_at, c.ultima_interaccion)) as tiempo_promedio_chat
       FROM agentes a
       LEFT JOIN clientes c ON c.asignado_a = a.id AND c.eliminado = 0
       WHERE a.activo = 1
       GROUP BY a.id, a.nombre
       ORDER BY ventas_cerradas DESC`
    ) as any[];

    const agentesConMetrics = await Promise.all(
      agentes.map(async (a: any) => {
        const [tiempoRespuesta] = await query(
          `SELECT AVG(
            TIMESTAMPDIFF(SECOND, m_cliente.fecha_envio, m_agente.fecha_envio)
           ) as promedio
           FROM mensajes m_cliente
           JOIN mensajes m_agente ON m_agente.cliente_id = m_cliente.cliente_id
             AND m_agente.remitente = 'agente'
             AND m_agente.fecha_envio > m_cliente.fecha_envio
           JOIN clientes c ON c.id = m_cliente.cliente_id
           WHERE c.asignado_a = ?
           AND m_cliente.remitente = 'cliente'`,
          [a.id]
        ) as any[];

        return {
          id: a.id,
          nombre: a.nombre,
          chats_asignados: Number(a.chats_asignados) || 0,
          ventas_cerradas: Number(a.ventas_cerradas) || 0,
          no_ventas: Number(a.no_ventas) || 0,
          tasa_conversion: Number(a.chats_asignados) > 0
            ? Math.round((Number(a.ventas_cerradas) / Number(a.chats_asignados)) * 100)
            : 0,
          tiempo_respuesta_promedio: Number(tiempoRespuesta?.promedio) || 0,
        };
      })
    );

    res.json({ agentes: agentesConMetrics });
  } catch (error) {
    console.error('Error en agentes:', error);
    res.status(500).json({ error: 'Error al obtener rendimiento de agentes' });
  }
});

router.get('/demanda', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const busquedas = await query(
      `SELECT resumen_busqueda, COUNT(*) as total
       FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND eliminado = 0
       GROUP BY resumen_busqueda
       ORDER BY total DESC
       LIMIT 20`
    ) as any[];

    const marcas = await query(
      `SELECT marca_carro, COUNT(*) as total
       FROM clientes
       WHERE marca_carro IS NOT NULL AND marca_carro != ''
       AND eliminado = 0
       GROUP BY marca_carro
       ORDER BY total DESC
       LIMIT 10`
    ) as any[];

    const motores = await query(
      `SELECT motor_carro, COUNT(*) as total
       FROM clientes
       WHERE motor_carro IS NOT NULL AND motor_carro != ''
       AND eliminado = 0
       GROUP BY motor_carro
       ORDER BY total DESC
       LIMIT 10`
    ) as any[];

    const sinResultado = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND estado_venta = 'No Compro'
       AND eliminado = 0`
    ) as any;

    const totalConBusqueda = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND eliminado = 0`
    ) as any;

    res.json({
      busquedas_populares: busquedas.map((b: any) => ({ termino: b.resumen_busqueda, total: Number(b.total) })),
      marcas_populares: marcas.map((m: any) => ({ marca: m.marca_carro, total: Number(m.total) })),
      motores_populares: motores.map((m: any) => ({ motor: m.motor_carro, total: Number(m.total) })),
      busquedas_sin_venta: Number(sinResultado[0]?.total) || 0,
      total_con_busqueda: Number(totalConBusqueda[0]?.total) || 0,
    });
  } catch (error) {
    console.error('Error en demanda:', error);
    res.status(500).json({ error: 'Error al obtener demanda de productos' });
  }
});

router.get('/insights', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const insights: { tipo: string; titulo: string; descripcion: string; prioridad: string; accion: string }[] = [];

    const [sinResponder] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE sla_inicio IS NOT NULL
       AND estado_conversacion NOT IN ('resuelto', 'cerrado')`
    ) as any[];
    if (Number(sinResponder.total) > 0) {
      insights.push({
        tipo: 'alerta',
        titulo: `${sinResponder.total} cliente(s) esperando respuesta`,
        descripcion: 'Hay clientes con tiempo de espera activo que necesitan atencion urgente.',
        prioridad: 'alta',
        accion: 'Revisar la bandeja de entrada y responder a los clientes pendientes.',
      });
    }

    const [noCompro] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE estado_venta = 'No Compro' AND eliminado = 0`
    ) as any[];
    const [totalLeads] = await query(
      `SELECT COUNT(*) as total FROM clientes WHERE eliminado = 0`
    ) as any[];
    const tasaNoCompro = Number(totalLeads.total) > 0
      ? Math.round((Number(noCompro.total) / Number(totalLeads.total)) * 100)
      : 0;
    if (tasaNoCompro > 50) {
      insights.push({
        tipo: 'oportunidad',
        titulo: `${tasaNoCompro}% de leads no compraron`,
        descripcion: `De ${totalLeads.total} leads, ${noCompro.total} no concretaron compra. Esto puede indicar problemas de precio, disponibilidad o seguimiento.`,
        prioridad: 'alta',
        accion: 'Analizar los motivos de rechazo y mejorar la propuesta de valor.',
      });
    }

    const [sinAsignar] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE asignado_a IS NULL AND eliminado = 0
       AND estado_conversacion IN ('nuevo', 'en_progreso')`
    ) as any[];
    if (Number(sinAsignar.total) > 3) {
      insights.push({
        tipo: 'alerta',
        titulo: `${sinAsignar.total} chats sin asignar`,
        descripcion: 'Hay conversaciones activas sin agente asignado. Los clientes pueden estar esperando.',
        prioridad: 'media',
        accion: 'Asignar agentes a los chats pendientes o activar el modo bot.',
      });
    }

    const [interesados] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE estado_venta = 'Interesado' AND eliminado = 0`
    ) as any[];
    if (Number(interesados.total) > 0) {
      insights.push({
        tipo: 'oportunidad',
        titulo: `${interesados.total} lead(s) interesado(s) sin comprar`,
        descripcion: 'Estos clientes mostraron interes pero no concretaron. Un seguimiento directo puede convertirlos.',
        prioridad: 'alta',
        accion: 'Contactar a los interesados con una oferta especial o descuento.',
      });
    }

    const busquedasPopulares = await query(
      `SELECT resumen_busqueda, COUNT(*) as total
       FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND eliminado = 0
       GROUP BY resumen_busqueda
       ORDER BY total DESC LIMIT 3`
    ) as any[];
    if (busquedasPopulares.length > 0) {
      const topBusqueda = busquedasPopulares[0];
      insights.push({
        tipo: 'tendencia',
        titulo: `Busqueda mas popular: "${topBusqueda.resumen_busqueda}"`,
        descripcion: `${topBusqueda.total} clientes buscaron este producto. Asegurate de tener stock disponible.`,
        prioridad: 'media',
        accion: 'Verificar disponibilidad y precios de este producto en Profit.',
      });
    }

    const [sinFoto] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE pidio_fotos = 0 AND eliminado = 0
       AND estado_venta IN ('Lead', 'Interesado')`
    ) as any[];
    if (Number(sinFoto.total) > 5) {
      insights.push({
        tipo: 'sugerencia',
        titulo: `${sinFoto.total} leads sin fotos del producto`,
        descripcion: 'Enviar fotos del producto puede aumentar la tasa de conversion significativamente.',
        prioridad: 'media',
        accion: 'Preparar un catalogo de fotos frecuentes para enviar rapidamente.',
      });
    }

    res.json({ insights });
  } catch (error) {
    console.error('Error en insights:', error);
    res.status(500).json({ error: 'Error al generar insights' });
  }
});

router.get('/profit', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [masVendidos, menosVendidos, clientesMapa] = await Promise.all([
      getProductosMasVendidos(10),
      getProductosMenosVendidos(10),
      getClientesConCoordenadas(),
    ]);

    const facturado = await getTotalFacturado();

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

router.get('/ai-insights', authMiddleware, async (_req: AuthRequest, res: Response) => {
  try {
    const [total] = await query('SELECT COUNT(*) as total FROM clientes WHERE eliminado = 0') as any[];
    const [conversion] = await query(
      `SELECT
        SUM(estado_venta = 'Compro') as compraron,
        SUM(estado_venta = 'Lead') as leads,
        SUM(estado_venta = 'Interesado') as interesados,
        SUM(estado_venta = 'No Compro') as no_compraron
       FROM clientes WHERE eliminado = 0`
    ) as any[];

    const [pendientes] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE sla_inicio IS NOT NULL
       AND estado_conversacion NOT IN ('resuelto', 'cerrado')`
    ) as any[];

    const tiempos = await query(
      `SELECT c.canal_origen,
        AVG(TIMESTAMPDIFF(SECOND, m_c.fecha_envio, m_a.fecha_envio)) as promedio
       FROM clientes c
       JOIN mensajes m_c ON m_c.cliente_id = c.id AND m_c.remitente = 'cliente'
       JOIN mensajes m_a ON m_a.cliente_id = c.id AND m_a.remitente = 'agente'
         AND m_a.fecha_envio > m_c.fecha_envio
       WHERE c.eliminado = 0
       GROUP BY c.canal_origen`
    ) as any[];

    const agentes = await query(
      `SELECT a.nombre,
        COUNT(DISTINCT c.id) as chats,
        SUM(CASE WHEN c.estado_venta = 'Compro' THEN 1 ELSE 0 END) as ventas,
        AVG(TIMESTAMPDIFF(HOUR, c.created_at, c.ultima_interaccion)) as tiempo_resp
       FROM agentes a
       LEFT JOIN clientes c ON c.asignado_a = a.id AND c.eliminado = 0
       WHERE a.activo = 1
       GROUP BY a.id, a.nombre`
    ) as any[];

    const busquedas = await query(
      `SELECT resumen_busqueda FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND eliminado = 0
       ORDER BY created_at DESC LIMIT 20`
    ) as any[];

    const marcas = await query(
      `SELECT marca_carro, COUNT(*) as total FROM clientes
       WHERE marca_carro IS NOT NULL AND eliminado = 0
       GROUP BY marca_carro ORDER BY total DESC LIMIT 5`
    ) as any[];

    const [canalPrincipal] = await query(
      `SELECT canal_origen, COUNT(*) as total FROM clientes
       WHERE eliminado = 0 GROUP BY canal_origen ORDER BY total DESC LIMIT 1`
    ) as any[];

    // Leads por canal con ventas
    const leadsPorCanal = await query(
      `SELECT canal_origen as canal,
        COUNT(*) as total,
        SUM(estado_venta = 'Compro') as compraron
       FROM clientes WHERE eliminado = 0
       GROUP BY canal_origen`
    ) as any[];

    // Leads por urgencia
    const leadsPorUrgencia = await query(
      `SELECT urgencia, COUNT(*) as total
       FROM clientes WHERE eliminado = 0
       GROUP BY urgencia`
    ) as any[];

    // Búsquedas sin venta
    const [busquedasSinVenta] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND estado_venta = 'No Compro' AND eliminado = 0`
    ) as any[];
    const [totalConBusqueda] = await query(
      `SELECT COUNT(*) as total FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND eliminado = 0`
    ) as any[];

    // Top búsquedas recientes
    const topBusquedasRecientes = await query(
      `SELECT resumen_busqueda FROM clientes
       WHERE resumen_busqueda IS NOT NULL AND resumen_busqueda != ''
       AND eliminado = 0
       ORDER BY created_at DESC LIMIT 10`
    ) as any[];

    // Días activos
    const [diasActivo] = await query(
      `SELECT DATEDIFF(NOW(), MIN(created_at)) as dias FROM clientes WHERE eliminado = 0`
    ) as any[];

    const totalNum = Number(total.total) || 1;
    const insights = await generarInsights({
      totalLeads: Number(total.total) || 0,
      conversion: Math.round(((Number(conversion.compraron) || 0) / totalNum) * 100),
      sinComprar: Number(conversion.no_compraron) || 0,
      interesados: Number(conversion.interesados) || 0,
      pendientes: Number(pendientes.total) || 0,
      tiemposRespuesta: tiempos.map((t: any) => ({ canal: t.canal_origen, promedio: Math.round(Number(t.promedio) || 0) })),
      agentes: agentes.map((a: any) => ({
        nombre: a.nombre,
        ventas: Number(a.ventas) || 0,
        conversion: Number(a.chats) > 0 ? Math.round((Number(a.ventas) / Number(a.chats)) * 100) : 0,
        tiempoResp: Math.round(Number(a.tiempo_resp) || 0),
      })),
      busquedasPopulares: busquedas.map((b: any) => b.resumen_busqueda),
      marcasPopulares: marcas.map((m: any) => m.marca_carro),
      canalPrincipal: canalPrincipal?.canal_origen || 'desconocido',
      leadsPorCanal: leadsPorCanal.map((c: any) => ({ canal: c.canal, total: Number(c.total), compraron: Number(c.compraron) })),
      leadsPorUrgencia: leadsPorUrgencia.map((u: any) => ({ urgencia: u.urgencia, total: Number(u.total) })),
      busquedasSinVenta: Number(busquedasSinVenta?.total) || 0,
      totalConBusqueda: Number(totalConBusqueda?.total) || 0,
      topBusquedasRecientes: topBusquedasRecientes.map((b: any) => b.resumen_busqueda),
      diasActivo: Number(diasActivo?.dias) || 30,
    });

    res.json({ insights });
  } catch (error) {
    console.error('Error en AI insights:', error);
    res.status(500).json({ error: 'Error al generar insights IA' });
  }
});

export default router;
