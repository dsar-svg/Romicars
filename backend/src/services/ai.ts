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
}) {
  const prompt = `Eres un consultor de ventas experto para una tienda de autopartes en Venezuela. Analiza estos datos y dame 4-6 insights accionables en formato JSON.

DATOS ACTUALES:
- Total de leads: ${data.totalLeads}
- Tasa de conversion: ${data.conversion}%
- Leads sin comprar: ${data.sinComprar}
- Leads interesados sin compra: ${data.interesados}
- Clientes esperando respuesta: ${data.pendientes}
- Canal principal: ${data.canalPrincipal}
- Tiempos de respuesta: ${JSON.stringify(data.tiemposRespuesta)}
- Agentes: ${JSON.stringify(data.agentes)}
- Busquedas populares: ${data.busquedasPopulares.join(', ')}
- Marcas populares: ${data.marcasPopulares.join(', ')}

RESPUESTA (JSON estricto, sin markdown):
{
  "insights": [
    {
      "tipo": "alerta|oportunidad|tendencia|sugerencia",
      "titulo": "string corto",
      "descripcion": "analisis detallado en 2-3 oraciones",
      "prioridad": "alta|media|baja",
      "accion": "que hacer concretamente"
    }
  ]
}

REGLAS:
- Insights especificos a estos datos, no genericos
- Enfocate en oportunidades perdidas y como mejorarlas
- Incluye metricas concretas en las descripciones
- Las acciones deben ser concretas y ejecutables
- Responde SOLO el JSON, sin texto adicional`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    return parsed.insights || [];
  } catch (error) {
    console.error('Error generando insights IA:', error);
    return [];
  }
}
