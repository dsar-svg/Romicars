import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generarInsights(data: {
  totalLeads: number;
  conversion: number;
  sinComprar: number;
  interesados: number;
  pendientes: number;
  tiemposRespuesta: { canal: string; promedio: number }[];
  agentes: { nombre: string; ventas: number; conversion: number; tiempoResp: number }[];
  busquedasPopulares: string[];
  marcasPopulares: string[];
  canalPrincipal: string;
 leadsPorCanal: { canal: string; total: number; compraron: number }[];
  leadsPorUrgencia: { urgencia: string; total: number }[];
  busquedasSinVenta: number;
  totalConBusqueda: number;
  topBusquedasRecientes: string[];
  diasActivo: number;
}) {
  const tasaNoCompro = data.totalLeads > 0 ? Math.round((data.sinComprar / data.totalLeads) * 100) : 0;
  const tasaConversionReal = data.totalLeads > 0 ? Math.round(((data.totalLeads - data.sinComprar - data.interesados) / data.totalLeads) * 100) : 0;

  const prompt = `Eres el estratega de negocio senior de "Romicars", una tienda de autopartes en Venezuela (Maracaibo). Analiza estos datos REALES del CRM y genera EXACTAMENTE 3 insights estratégicos accionables.

═══ DATOS REALES DEL NEGOCIO ═══

PERÍODO: Últimos ${data.diasActivo} días de operación
CANAL PRINCIPAL: ${data.canalPrincipal}

--- MÉTRICAS DE CONVERSIÓN ---
Total de leads: ${data.totalLeads}
Tasa de conversión real (leads → venta): ${data.conversion}%
Leads sin comprar: ${data.sinComprar} (${tasaNoCompro}%)
Leads interesados sin compra: ${data.interesados}
Clientes esperando respuesta SLA: ${data.pendientes}

--- DISTRIBUCIÓN POR CANAL ---
${data.leadsPorCanal.map(c => `${c.canal}: ${c.total} leads, ${c.compraron} ventas (${c.total > 0 ? Math.round((c.compraron / c.total) * 100) : 0}% conversión)`).join('\n')}

--- URGENCIA DE LEADS ---
${data.leadsPorUrgencia.map(u => `${u.urgencia}: ${u.total} leads`).join('\n')}

--- TIEMPOS DE RESPUESTA POR CANAL ---
${data.tiemposRespuesta.map(t => `${t.canal}: ${t.promedio}s promedio (${Math.round(t.promedio / 60)} min)`).join('\n')}

--- RENDIMIENTO DE AGENTES ---
${data.agentes.map(a => `${a.nombre}: ${a.ventas} ventas, ${a.conversion}% conversión, ${Math.round(a.tiempoResp / 60)} min respuesta`).join('\n')}

--- DEMANDA DE PRODUCTOS ---
Top búsquedas: ${data.busquedasPopulares.slice(0, 5).join(', ')}
Marcas más buscadas: ${data.marcasPopulares.join(', ')}
Búsquedas sin venta: ${data.busquedasSinVenta} de ${data.totalConBusqueda} (${data.totalConBusqueda > 0 ? Math.round((data.busquedasSinVenta / data.totalConBusqueda) * 100) : 0}%)
Búsquedas recientes: ${data.topBusquedasRecientes.slice(0, 5).join(', ')}

═══ REGLAS PARA GENERAR INSIGHTS ═══

Cada insight debe tener:
- Un TÍTULO CLARO y DIRECTO en negrita (ej: "Caída de conversión en Instagram", "Stock insuficiente para demanda de frenos")
- Una DESCRIPCIÓN de 2-3 oraciones con datos ESPECÍFICOS (porcentajes, cantidades, diferencias entre canales)
- Una RECOMENDACIÓN ACCIONABLE y concreta (qué hacer específicamente, no genérico)

NO ACCEPTABLE:
- "Mejorar la tasa de conversión" (demasiado genérico)
- "Aumentar las ventas" (sin acción concreta)
- "Considerar estrategias de marketing" (vago)

SÍ ACCEPTABLE:
- "El 60% de leads interesados no compraron por falta de stock inmediato. Implementar alertas de reposición para las 5 marcas más buscadas."
- "Instagram tiene 3x más leads que WhatsApp pero 50% menos ventas. Revisar el flujo de atención en Instagram."
- "El agente X tiene 40% de conversión vs 15% del promedio. Documentar sus técnicas y capacitar al resto del equipo."

Responde SOLO este JSON (sin markdown, sin código):
{
  "insights": [
    {
      "tipo": "alerta",
      "titulo": "string claro y específico",
      "descripcion": "análisis con datos concretos, porcentajes, comparaciones",
      "prioridad": "alta",
      "accion": "recomendación específica y ejecutable"
    }
  ]
}

Prioridad ALA: impacto directo en ventas o pérdida de clientes.
Prioridad MEDIA: optimización de proceso o eficiencia.
Genera EXACTAMENTE 3 insights, uno de cada tipo posible (alerta, oportunidad, tendencia).`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 1200,
    });

    const content = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return parsed.insights || [];
  } catch (error) {
    console.error('Error generando insights IA:', error);
    return [];
  }
}
