# Roadmap — Romicars Flow & Chat

## Estado actual

- [x] Estructura del proyecto (frontend + backend + database)
- [x] Esquema MySQL (clientes, mensajes, agentes, campañas)
- [x] Backend base (Express + Socket.IO + MySQL)
- [x] Frontend base (React + Vite + TypeScript)
- [x] Identidad visual (Rojo/Azul/Blanco)
- [x] Logo y favicon en frontend/public/
- [x] Primer commit y push a GitHub (rama `Dario1`)
- [x] Dockerfile backend (Node.js multi-stage)
- [x] Dockerfile frontend (Vite + Nginx)
- [x] docker-compose.yml (MySQL + backend + frontend)
- [x] Nginx config para SPA con proxy al backend

---

## Módulos pendientes

### 1. Inbox Multiagente (completar)

- [ ] **Filtros de la barra lateral:** "Mis Chats", "Sin Asignar", "Atendidos por Bot", "Urgentes" con persistencia en URL
- [ ] **Badges de origen:** Icono de Instagram, Facebook o WhatsApp por chat
- [ ] **Nivel de urgencia:** Indicador visual rojo/amarillo/verde por chat
- [ ] **Mensajes del bot:** Estilo diferenciado (fondo gris claro con borde punteado)
- [ ] **Resumen de IA:** Tarjeta superior al abrir un chat mostrando: qué busca, urgencia, si pidió fotos
- [ ] **Notificaciones en tiempo real:** Sonido/alerta al recibir nuevo mensaje
- [ ] **Asignación de chats a agentes**

### 2. Panel Lateral Derecho (Ficha del Cliente)

- [ ] Formulario editable: nombre, teléfono, canal de origen
- [ ] Sección vehículo: marca, modelo, año, motor
- [ ] Estado de venta: dropdown con Lead / Interesado / Compró / No Compró
- [ ] Checkbox "Acepta Promociones" sincronizado con BD
- [ ] Historial de interacciones del cliente

### 3. Dashboard de Analítica

- [ ] KPIs reales desde la BD: total leads, tasa de conversión, chats activos, tiempo de respuesta promedio
- [ ] Gráfico de embudo de ventas (Funnel)
- [ ] Gráfico de tráfico por origen (WhatsApp vs Instagram vs Facebook)
- [ ] Filtro por fechas
- [ ] Librería de gráficos (Chart.js o Recharts)

### 4. Campañas de Remarketing

- [ ] Segmentación: filtrar por marca + modelo + estado de venta + acepta promociones
- [ ] Vista previa de destinatarios antes de enviar
- [ ] Redacción de mensaje con variables ({nombre}, {modelo})
- [ ] Botón "Enviar Campaña" → envía lista a n8n
- [ ] Historial de campañas enviadas con resultados

### 5. Autenticación de Agentes

- [ ] Login con JWT
- [ ] Protección de rutas en frontend
- [ ] Roles (admin, agente)
- [ ] Sesión persistente

---

## Workflows de n8n

### 6. Flujo 1 — Recepción y SLA de 15 min

- [ ] Webhook de Evolution API / Messenger / Instagram
- [ ] Guardar mensaje en BD
- [ ] Temporizador de 15 min (Wait node)
- [ ] Si no responde agente → activar bot con OpenAI
- [ ] Mensajes del bot guardados con remitente = 'bot'

### 7. Flujo 2 — Resumen de Traspaso con IA

- [ ] Analizar primeros mensajes con LLM
- [ ] Extraer: repuesto buscado, modelo, si pide fotos
- [ ] Clasificar urgencia por palabras clave ("varado", "urgente", "para hoy")
- [ ] Guardar resumen en la ficha del cliente

### 8. Flujo 3 — Campañas por Goteo (Anti-Baneo)

- [ ] Frontend envía IDs de clientes + mensaje a n8n
- [ ] Loop sobre contactos
- [ ] Personalización con variables (nombre, modelo)
- [ ] Spintax (variar saludos aleatoriamente)
- [ ] Wait aleatorio 45-120s entre envíos
- [ ] Enviar por Evolution API

### 9. Flujo 4 — Gestión de Opt-Out

- [ ] Detectar palabra "Salir" o "Baja"
- [ ] UPDATE en clientes: acepta_promos = FALSE
- [ ] Mensaje automático de confirmación

---

## Conexiones externas

### 10. Evolution API (WhatsApp)

- [ ] Configurar instancia de Evolution API
- [ ] Endpoints: enviar texto, imagen, archivo
- [ ] Webhook de recepción de mensajes
- [ ] Vincular dispositivo (QR)

### 11. Instagram DM / Facebook Messenger

- [ ] Configurar Meta Business Suite / API Graph
- [ ] Webhooks de recepción de mensajes
- [ ] Unificar en el mismo inbox del frontend

---

## Despliegue con Docker / EasyPanel

La aplicación está lista para desplegarse con Docker Compose:

```bash
docker compose up -d
```

Esto levanta:
1. **MySQL 8.0** — puerto `3306`, volumen persistente, schema auto-ejecutado
2. **Backend** — Node.js 24, puerto `3001`
3. **Frontend** — Nginx, puerto `80`, proxy `/api/` y `/socket.io/` al backend

En **EasyPanel** puedes crear 3 servicios:
1. **App** desde GitHub (rama `Dario1`) con ruta `/backend`, buildpack Node.js, puerto `3001`
2. **App** desde GitHub (rama `Dario1`) con ruta `/frontend`, buildpack Dockerfile, puerto `80`
3. **MySQL** con base de datos `autoparts_flow`

---

## Mejoras futuras

- [ ] Panel de administración de agentes
- [ ] Historial completo de conversaciones (búsqueda)
- [ ] Exportación de reportes (CSV/PDF)
- [ ] Modo oscuro
- [ ] Notificaciones push al agente
- [ ] Chat en vivo desde la web de la tienda (widget)
