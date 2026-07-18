-- ============================================================
-- SEED DEMO DATA — Romicars Flow
-- Ejecutar despuÉs de schema.sql
-- ============================================================

-- CLIENTES
INSERT IGNORE INTO clientes (id, nombre, telefono, facebook_psid, instagram_psid, canal_origen, marca_carro, modelo_carro, anio_carro, motor_carro, estado_venta, urgencia, resumen_busqueda, pidio_fotos, acepta_promos, ultimo_mensaje, ultima_interaccion) VALUES
(1, 'Carlos Mendoza', '+584141234001', NULL, NULL, 'whatsapp', 'Toyota', 'Corolla', 2020, '1.8L 2ZR-FE', 'Interesado', 'Alta', 'Cliente busca pastillas de freno delanteras para Toyota Corolla 2020. Pregunta si hay en stock, precio y tiempo de entrega. Prefiere piezas originales.', TRUE, TRUE, 'Okay, me confirma el precio de las pastillas delanteras?', '2026-07-17 10:30:00'),
(2, 'María García', '+584141234002', NULL, 'ig_maria_garcia', 'instagram', 'Ford', 'Explorer', 2019, '3.5L V6', 'Lead', 'Media', NULL, FALSE, TRUE, 'Tienen filtros de aceite para Explorer?', '2026-07-16 15:20:00'),
(3, 'José Rivas', '+584141234003', 'psid_jose_rivas', NULL, 'facebook', 'Chevrolet', 'Spark', 2018, '1.4L', 'Interesado', 'Alta', 'Cliente busca alternador para Chevrolet Spark 2018 motor 1.4L. Pregunta por precio, disponibilidad y si hay opciones originales o reconstruidas. Le urge porque el carro estÁ sin baterÍa.', TRUE, TRUE, 'Tienes el alternador original? Cuanto vale?', '2026-07-17 09:15:00'),
(4, 'Ana Martínez', '+584141234004', NULL, NULL, 'whatsapp', 'Honda', 'Civic', 2021, '2.0L K20C2', 'Lead', 'Baja', NULL, FALSE, TRUE, 'Me puede cotizar los amortiguadores delanteros?', '2026-07-15 11:45:00'),
(5, 'Luis Torres', '+584141234005', NULL, 'ig_luis_torres', 'instagram', 'Nissan', 'Sentra', 2019, '1.8L MR18DE', 'Lead', 'Media', NULL, FALSE, TRUE, 'Buenas, tienen soporte de motor para Sentra?', '2026-07-16 08:30:00'),
(6, 'Pedro Sánchez', '+584141234006', NULL, NULL, 'whatsapp', 'Volkswagen', 'Jetta', 2021, '1.4 TSI', 'Compro', 'Alta', 'Cliente solicita radiador para Volkswagen Jetta 2021 motor 1.4 TSI. Pregunta por garantÍa y si incluye el lÍquido refrigerante. Ya pidiÓ fotos y quiere concretar la compra.', TRUE, TRUE, 'Ya le hice la transferencia, cuando me llega?', '2026-07-17 08:00:00'),
(7, 'Carolina Flores', '+584141234007', 'psid_carolina_f', NULL, 'facebook', 'Hyundai', 'Tucson', 2020, '2.0L Nu MPI', 'Lead', 'Baja', NULL, FALSE, TRUE, 'Tienen bujÍas para Tucson 2020?', '2026-07-14 16:10:00'),
(8, 'Roberto FernÁndez', '+584141234008', NULL, NULL, 'whatsapp', 'Mazda', '3', 2017, '2.0L Skyactiv', 'Interesado', 'Media', 'Cliente necesita bomba de agua para Mazda 3 2017 Skyactiv 2.0L. Pregunta si el kit incluye empaques. Quiere saber si puede pasar a retirar hoy.', TRUE, TRUE, 'El kit viene con los empaques tambiÉn?', '2026-07-17 11:00:00'),
(9, 'Laura Castillo', '+584141234009', NULL, 'ig_laura_castillo', 'instagram', 'Kia', 'Rio', 2020, '1.6L Gamma', 'Lead', 'Alta', NULL, FALSE, TRUE, 'Necesito discos de freno delanteros urgentemente', '2026-07-17 07:45:00'),
(10, 'Daniela Rojas', '+584141234010', NULL, NULL, 'whatsapp', 'Chevrolet', 'Aveo', 2015, '1.6L', 'Lead', 'Baja', NULL, FALSE, TRUE, 'Consola central para Aveo 2015 tienen?', '2026-07-13 14:30:00');

