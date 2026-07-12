# Coolify — Driftlands

## Instance

| | |
|---|---|
| VPS IP | `109.205.181.119` |
| Server UUID | `goyjivzepwvgk2egci5nms3i` |
| Driftlands project UUID | `qrwo38kzgng040uts5192dgq` |
| Driftlands service UUID | `pjs273bfq41mp9zcq2e714ki` |

Token file (Linux VPS / agent box): `~/.config/driftlands/coolify.env`  
Or: `export COOLIFY_TOKEN=...`

Auth: `Authorization: Bearer $COOLIFY_TOKEN`

## Useful endpoints

- `GET /applications`, `GET /services`, `GET /projects`, `GET /servers`
- `POST /services` — Docker Compose (`docker_compose_raw` base64)
- `POST /applications/dockerimage` — pull-only GHCR image
- `POST|PATCH /applications/{uuid}/envs` — `{ key, value }`
- `GET /applications/{uuid}/start` · `/restart`
- Deploy webhook: `GET /api/v1/deploy?uuid={uuid}`

## Deploy Driftlands

```bash
# 1. Token
mkdir -p ~/.config/driftlands
# put COOLIFY_TOKEN=... into ~/.config/driftlands/coolify.env

# 2. DNS (Cloudflare kierkegaard.space) — single-level names only
#    A  driftlands      → 109.205.181.119 (proxied)
#    A  driftlands-api  → 109.205.181.119 (proxied)
#    Do NOT use api.driftlands — Cloudflare free Universal SSL is *.zone only

# 3. Build images on the Coolify VPS, then create/start compose service
#    docker build -f server/Dockerfile -t driftlands-server:latest .
#    docker build -f client/Dockerfile -t driftlands-client:latest \
#      --build-arg NEXT_PUBLIC_API_URL=https://driftlands-api.kierkegaard.space \
#      --build-arg NEXT_PUBLIC_WS_URL=wss://driftlands-api.kierkegaard.space/ws \
#      --build-arg NEXT_PUBLIC_DEMO_MODE=true \
#      --build-arg NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6 .
node scripts/deploy-coolify.mjs
node scripts/deploy-coolify.mjs --list
```

Live URLs:
- `https://driftlands.kierkegaard.space`
- `https://driftlands-api.kierkegaard.space`

Env: Dynamic `d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6`, CORS + `NEXT_PUBLIC_*` on those hosts.

## Alternate deploy targets (Phase 4)

Coolify on this VPS is the primary production path. Optional mirrors:

### Vercel (client only)
- Root: `client/` with monorepo install (`pnpm install` at repo root in install command).
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`.
- Point API at Fly/Coolify server; do not run Prisma on Vercel.

### Fly.io (server)
- `server/Dockerfile` as app image; set `DATABASE_URL`, `CORS_ORIGIN`, `JOURNEY_SIGNING_SECRET`, `DEMO_MODE`.
- Attach volume for SQLite or switch Prisma to Postgres.

## Source of truth

- Driftlands: `David-glitc/driftlands` → `scripts/deploy-coolify.mjs`
