# AGENTS.md — Romicars Flow & Chat

Idioma: español. Todo el código y mensajes del sistema están en español.

## Stack
- **Frontend:** React 19 + Vite 6 + TypeScript ~6.0.2 + Oxlint (no ESLint)
- **Backend:** Express 5 + Socket.IO + MySQL 8 (mysql2) + JWT (bcryptjs)
- **Infra:** Docker Compose (MySQL + backend + frontend), Nginx SPA proxy con `envsubst`

## Comandos
| ubicación | comando | nota |
|---|---|---|
| `/frontend` | `npm run dev` | Vite :5173, proxy `/api` y `/socket.io` → :3001 |
| `/frontend` | `npm run build` | `tsc -b` (project references) luego `vite build` — ese orden |
| `/frontend` | `npm run lint` | oxlint — config en `.oxlintrc.json` |
| `/backend` | `npm run dev` | `ts-node-dev --respawn --transpile-only src/index.ts` |
| `/backend` | `npm run build` | `tsc` → `./dist` |
| `/backend` | `npm run seed` | Crea superadmin `admin@romicars.com` / `Admin123!` |
| root | `docker compose up -d` | Inicia MySQL + backend + frontend |

## Arquitectura
- **API routes** montadas bajo `/api`: `auth`, `clientes`, `mensajes`, `webhook`, `analytics`, `campanias`, `agentes`, `profit`
- **Health** en `/health` (raíz, no bajo `/api`)
- **Auth:** JWT en `localStorage`, header `Authorization: Bearer <token>`, expira 24h
- **Socket.IO** en el mismo puerto Express; eventos core: `join:chat`, `leave:chat`, `message:send`, `message:new`, `chat:updated`, `message:error`; eventos adicionales: `chat:request-takeover`, `chat:being-taken`, `cliente:updated`, `chat:transferido`, `chat:asignado`, `chat:liberado`, `chat:deleted`, `chat:pinned`, `message:deleted`, `message:pinned`
- **DB:** `database/schema.sql` se ejecuta automáticamente al primer inicio del contenedor MySQL; `database/seed-demo.sql` disponible
- **Frontend routes:** `/login`, `/inbox/:clienteId?`, `/dashboard`, `/campanas`, `/admin/agentes` — todo tras `PrivateRoute` excepto `/login`; `/admin/agentes` también requiere `AdminRoute` (rol `superadmin`)

## Roles
- `roles` tabla: `id`, `nombre` (único), `permisos` (JSON array)
- Roles por defecto: `superadmin` (id=1), `agente` (id=2)
- JWT incluye `rol_id` + `rol_nombre`; `requireAdmin` chequea `rol_nombre === 'superadmin'`
- Seed crea `admin@romicars.com` / `Admin123!` con rol superadmin

## Convenciones
- Backend CommonJS (`"type": "commonjs"`), Frontend ESM (`"type": "module"`)
- Backend `ts-node-dev` solo transpila (sin typecheck en runtime); errores de tipos solo con `tsc`
- `query()` helper (`database.ts:18`) retorna rows tipados de `mysql2/promise.execute()`
- `import.meta.env.VITE_*` para vars de entorno del frontend; `dotenv` para backend
- Default JWT secret en `auth.ts`: `romicars-secret-key-change-in-production`; en docker-compose: `autoparts-flow-secret` (override)
- CORS permite `FRONTEND_URL` env var o fallback a `http://localhost:5173`
- Nginx usa `envsubst`: `$BACKEND_URL` debe estar definida en runtime del contenedor
- No hay tests; `npm test` es placeholder

## CSS
- Variables CSS personalizadas (`--primary`, `--secondary`, etc.) — rojo/azul/blanco
- Headings: `Hanken Grotesk`; body: `Inter` (NO DM Sans como decía una versión anterior)
- Dark mode via `data-theme="dark"` en `:root`
- Sin CSS-in-JS

## Gotchas
- `oxlint` es el linter, **no ESLint** — no agregar config ni dependencias de ESLint
- `tsc` versions distintas: backend TS 7 (`^7.0.2`), frontend TS 6 (`~6.0.2`)
- Frontend build: `tsc -b` (project references en `tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`)
- Docker build: cada Dockerfile copia su propio subdirectorio como contexto (`frontend/` o `backend/`)
- Las rutas `GET /api/clientes` **no tienen `authMiddleware`** — acceso público
- Las rutas `GET /api/campanias` y `POST /api/campanias` **tampoco** tienen authMiddleware
- `POST /api/mensajes/enviar`: intenta enviar a n8n **y también** a Evolution API (no son mutuamente excluyentes)
- Webhooks entrantes: `GET/POST /api/webhook/facebook`, `POST /api/webhook/whatsapp`, `POST /api/webhook/n8n`
- Header `Cross-Origin-Resource-Policy: cross-origin` (explícitamente abierto, no same-origin)
- `requireHttps` chequea `x-forwarded-proto` (para reverse proxy); en dev local simplemente no hace redirect
- **`login_audit` no está en schema.sql** — la tabla es referenciada en `auth.ts` para brute-force protection pero no se crea automáticamente. Si se necesita, hay que agregarla manualmente.
- Rate limiting: 100 req/min global (`apiLimiter`), sin rate limiter específico de login (solo el `login_audit` de fuerza bruta)
- En `clientes` PUT, todos los campos se envían siempre (no hay merge parcial del lado del frontend)
- n8n workflows están en `/n8n-workflows/` como JSON crudo + archivos `.ts` para algunos
- Profit API: integración externa con variables `PROFIT_API_URL`, `PROFIT_API_USER`, `PROFIT_API_PASSWORD`, etc. — el servicio `services/profit.ts` hace fetch a esa API
- En `docker-compose.yml` el backend expone `:3001`, el frontend expone `:80`

## Flujo de mensajes salientes
1. Agente responde → `POST /api/mensajes/enviar`
2. Se guarda en DB + Socket.IO emit a la sala `chat:{clienteId}`
3. Se reenvía a n8n (`N8N_OUTBOUND_URL` o `N8N_RECEIVE_URL`) con `{ type: "enviar_mensaje", ... }`
4. Si el cliente tiene teléfono y `EVOLUTION_API_KEY` está configurada, también se envía por Evolution API
5. n8n es el responsable principal de entregar al canal correcto (IG/FB/WA)