-- CAMPANIAS
INSERT IGNORE INTO campañas (id, nombre, mensaje, filtro_marca, filtro_modelo, filtro_estado_venta, destinatarios, enviados, estado, creada_por, created_at) VALUES
(1, 'Oferta Fin de Mes — Frenos', '¡Aprovecha nuestro 15%% de descuento en pastillas y discos de freno! VÁlido hasta el 31 de julio. Pide tu cotizaciÓn sin compromiso.', NULL, NULL, NULL, 10, 0, 'borrador', 1, '2026-07-17 12:00:00'),
(2, 'Recordatorio Cambio de Aceite', 'Hola {{nombre}}, tu carro {{marca}} {{modelo}} ya debe estar cerca de su prÓximo cambio de aceite. Te ofrecemos 10%% de descuento en aceite y filtro. ¡VisÍtanos!', NULL, NULL, NULL, 10, 10, 'completada', 1, '2026-07-15 09:00:00'),
(3, 'Promo Temporada — Radiadores', '🥵 ¡El calor no perdona! 20%% de descuento en radiadores y sistemas de refrigeraciÓn para todas las marcas. Incluye instalaciÓn gratuita. VÁlido hasta agotar stock.', 'Chevrolet', NULL, NULL, 3, 1, 'enviando', 1, '2026-07-17 10:00:00');

-- CAMPANIA_LOG
INSERT IGNORE INTO campania_log (id, campania_id, cliente_id, estado, enviado_en) VALUES
(1, 2, 1, 'enviado', '2026-07-15 09:01:00'),
(2, 2, 2, 'enviado', '2026-07-15 09:01:05'),
(3, 2, 3, 'enviado', '2026-07-15 09:01:10'),
(4, 2, 4, 'enviado', '2026-07-15 09:01:15'),
(5, 2, 5, 'enviado', '2026-07-15 09:01:20'),
(6, 2, 6, 'enviado', '2026-07-15 09:01:25'),
(7, 2, 7, 'enviado', '2026-07-15 09:01:30'),
(8, 2, 8, 'enviado', '2026-07-15 09:01:35'),
(9, 2, 9, 'enviado', '2026-07-15 09:01:40'),
(10, 2, 10, 'enviado', '2026-07-15 09:01:45'),
(11, 3, 3, 'enviado', '2026-07-17 10:00:00'),
(12, 3, 4, 'pendiente', NULL),
(13, 3, 7, 'pendiente', NULL);

-- MENSAJES
INSERT IGNORE INTO mensajes (id, cliente_id, remitente, contenido, tipo, leido, fecha_envio) VALUES

