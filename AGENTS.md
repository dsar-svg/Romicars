# AGENTS.md — Romicars Flow & Chat

## Stack
- **Frontend:** React 19 + Vite 6 + TypeScript 6 + Oxlint (not ESLint)
- **Backend:** Express 5 + Socket.IO + MySQL 8 (mysql2) + JWT (bcryptjs)
- **Infra:** Docker Compose (MySQL + backend + frontend), Nginx SPA proxy

## Commands
| location | command | note |
|---|---|---|
| `/frontend` | `npm run dev` | Vite dev server on :5173, proxies `/api` + `/socket.io` to :3001 |
| `/frontend` | `npm run build` | `tsc -b` then `vite build` (order matters) |
| `/frontend` | `npm run lint` | oxlint (not eslint!) — config in `.oxlintrc.json` |
| `/frontend` | `npm run preview` | Vite preview of built output |
| `/backend` | `npm run dev` | `ts-node-dev --respawn --transpile-only src/index.ts` |
| `/backend` | `npm run build` | `tsc` outputs to `./dist` |
| `/backend` | `npm run start` | `node dist/index.js` (production) |
| `/backend` | `npm run seed` | Creates superadmin via `src/seed.ts` |
| root | `docker compose up -d` | starts MySQL, backend, frontend |
| root | `npm run seed` | Not a root script — run from `/backend` instead |

## Architecture
- **All API routes** mounted under `/api` — auth, clientes, mensajes, webhook, analytics, campanias, **agentes, profit**
- **Health** at `/health` (root, not under `/api`)
- **Auth:** JWT in `localStorage`, `Authorization: Bearer <token>`, 24h expiry
- **Real-time:** Socket.IO on same port, events: `join:chat`, `leave:chat`, `message:send`, `message:new`, `chat:updated`, `message:error`
- **DB:** `database/schema.sql` auto-executed on first MySQL container start (docker-entrypoint-initdb.d); `database/seed-demo.sql` available for demo data
- **Frontend routes:** `/login`, `/inbox/:clienteId?`, `/dashboard`, `/campanas`, `/admin/agentes` — all behind `PrivateRoute` except `/login`; `/admin/agentes` also behind `AdminRoute` (superadmin only)
- **CSS:** Custom properties for brand (red/blue/white), font families `Inter` (headings) + `DM Sans` (body), dark mode via `data-theme="dark"` on `:root`, no CSS-in-JS

## Roles & Auth
- `roles` table: `id`, `nombre` (unique), `permisos` (JSON array)
- Default roles: `superadmin` (id=1), `agente` (id=2)
- `agentes.rol_id` FK → `roles.id`
- JWT token carries `rol_id` + `rol_nombre`
- `requireAdmin` middleware checks `rol_nombre === 'superadmin'`
- Superadmin sees "Admin Agentes" in sidebar; agents don't
- Seed (`npm run seed`) creates `admin@romicars.com` / `Admin123!` with `rol_id=1`

## Conventions
- Backend is CommonJS (`"type": "commonjs"`), Frontend is ESM (`"type": "module"`)
- Backend `ts-node-dev` transpiles only (no type checking at runtime), type errors found via `tsc` only
- n8n workflow definitions are in `/n8n-workflows/` as **raw JSON** (standard n8n export format)
- `import.meta.env.VITE_*` for frontend env vars; `dotenv` for backend
- Default JWT secret in `auth.ts`: `romicars-secret-key-change-in-production`; in `docker-compose.yml`: `autoparts-flow-secret` (the compose env var overrides)
- Default DB: `autoparts_flow`, root password: `romicars2024`
- CORS allows `FRONTEND_URL` env var or falls back to `http://localhost:5173`
- Nginx uses `envsubst` template for `$BACKEND_URL` — must be set at container runtime
- No tests exist; test script is a placeholder

## Message Flow (Outbound)
- Agent reply → `POST /api/mensajes/enviar` → saved to DB + Socket.IO emit **and** forwarded to n8n (`N8N_OUTBOUND_URL`) with `{ type: "enviar_mensaje", cliente_id, contenido, canal, telefono, facebook_psid, instagram_psid }`
- Falls back to Evolution API (`EVOLUTION_API_URL`/`EVOLUTION_API_KEY`/`EVOLUTION_INSTANCE`) for WhatsApp if n8n not configured
- n8n is responsible for delivering to the correct channel (IG/FB/WA)

## Gotchas
- `oxlint` is the linter, not ESLint — don't add eslint config or deps; `.oxlintrc.json` configures react + typescript + oxc rules
- `tsc` versions differ: backend TS 7 (`^7.0.2`), frontend TS 6 (`~6.0.2`)
- Frontend Dockerfile copies `frontend/` as context — vite config is inside, not at repo root
- Backend Dockerfile copies `backend/` as context, runs `tsc`, uses `tini` entrypoint
- Backend `query()` helper returns typed rows from `mysql2/promise.execute()`
- Schema includes commented migration for PSID columns (ALTER TABLE comment, only needed for legacy DBs without those columns)
- Backend applies `helmet` via `securityMiddleware` — CSP disabled, cross-origin resource policy set to cross-origin
- Backend applies rate limiting: 100 req/min general (`apiLimiter`), 10 per 15 min login (`loginRateLimiter`)
- `/health` endpoint returns JSON with `status` and `timestamp` — useful for Docker healthchecks
- Key env vars for external integrations: `N8N_OUTBOUND_URL` (envía respuesta a n8n), `N8N_RECEIVE_URL` (webhook n8n para mensajes entrantes), `EVOLUTION_API_URL`/`EVOLUTION_API_KEY`/`EVOLUTION_INSTANCE` (fallback WhatsApp directo), `FB_VERIFY_TOKEN`/`FB_PAGE_TOKEN` (Meta webhook)
