# AGENTS.md — AutoParts Flow & Chat

## Stack
- **Frontend:** React 19 + Vite 6 + TypeScript 6 + Oxlint (not ESLint)
- **Backend:** Express 5 + Socket.IO + MySQL 8 (mysql2) + JWT (bcryptjs)
- **Infra:** Docker Compose (MySQL + backend + frontend), Nginx SPA proxy

## Commands
| location | command | note |
|---|---|---|
| `/frontend` | `npm run dev` | Vite dev server on :5173, proxies `/api` + `/socket.io` to :3001 |
| `/frontend` | `npm run build` | runs `tsc -b` then `vite build` |
| `/frontend` | `npm run lint` | oxlint (not eslint!) |
| `/backend` | `npm run dev` | `ts-node-dev --respawn --transpile-only src/index.ts` |
| `/backend` | `npm run build` | `tsc` outputs to `./dist` |
| root | `docker compose up -d` | starts MySQL, backend, frontend |

## Architecture
- **All API routes** are mounted under `/api` — auth, clientes, mensajes, webhook, analytics, campanias
- **Auth:** JWT stored in `localStorage`, sent via `Authorization: Bearer <token>`, 24h expiry
- **Real-time:** Socket.IO on same port, events: `join:chat`, `leave:chat`, `message:send`, `message:new`, `chat:updated`
- **DB:** database/schema.sql is auto-executed on first MySQL container start (docker-entrypoint-initdb.d)
- **Frontend routes (react-router):** `/login`, `/inbox/:clienteId?`, `/dashboard`, `/campanas` — all behind `PrivateRoute` except `/login`
- **CSS:** CSS custom properties for brand (red/blue/white system), no CSS-in-JS

## Conventions
- Backend is CommonJS (`"type": "commonjs"`), Frontend is ESM (`"type": "module"`)
- Backend `ts-node-dev` transpiles only (no type checking at runtime), type errors found via `tsc` only
- n8n workflow definitions are in `/n8n-workflows/` (TypeScript, not raw JSON)
- `import.meta.env.VITE_*` for frontend env vars; dotenv for backend
- Default JWT secret in code: `romicars-secret-key-change-in-production` — change in production
- Default DB: `autoparts_flow`, root password: `romicars2024`
- CORS allows `FRONTEND_URL` env var or falls back to `http://localhost:5173`
- Nginx uses `envsubst` template for `$BACKEND_URL` — must be set at container runtime
- No tests exist; test script is a placeholder

## Gotchas
- `oxlint` is the linter, not ESLint — don't add eslint config or deps
- `tsc` versions differ: backend TS 7, frontend TS 6
- Frontend Dockerfile copies full `frontend/` context — vite config is inside, not at repo root
- Backend `query()` helper returns typed rows from `mysql2/promise.execute()`
- Schema includes migration comment (ALTER TABLE for PSID columns) not yet applied