-- ==================== CARLOS MENDOZA ====================
-- ConversaciÓn con IA (previa al agente)
(100, 1, 'cliente', 'Buenos dÍas, tienes pastillas de freno delanteras para un Corolla?', 'texto', TRUE, '2026-07-17 10:10:00'),
(101, 1, 'bot', '¡Hola Carlos! Gracias por contactarnos. Para ayudarte mejor, ¿podrÍas indicarme el año exacto de tu Toyota Corolla?', 'texto', TRUE, '2026-07-17 10:10:15'),
(102, 1, 'cliente', 'SÍ, es un Corolla 2020', 'texto', TRUE, '2026-07-17 10:11:00'),
(103, 1, 'bot', 'Perfecto. ¿Sabes quÉ motor tiene? 1.8L o 2.0L?', 'texto', TRUE, '2026-07-17 10:11:10'),
(104, 1, 'cliente', '1.8L creo, el 2ZR-FE', 'texto', TRUE, '2026-07-17 10:12:00'),
(105, 1, 'bot', 'Gracias. ¿Buscas pastillas originales o de otra marca? ¿Necesitas solo las delanteras o tambiÉn las traseras?', 'texto', TRUE, '2026-07-17 10:12:10'),
(106, 1, 'cliente', 'Solo delanteras, originales prefiero', 'texto', TRUE, '2026-07-17 10:13:00'),
(107, 1, 'bot', 'Entendido. ¿Te parece si le paso tu consulta a un asesor para que te dÉ los precios y disponibilidad?', 'texto', TRUE, '2026-07-17 10:13:10'),
(108, 1, 'cliente', 'SÍ, por favor', 'texto', TRUE, '2026-07-17 10:14:00'),
(109, 1, 'bot', 'Gracias Carlos. Te conectamos con un asesor en segundos.', 'texto', TRUE, '2026-07-17 10:14:05'),

-- Primer mensaje del cliente (el que generÓ el resumen)
(1, 1, 'cliente', 'Buenos dÍas, tienes pastillas de freno delanteras para un Corolla 2020?', 'texto', TRUE, '2026-07-17 10:30:00'),
(2, 1, 'bot', 'Cliente busca pastillas de freno delanteras para Toyota Corolla 2020. Pregunta si hay en stock, precio y tiempo de entrega. Prefiere piezas originales.', 'texto', TRUE, '2026-07-17 10:30:05'),
(3, 1, 'agente', '¡Hola Carlos! SÍ tenemos pastillas delanteras para el Corolla 2020. Tenemos originales Toyota a  y aftermarket de calidad a . ¿CuÁles prefieres?', 'texto', TRUE, '2026-07-17 10:35:00'),
(4, 1, 'cliente', 'Okay, me confirma el precio de las pastillas delanteras?', 'texto', FALSE, '2026-07-17 10:40:00'),

-- ==================== JOSÉ RIVAS ====================
-- ConversaciÓn con IA (previa al agente)
(110, 3, 'cliente', 'Hola, vi que tienen repuestos. Necesito un alternador para un Spark', 'texto', TRUE, '2026-07-17 08:45:00'),
(111, 3, 'bot', '¡Hola JosÉ! Con gusto te ayudo. ¿De quÉ año es tu Chevrolet Spark?', 'texto', TRUE, '2026-07-17 08:45:10'),
(112, 3, 'cliente', '2018', 'texto', TRUE, '2026-07-17 08:46:00'),
(113, 3, 'bot', '¿Sabes quÉ motor tiene? 1.4L o 1.2L?', 'texto', TRUE, '2026-07-17 08:46:08'),
(114, 3, 'cliente', '1.4L', 'texto', TRUE, '2026-07-17 08:47:00'),
(115, 3, 'bot', 'Perfecto. ¿Buscas el alternador original Chevrolet o te sirve uno reconstruido de buena calidad?', 'texto', TRUE, '2026-07-17 08:47:10'),
(116, 3, 'cliente', 'Quisiera saber precio de ambos', 'texto', TRUE, '2026-07-17 08:48:00'),
(117, 3, 'bot', 'Entendido. ¿Tu carro estÁ actualmente sin baterÍa? Para priorizar la atenciÓn.', 'texto', TRUE, '2026-07-17 08:48:08'),
(118, 3, 'cliente', 'SÍ, no enciende, me urge', 'texto', TRUE, '2026-07-17 08:49:00'),
(119, 3, 'bot', 'Entiendo la urgencia. Te paso inmediatamente con un asesor para que te dÉ los precios y confirme disponibilidad.', 'texto', TRUE, '2026-07-17 08:49:05'),

