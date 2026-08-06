export const DEMO_ANALYTICS = {
  total_leads: 247,
  chats_activos: 18,
  tasa_conversion: 34,
  funnel: [
    { etapa: 'Leads', valor: 247, color: '#1A365D' },
    { etapa: 'Interesados', valor: 89, color: '#3B82F6' },
    { etapa: 'Compraron', valor: 84, color: '#E53E3E' },
    { etapa: 'No Compraron', valor: 74, color: '#6C757D' },
  ],
  traffic: [
    { canal: 'WhatsApp', total: 142, color: '#25D366' },
    { canal: 'Instagram', total: 68, color: '#E4405F' },
    { canal: 'Facebook', total: 37, color: '#1877F2' },
  ],
  leads: {
    nuevos_hoy: 12,
    pendientes_respuesta: 5,
    por_urgencia: { Alta: 23, Media: 41, Baja: 25 },
    por_asignacion: { asignados: 189, sin_asignar: 58 },
    por_estado: { nuevo: 34, en_progreso: 67, resuelto: 84, cerrado: 42, en_pausa: 20 },
  },
};

export const DEMO_TENDENCIAS = {
  tendencias: Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      fecha: d.toISOString().slice(0, 10),
      leads: Math.floor(Math.random() * 12) + 3,
      ventas: Math.floor(Math.random() * 5) + 1,
    };
  }),
};

export const DEMO_RESPUESTA = {
  promedio_general_segundos: 312,
  por_canal: [
    { canal: 'whatsapp', promedio_segundos: 245, total_conversaciones: 142 },
    { canal: 'instagram', promedio_segundos: 380, total_conversaciones: 68 },
    { canal: 'facebook', promedio_segundos: 290, total_conversaciones: 37 },
  ],
  total_conversaciones: 247,
  respuestas_rapidas: 156,
  respuestas_lentas: 12,
};

export const DEMO_AGENTES = [
  { id: 1, nombre: 'Dario Medina', chats_asignados: 67, ventas_cerradas: 28, no_ventas: 15, tasa_conversion: 42, tiempo_respuesta_promedio: 180 },
  { id: 2, nombre: 'Carlos Lopez', chats_asignados: 54, ventas_cerradas: 22, no_ventas: 18, tasa_conversion: 41, tiempo_respuesta_promedio: 240 },
  { id: 3, nombre: 'Maria Garcia', chats_asignados: 48, ventas_cerradas: 19, no_ventas: 12, tasa_conversion: 40, tiempo_respuesta_promedio: 310 },
  { id: 4, nombre: 'Ana Rodriguez', chats_asignados: 32, ventas_cerradas: 11, no_ventas: 14, tasa_conversion: 34, tiempo_respuesta_promedio: 420 },
];

export const DEMO_DEMANDA = {
  busquedas_populares: [
    { termino: 'Pastillas de freno Delco', total: 34 },
    { termino: 'Filtro de aceite Mann', total: 28 },
    { termino: 'Amortiguadores Monroe', total: 22 },
    { termino: 'Alternador Bosch Chevrolet', total: 19 },
    { termino: 'Bomba de agua Mazda 3', total: 15 },
  ],
  marcas_populares: [
    { marca: 'Chevrolet', total: 67 },
    { marca: 'Toyota', total: 45 },
    { marca: 'Ford', total: 38 },
    { marca: 'Mazda', total: 31 },
    { marca: 'Hyundai', total: 24 },
  ],
  motores_populares: [
    { motor: '1.6L', total: 45 },
    { motor: '2.0L', total: 38 },
    { motor: '1.8L', total: 29 },
  ],
  busquedas_sin_venta: 34,
  total_con_busqueda: 89,
};

export const DEMO_AI_INSIGHTS = [
  {
    tipo: 'alerta',
    titulo: 'Tiempo de respuesta lento en Instagram',
    descripcion: 'El tiempo promedio de respuesta en Instagram es de 6 minutos (380 segundos), comparado con 4 minutos en WhatsApp. Los 68 leads de Instagram podrían estar perdiéndose por demora.',
    prioridad: 'alta',
    accion: 'Implementar respuestas automáticas en Instagram y capacitar al agente con menor tiempo de respuesta para cubrir este canal.',
  },
  {
    tipo: 'oportunidad',
    titulo: '41 leads interesados sin comprar',
    descripcion: 'El 17% de tus leads están en estado "Interesado" pero no concretaron la compra. Un seguimiento directo con oferta especial puede convertir al menos la mitad.',
    prioridad: 'alta',
    accion: 'Contactar a los 41 leads interesados con descuento del 10% en su próxima compra o envío gratis.',
  },
  {
    tipo: 'tendencia',
    titulo: 'Pastillas de freno Delco son lo más buscado',
    descripcion: '34 clientes buscaron pastillas de freno Delco este mes. Asegurar stock de este producto y crear campaña de remarketing para quienes no compraron.',
    prioridad: 'media',
    accion: 'Verificar stock en Profit y crear campaña de WhatsApp para los 34 clientes que buscaron este producto.',
  },
];

