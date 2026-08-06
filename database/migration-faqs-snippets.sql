-- ============================================================
-- Migración: FAQs + Respuestas Rápidas
-- Base de datos: autoparts_flow (demoparts)
-- ============================================================

-- 1. Tabla de Preguntas Frecuentes
CREATE TABLE IF NOT EXISTS faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria VARCHAR(50) NULL DEFAULT NULL,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Tabla de Respuestas Rápidas (ya existe, pero por si acaso)
CREATE TABLE IF NOT EXISTS respuestas_rapidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agente_id INT NULL DEFAULT NULL,
  atajo VARCHAR(50) NOT NULL,
  contenido TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agente_id) REFERENCES agentes(id) ON DELETE SET NULL
);

-- Datos de ejemplo: FAQs
INSERT INTO faqs (categoria, pregunta, respuesta) VALUES
('Envíos', '¿Hacen envíos a todo el país?', 'Sí, realizamos envíos a todo Venezuela. El tiempo de entrega varía según la ubicación, generalmente entre 2 y 5 días hábiles.'),
('Envíos', '¿Cuánto cuesta el envío?', 'El costo del envío depende del peso y tamaño del producto. Puedes cotizar directamente en nuestro chat.'),
('Pagos', '¿Qué métodos de pago aceptan?', 'Aceptamos transferencias bancarias, Pago Móvil, Zelle y efectivo contra entrega en Maracaibo.'),
('Pagos', '¿Puedo pagar en cuotas?', 'Sí, para compras mayores a $100 ofrecemos planes de pago de hasta 3 cuotas sin interés.'),
('Productos', '¿Tienen catálogo disponible?', 'Sí, puedes solicitar nuestro catálogo completo por este chat o visitar nuestra página de Instagram @romicars.'),
('Productos', '¿Ofrecen garantía?', 'Todos nuestros productos tienen garantía de 30 días contra defectos de fabricación.'),
('General', '¿Cuál es su horario de atención?', 'Atendemos de lunes a sábado de 8:00 AM a 6:00 PM. Los domingos atendemos de 9:00 AM a 2:00 PM.'),
('General', '¿Dónde están ubicados?', 'Estamos ubicados en Maracaibo, Zulia. La dirección exacta te la proporcionamos al confirmar tu compra.');

-- Datos de ejemplo: Respuestas Rápidas
INSERT INTO respuestas_rapidas (agente_id, atajo, contenido, categoria) VALUES
(NULL, '/saludo', '¡Hola! Bienvenido a Romicars. ¿En qué puedo ayudarte hoy? 😊', 'general'),
(NULL, '/precio', 'Para darte un precio exacto, ¿podrías indicarme la marca, modelo y año de tu vehículo?', 'general'),
(NULL, '/despedida', '¡Fue un gusto atenderte! Si necesitas algo más, no dudes en escribirnos. ¡Que tengas un excelente día! 👋', 'general'),
(NULL, '/envio', 'Realizamos envíos a todo Venezuela. El tiempo de entrega es de 2 a 5 días hábiles según tu ubicación.', 'envios'),
(NULL, '/garantia', 'Todos nuestros productos cuentan con 30 días de garantía contra defectos de fabricación.', 'general'),
(NULL, '/catalogo', 'Puedes solicitar nuestro catálogo completo aquí mismo o visitar Instagram @romicars para ver disponibilidad.', 'general');