(5, 3, 'cliente', 'Hola, vi que tienen repuestos. Necesito un alternador para un Spark 2018', 'texto', TRUE, '2026-07-17 09:15:00'),
(6, 3, 'bot', 'Cliente busca alternador para Chevrolet Spark 2018 motor 1.4L. Pregunta por precio, disponibilidad y si hay opciones originales o reconstruidas.', 'texto', TRUE, '2026-07-17 09:15:05'),
(7, 3, 'agente', '¡Hola JosÉ! Tenemos alternador original GM a  y uno reconstruido con garantÍa a . El original lo tenemos en stock. ¿Te sirve?', 'texto', TRUE, '2026-07-17 09:20:00'),
(8, 3, 'cliente', 'Tienes el alternador original? Cuanto vale?', 'texto', FALSE, '2026-07-17 09:25:00'),

-- ==================== PEDRO SÁNCHEZ ====================
-- ConversaciÓn con IA (previa al agente)
(120, 6, 'cliente', 'Saludos, necesito un radiador para un Jetta', 'texto', TRUE, '2026-07-17 07:30:00'),
(121, 6, 'bot', '¡Hola Pedro! Te ayudo con eso. ¿De quÉ año es tu Volkswagen Jetta?', 'texto', TRUE, '2026-07-17 07:30:08'),
(122, 6, 'cliente', '2021', 'texto', TRUE, '2026-07-17 07:31:00'),
(123, 6, 'bot', '¿El motor es 1.4 TSI o 2.0 TSI?', 'texto', TRUE, '2026-07-17 07:31:06'),
(124, 6, 'cliente', '1.4 TSI', 'texto', TRUE, '2026-07-17 07:32:00'),
(125, 6, 'bot', 'Bien. ¿Prefieres el radiador original VW o uno de otra marca? ¿Necesitas que incluya el lÍquido refrigerante?', 'texto', TRUE, '2026-07-17 07:32:10'),
(126, 6, 'cliente', 'Original, y quiero saber si tiene garantÍa', 'texto', TRUE, '2026-07-17 07:33:00'),
(127, 6, 'bot', 'Excelente. Te paso con un asesor para que te dÉ los detalles del precio, disponibilidad y garantÍa.', 'texto', TRUE, '2026-07-17 07:33:08'),

(9, 6, 'cliente', 'Saludos, necesito un radiador para Jetta 2021 1.4 TSI', 'texto', TRUE, '2026-07-17 08:00:00'),
(10, 6, 'bot', 'Cliente solicita radiador para Volkswagen Jetta 2021 motor 1.4 TSI. Pregunta por garantÍa y si incluye el lÍquido refrigerante.', 'texto', TRUE, '2026-07-17 08:00:05'),
(11, 6, 'agente', '¡Hola Pedro! Tenemos el radiador original VW a  con 1 aÑo de garantÍa. Incluye tapa, no incluye refrigerante. ¿Te interesa?', 'texto', TRUE, '2026-07-17 08:05:00'),
(12, 6, 'cliente', 'Me sirve, me puede pasar fotos?', 'texto', TRUE, '2026-07-17 08:10:00'),
(13, 6, 'agente', 'Claro, ya te envÍo las fotos por aquÍ', 'imagen', TRUE, '2026-07-17 08:12:00'),
(14, 6, 'cliente', 'Perfecto, hago la transferencia ahora', 'texto', TRUE, '2026-07-17 08:20:00'),
(15, 6, 'agente', 'Excelente, te paso los datos de pago', 'texto', TRUE, '2026-07-17 08:21:00'),
(16, 6, 'cliente', 'Ya le hice la transferencia, cuando me llega?', 'texto', FALSE, '2026-07-17 08:30:00'),

