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
-- Carlos Mendoza (wa, pastillas freno)
(1, 1, 'cliente', 'Buenos dÍas, tienes pastillas de freno delanteras para un Corolla 2020?', 'texto', TRUE, '2026-07-17 10:30:00'),
(2, 1, 'bot', 'Cliente busca pastillas de freno delanteras para Toyota Corolla 2020. Pregunta si hay en stock, precio y tiempo de entrega. Prefiere piezas originales.', 'texto', TRUE, '2026-07-17 10:30:05'),
(3, 1, 'agente', '¡Hola Carlos! SÍ tenemos pastillas delanteras para el Corolla 2020. Tenemos originales Toyota a  y aftermarket de calidad a . ¿CuÁles prefieres?', 'texto', TRUE, '2026-07-17 10:35:00'),
(4, 1, 'cliente', 'Okay, me confirma el precio de las pastillas delanteras?', 'texto', FALSE, '2026-07-17 10:40:00'),

-- JosÉ Rivas (fb, alternador)
(5, 3, 'cliente', 'Hola, vi que tienen repuestos. Necesito un alternador para un Spark 2018', 'texto', TRUE, '2026-07-17 09:15:00'),
(6, 3, 'bot', 'Cliente busca alternador para Chevrolet Spark 2018 motor 1.4L. Pregunta por precio, disponibilidad y si hay opciones originales o reconstruidas.', 'texto', TRUE, '2026-07-17 09:15:05'),
(7, 3, 'agente', '¡Hola JosÉ! Tenemos alternador original GM a  y uno reconstruido con garantÍa a . El original lo tenemos en stock. ¿Te sirve?', 'texto', TRUE, '2026-07-17 09:20:00'),
(8, 3, 'cliente', 'Tienes el alternador original? Cuanto vale?', 'texto', FALSE, '2026-07-17 09:25:00'),

-- Pedro SÁnchez (wa, radiador)
(9, 6, 'cliente', 'Saludos, necesito un radiador para Jetta 2021 1.4 TSI', 'texto', TRUE, '2026-07-17 08:00:00'),
(10, 6, 'bot', 'Cliente solicita radiador para Volkswagen Jetta 2021 motor 1.4 TSI. Pregunta por garantÍa y si incluye el lÍquido refrigerante.', 'texto', TRUE, '2026-07-17 08:00:05'),
(11, 6, 'agente', '¡Hola Pedro! Tenemos el radiador original VW a  con 1 aÑo de garantÍa. Incluye tapa, no incluye refrigerante. ¿Te interesa?', 'texto', TRUE, '2026-07-17 08:05:00'),
(12, 6, 'cliente', 'Me sirve, me puede pasar fotos?', 'texto', TRUE, '2026-07-17 08:10:00'),
(13, 6, 'agente', 'Claro, ya te envÍo las fotos por aquÍ', 'imagen', TRUE, '2026-07-17 08:12:00'),
(14, 6, 'cliente', 'Perfecto, hago la transferencia ahora', 'texto', TRUE, '2026-07-17 08:20:00'),
(15, 6, 'agente', 'Excelente, te paso los datos de pago', 'texto', TRUE, '2026-07-17 08:21:00'),
(16, 6, 'cliente', 'Ya le hice la transferencia, cuando me llega?', 'texto', FALSE, '2026-07-17 08:30:00'),

-- Roberto FernÁndez (wa, bomba de agua)
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
