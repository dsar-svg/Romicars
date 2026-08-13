# Dashboard — Romicars Flow

Panel de inteligencia de negocio para la tienda de autopartes. Proporciona una vista completa del rendimiento de ventas, agentes, productos y clientes en tiempo real.

---

## Arquitectura de Datos

El Dashboard consume **8 endpoints** del backend (`/api/analytics/*`) y fallback a datos demo cuando la API retorna vacío o cero:

| Endpoint | Datos | Uso |
|---|---|---|
| `GET /analytics` | KPIs, funnel, tráfico por canal, métricas de leads | Tarjetas KPI principales |
| `GET /analytics/tendencias` | Leads y ventas diarias (30 días) | Gráfico de tendencias |
| `GET /analytics/respuesta` | Tiempo promedio de respuesta por canal | Métricas de respuesta |
| `GET /analytics/agentes` | Rendimiento individual por agente | Ranking de agentes |
| `GET /analytics/demanda` | Búsquedas populares, marcas, productos sin venta | Demanda de productos |
| `GET /analytics/insights` | Insights basados en reglas (alertas, oportunidades) | Fallback de insights |
| `GET /analytics/ai-insights` | Insights generados por IA (GPT-4o-mini) | Insights estratégicos |
| `GET /analytics/profit` | Productos más/menos vendidos, facturado, ubicación de clientes | Productos y mapa |

---

## Secciones del Dashboard

### 1. Header
- Título "Dashboard" con subtítulo "Inteligencia de negocio para tu tienda de autopartes"
- Badge verde "Tiempo real" con indicador pulsante

### 2. Insights Estratégicos (IA)
- **Fuente:** OpenAI GPT-4o-mini vía endpoint `/analytics/ai-insights`
- **Layout:** Grid de 3 columnas con tarjetas horizontales
- Cada insight contiene:
  - Número ordinal (01, 02, 03)
  - Badge de prioridad (alta/media/baja) con color
  - Título en negrita
  - Descripción detallada con datos específicos
  - Acción recomendada con icono Zap
- **Hover:** Elevación translateY(-4px) con sombra
- **Loading:** 3 skeleton cards con spinner
- **Fallback:** Si la IA no responde, muestra insights basados en reglas del endpoint `/analytics/insights`
- **Requiere:** Variable `OPENAI_API_KEY` en el `.env` del backend

### 3. KPIs Principales
- **Grid:** 4 columnas
- Tarjetas con:
  - **Total Leads** — Icono Users, gradiente azul
  - **Conversión (%)** — Icono TrendingUp, gradiente verde
  - **Chats Activos** — Icono MessageCircle, gradiente ámbar
  - **Facturado (30d)** — Icono DollarSign, gradiente rojo, formato USD + cantidad de facturas
- **Hover:** Elevación + borde colorido + sombra del color del KPI

### 4. Métricas de Leads (Mini Cards)
- **Grid:** 5 columnas
- Métricas:
  - **Nuevos Hoy** — UserPlus, azul
  - **Pendientes** — Clock, ámbar
  - **Urgencia Alta** — AlertTriangle, rojo
  - **Sin Asignar** — Headphones, violeta
  - **Resueltos** — CheckCircle, verde