-- ==================== ROBERTO FERNÁNDEZ ====================
-- ConversaciÓn con IA (previa al agente)
(130, 8, 'cliente', 'Buenas, venden bomba de agua para Mazda 3?', 'texto', TRUE, '2026-07-17 10:30:00'),
(131, 8, 'bot', '¡Hola Roberto! SÍ tenemos. ¿De quÉ año es tu Mazda 3?', 'texto', TRUE, '2026-07-17 10:30:08'),
(132, 8, 'cliente', '2017', 'texto', TRUE, '2026-07-17 10:31:00'),
(133, 8, 'bot', '¿Sabes si es el motor 2.0L Skyactiv o el 2.5L?', 'texto', TRUE, '2026-07-17 10:31:06'),
(134, 8, 'cliente', '2.0L Skyactiv', 'texto', TRUE, '2026-07-17 10:32:00'),
(135, 8, 'bot', 'Perfecto. ¿Necesitas solo la bomba o el kit completo con empaques y junta?', 'texto', TRUE, '2026-07-17 10:32:10'),
(136, 8, 'cliente', 'El completo si se puede, ¿cuÁnto sale?', 'texto', TRUE, '2026-07-17 10:33:00'),
(137, 8, 'bot', 'Te paso con un asesor para que te dÉ el precio exacto del kit y la disponibilidad.', 'texto', TRUE, '2026-07-17 10:33:06'),

(17, 8, 'cliente', 'Buenas, venden bomba de agua para Mazda 3 2017?', 'texto', TRUE, '2026-07-17 11:00:00'),
(18, 8, 'bot', 'Cliente necesita bomba de agua para Mazda 3 2017 Skyactiv 2.0L. Pregunta si el kit incluye empaques.', 'texto', TRUE, '2026-07-17 11:00:05'),
(19, 8, 'agente', '¡Hola Roberto! SÍ tenemos la bomba de agua original Mazda a . El kit incluye bomba + empaque + junta. ¿Quieres que te la reservemos?', 'texto', TRUE, '2026-07-17 11:05:00'),
(20, 8, 'cliente', 'El kit viene con los empaques tambiÉn?', 'texto', FALSE, '2026-07-17 11:10:00'),

-- Otros clientes con mensajes simples
(21, 2, 'cliente', 'Tienen filtros de aceite para Explorer?', 'texto', TRUE, '2026-07-16 15:20:00'),
(22, 2, 'agente', '¡Hola MarÍa! SÍ, tenemos filtro de aceite Motorcraft original a . ¿CuÁntos necesitas?', 'texto', TRUE, '2026-07-16 15:25:00'),

(23, 4, 'cliente', 'Me puede cotizar los amortiguadores delanteros?', 'texto', TRUE, '2026-07-15 11:45:00'),
(24, 4, 'agente', '¡Hola Ana! Tenemos amortiguadores KYB a  cada uno o los originales Honda a . ¿CuÁles prefieres?', 'texto', TRUE, '2026-07-15 11:50:00'),

(25, 5, 'cliente', 'Buenas, tienen soporte de motor para Sentra?', 'texto', TRUE, '2026-07-16 08:30:00'),

(26, 7, 'cliente', 'Tienen bujÍas para Tucson 2020?', 'texto', TRUE, '2026-07-14 16:10:00'),
(27, 7, 'agente', '¡Hola Carolina! SÍ, tenemos bujÍas NGK Iridium a  cada una. El Tucson 2020 usa 4 bujÍas. ¿Te sirven?', 'texto', TRUE, '2026-07-14 16:15:00'),

(28, 9, 'cliente', 'Necesito discos de freno delanteros urgentemente', 'texto', TRUE, '2026-07-17 07:45:00'),
(29, 9, 'agente', '¡Hola Laura! Tenemos discos de freno delanteros para Kia Rio 2020 a  cada uno (originales Kia). ¿Necesitas también las pastillas?', 'texto', TRUE, '2026-07-17 07:50:00'),

(30, 10, 'cliente', 'Consola central para Aveo 2015 tienen?', 'texto', TRUE, '2026-07-13 14:30:00');
