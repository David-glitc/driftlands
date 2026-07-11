# Coolify deploy guide — Driftlands

## Option A — Docker Compose (recommended)

1. Push this repo to GitHub.
2. Coolify → **New Resource** → **Docker Compose**.
3. Connect the git repo; compose file: `docker-compose.yml`.
4. Set env vars:

| Var | Example |
|---|---|
| `CORS_ORIGIN` | `https://your-client-domain` |
| `NEXT_PUBLIC_API_URL` | `https://your-api-domain` |
| `NEXT_PUBLIC_WS_URL` | `wss://your-api-domain/ws` |
| `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` | `d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6` (Atomic) |
| `JOURNEY_SIGNING_SECRET` | long random |

5. Expose `client:3000` publicly; expose `server:4000` (or only internal + reverse proxy).
6. In Dynamic dashboard, add your Coolify client domain to allowed origins.

## Option B — Two Dockerfile apps

### Client (Next.js)

- Build pack: **Dockerfile**
- Dockerfile location: `client/Dockerfile`
- Port: `3000`
- Build args / env: `NEXT_PUBLIC_*` as above

### Server (API)

- Dockerfile location: `server/Dockerfile`
- Port: `4000`
- Persistent volume on `/data` for SQLite
- Env: `DATABASE_URL=file:/data/driftlands.db`, `CORS_ORIGIN`, `DEMO_MODE`

## Dynamic wallet

Uses Atomic’s environment id `d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6` (same as Atomic `DynamicProvider` fallback).