export const DEMO_INSIGHTS = [
  {
    tipo: 'alerta',
    titulo: '5 clientes esperando respuesta',
    descripcion: 'Hay clientes con tiempo de respuesta activo que necesitan atención urgente.',
    prioridad: 'alta',
    accion: 'Revisar la bandeja de entrada y responder a los clientes pendientes.',
  },
  {
    tipo: 'oportunidad',
    titulo: '17% de leads no compraron',
    descripcion: 'De 247 leads, 74 no concretaron compra. Esto puede indicar problemas de precio, disponibilidad o seguimiento.',
    prioridad: 'media',
    accion: 'Analizar los motivos de rechazo y mejorar la propuesta de valor.',
  },
];

export const DEMO_PROFIT = {
  productos_mas_vendidos: [
    { co_art: '001', art_des: 'Pastillas de Freno Delco D1011', total_vendido: 4520, cantidad_vendida: 89, existencias: 156 },
    { co_art: '002', art_des: 'Filtro de Aceite Mann W811/80', total_vendido: 3890, cantidad_vendida: 124, existencias: 203 },
    { co_art: '003', art_des: 'Amortiguador Monroe G7328', total_vendido: 3450, cantidad_vendida: 42, existencias: 67 },
    { co_art: '004', art_des: 'Alternador Bosch 0 124 525 027', total_vendido: 2980, cantidad_vendida: 18, existencias: 34 },
    { co_art: '005', art_des: 'Bomba de agua GMB 192-1930', total_vendido: 2340, cantidad_vendida: 31, existencias: 45 },
    { co_art: '006', art_des: 'Kit de Distribución SKF VKMC 01108', total_vendido: 2100, cantidad_vendida: 15, existencias: 28 },
    { co_art: '007', art_des: 'Balatas traseras Ferodo FDB1647', total_vendido: 1890, cantidad_vendida: 67, existencias: 112 },
    { co_art: '008', art_des: 'Bobina de encendido NGK UF333', total_vendido: 1650, cantidad_vendida: 44, existencias: 89 },
  ],
  productos_menos_vendidos: [
    { co_art: '101', art_des: 'Junta de culata Victor Reinz 71-35703-01', total_vendido: 120, cantidad_vendida: 3, existencias: 12 },
    { co_art: '102', art_des: 'Retén de cigüeñal Corteco 19024874', total_vendido: 180, cantidad_vendida: 5, existencias: 23 },
    { co_art: '103', art_des: 'Sensor de oxígeno Bosch 0 258 006 537', total_vendido: 250, cantidad_vendida: 4, existencias: 18 },
    { co_art: '104', art_des: 'Tensor de cadena SKF VKT 0018', total_vendido: 310, cantidad_vendida: 6, existencias: 15 },
    { co_art: '105', art_des: 'Válvula EGR Delphi F01C012143', total_vendido: 380, cantidad_vendida: 2, existencias: 8 },
  ],
  total_facturado: 48750,
  facturas_periodo: 127,
  clientes_ubicacion: [
    { co_cli: 'C001', cli_des: 'Juan Pérez', lat: 10.6544, lng: -71.6284, ciudad: 'Maracaibo', estado: 'Zulia' },
    { co_cli: 'C002', cli_des: 'María García', lat: 10.6397, lng: -71.6300, ciudad: 'Maracaibo', estado: 'Zulia' },
    { co_cli: 'C003', cli_des: 'Carlos López', lat: 10.4806, lng: -66.9036, ciudad: 'Caracas', estado: 'Miranda' },
    { co_cli: 'C004', cli_des: 'Ana Martínez', lat: 10.2342, lng: -67.5959, ciudad: 'Valencia', estado: 'Carabobo' },
    { co_cli: 'C005', cli_des: 'Roberto Sánchez', lat: 8.2916, lng: -62.7158, ciudad: 'Ciudad Guayana', estado: 'Bolívar' },
    { co_cli: 'C006', cli_des: 'Laura Castillo', lat: 10.6544, lng: -71.6100, ciudad: 'Maracaibo', estado: 'Zulia' },
    { co_cli: 'C007', cli_des: 'Pedro Rodríguez', lat: 10.6397, lng: -71.6200, ciudad: 'Maracaibo', estado: 'Zulia' },
    { co_cli: 'C008', cli_des: 'Carmen Díaz', lat: 9.5928, lng: -67.3725, ciudad: 'San Carlos', estado: 'Cojedes' },
    { co_cli: 'C009', cli_des: 'Luis Hernández', lat: 10.4806, lng: -66.9200, ciudad: 'Caracas', estado: 'Miranda' },
    { co_cli: 'C010', cli_des: 'Isabel Flores', lat: 10.2342, lng: -66.5000, ciudad: 'Valencia', estado: 'Carabobo' },
    { co_cli: 'C011', cli_des: 'Miguel Torres', lat: 10.6544, lng: -71.6400, ciudad: 'Maracaibo', estado: 'Zulia' },
    { co_cli: 'C012', cli_des: 'Patricia Ramírez', lat: 8.2916, lng: -62.7000, ciudad: 'Ciudad Guayana', estado: 'Bolívar' },
  ],
};
