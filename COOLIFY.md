# Coolify — Driftlands

Repo: https://github.com/David-glitc/driftlands

## Deploy (Docker Compose) — recommended

1. Coolify → **+ New** → **Docker Compose**
2. Connect GitHub repo `David-glitc/driftlands` (branch `main`)
3. Compose file: `docker-compose.yml`
4. Add domains:
   - **client** service → `driftlands.YOURDOMAIN` (public)
   - **server** service → `api.driftlands.YOURDOMAIN` (public)
5. Environment variables (Coolify → Environment):

```env
DEMO_MODE=true
CORS_ORIGIN=https://driftlands.YOURDOMAIN
NEXT_PUBLIC_API_URL=https://api.driftlands.YOURDOMAIN
NEXT_PUBLIC_WS_URL=wss://api.driftlands.YOURDOMAIN/ws
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6
JOURNEY_SIGNING_SECRET=<long-random-string>
```

6. Deploy. First build takes a few minutes (Next standalone + Prisma).
7. Dynamic dashboard → allow origin `https://driftlands.YOURDOMAIN`

## Alternative — two Dockerfile apps

| App | Dockerfile | Port | Notes |
|---|---|---|---|
| Web | `client/Dockerfile` | 3000 | Set `NEXT_PUBLIC_*` as **build args** |
| API | `server/Dockerfile` | 4000 | Mount volume `/data` for SQLite |

## Local preview

http://localhost:3000 · API http://localhost:4000/api/health