### 5. Gráfico de Tendencias
- **Tipo:** LineChart (Recharts)
- **Datos:** Leads y ventas diarias de los últimos 30 días
- **Colores:** Línea leads = azul (#60a5fa), línea ventas = verde (#34d399)
- **Grid:** Líneas punteadas sutiles
- **Tooltip:** Formato personalizado con fondo glass

### 6. Tiempo de Respuesta
- **Display central:** Tiempo promedio general en grande (gradiente ámbar)
- **Cards comparativas:**
  - Respuestas rápidas (< 5 min) — verde
  - Respuestas lentas (> 1 hora) — rojo
- **Desglose por canal:** Lista con promedio por cada canal de comunicación

### 7. Conversión por Canal
- **Tipo:** BarChart (Recharts)
- **Datos:** Leads agrupados por canal (WhatsApp, Facebook, Instagram, etc.)
- **Colores:** Cada barra con color propio definido en el backend

### 8. Embudo de Ventas
- **Layout:** Barras horizontales con porcentajes
- **Etapas:** Definidas en el backend (nuevos → contactados → interesados → etc.)
- **Animación:** Transición de ancho con cubic-bezier

### 9. Rendimiento por Agente
- **Layout:** Lista vertical con avatar, nombre, estadísticas y badge de conversión
- **Datos por agente:**
  - Chats asignados
  - Ventas cerradas
  - Tiempo de respuesta promedio
  - Tasa de conversión (%)
- **Badge de conversión:** Verde (>20%), Ámbar (>10%), Rojo (≤10%)
- **Avatar:** Inicial del nombre con gradiente HSL único

### 10. Demanda de Productos
- **Secciones:**
  - "Lo que buscan" — Top 4 términos de búsqueda más populares
  - "Marcas" — Tags con marcas más buscadas
  - **Alerta:** Cantidad de búsquedas que no resultaron en venta

### 11. Productos Profit
- **Tabs:** Top (más vendidos) / Bajo (menos vendidos)
- **Datos de Profit API:**
  - Nombre del producto
  - Cantidad vendida
  - Total facturado (USD)
- **Top 6 productos** con ranking visual

### 12. Mapa de Ubicación de Clientes
- **Componente:** `VenezuelaMap`
- **Datos:** Coordenadas lat/lng de clientes de Profit API
- **Features:**
  - Outline real de Venezuela con 78 coordenadas GeoJSON
  - Fronteras internas entre estados (líneas punteadas)
  - Marcadores de clientes con triple círculo
  - Tooltips con nombre del cliente y ciudad
  - Gradiente de fondo y sombra

---

## Diseño Visual

### Paleta de Colores
| Variable | Dark Mode | Light Mode |
|---|---|---|
| Fondo página | `linear-gradient(135deg, #0d1a2e, #142440)` | `linear-gradient(135deg, #f5f7fa, #e8edf5)` |
| Fondo card | `rgba(26, 54, 93, 0.45)` | `rgba(255, 255, 255, 0.85)` |
| Texto primario | `#eaf1ff` | `#0d1c2e` |
| Texto secundario | `#94a3b8` | `#43474e` |
| Borde card | `rgba(59, 130, 246, 0.12)` | `rgba(26, 54, 93, 0.08)` |

### Tipografía
- **Headings:** Hanken Grotesk (peso 700-800)
- **Body:** Inter (peso 400-600)
- **Números grandes:** Hanken Grotesk, letterSpacing `-0.03em`

### Efectos
- **Glassmorphism:** `backdrop-filter: blur(16px)` en todas las cards
- **Hover:** `translateY(-4px)` con sombra dinámica
- **Transiciones:** `cubic-bezier(0.4, 0, 0.2, 1)` — 300ms
- **Skeleton loading:** Cards vacías con animación de carga

---

## Datos Demo

Cuando la API no tiene datos (producción nueva o sin actividad), el Dashboard usa datos demo de `frontend/src/data/demo.ts`:

| Demo | Contenido |
|---|---|
| `DEMO_ANALYTICS` | 247 leads, 34% conversión, funnel, tráfico |
| `DEMO_TENDENCIAS` | 30 días de tendencias con leads y ventas |
| `DEMO_RESPUESTA` | Tiempo promedio 27min, desglose por canal |
| `DEMO_AGENTES` | 4 agentes con métricas de rendimiento |
| `DEMO_DEMANDA` | Búsquedas populares, marcas, sin ventas |
| `DEMO_AI_INSIGHTS` | 3 insights estratégicos de ejemplo |
| `DEMO_INSIGHTS` | 4 insights basados en reglas |
| `DEMO_PROFIT` | Productos más/menos vendidos, clientes con ubicación |

---

## Endpoints del Backend

Ubicados en `backend/src/route/analytics.ts`:

```
GET /api/analytics              → KPIs, funnel, tráfico, leads
GET /api/analytics/tendencias   → Tendencias 30 días
GET /api/analytics/respuesta    → Tiempo de respuesta
GET /api/analytics/agentes      → Rendimiento por agente
GET /api/analytics/demanda      → Demanda de productos
GET /api/analytics/insights     → Insights basados en reglas
GET /api/analytics/ai-insights  → Insights con IA (GPT-4o-mini)
GET /api/analytics/profit       → Datos de Profit API
```

---

## Requisitos

- **API Key de OpenAI** (`OPENAI_API_KEY`) para insights de IA
- **Profit API** configurada (`PROFIT_API_URL`, `PROFIT_API_USER`, `PROFIT_API_PASSWORD`)
- **Base de datos** con datos de clientes, mensajes y conversaciones
- **Recharts** para gráficos (librería de React)
