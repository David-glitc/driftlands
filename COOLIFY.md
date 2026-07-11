# Coolify — Driftlands (ChessOnChain instance)

## Instance (from ChessOnChain / hitmeup)

| | |
|---|---|
| API | `https://coolify.chessonchain.online/api/v1` |
| UI | `https://coolify.chessonchain.online` |
| VPS IP | `109.205.181.119` |
| Server UUID | `goyjivzepwvgk2egci5nms3i` |
| Personal project UUID | `qak4ll4915b0ri9gj8a57ztu` (hitmeup) |
| ChessOnChain project UUID | `qrwo38kzgng040uts5192dgq` |

Token file (Linux VPS / agent box): `~/.config/chessonchain/coolify.env`  
Or: `export COOLIFY_TOKEN=...`

Auth: `Authorization: Bearer $COOLIFY_TOKEN`

## Useful endpoints (verified in ChessOnChain scripts)

- `GET /applications`, `GET /services`, `GET /projects`, `GET /servers`
- `POST /services` — Docker Compose (`docker_compose_raw` base64)
- `POST /applications/dockerimage` — pull-only GHCR image
- `POST|PATCH /applications/{uuid}/envs` — `{ key, value }`
- `GET /applications/{uuid}/start` · `/restart`
- Deploy webhook: `GET /api/v1/deploy?uuid={uuid}`

## Deploy Driftlands

```bash
# 1. Token
mkdir -p ~/.config/chessonchain
# put COOLIFY_TOKEN=... into ~/.config/chessonchain/coolify.env

# 2. DNS (Cloudflare chessonchain.online)
#    A  driftlands      → 109.205.181.119 (proxied)
#    A  api.driftlands  → 109.205.181.119 (proxied)

# 3. Create/start compose service
node scripts/deploy-coolify.mjs
node scripts/deploy-coolify.mjs --list
```

Suggested URLs:
- `https://driftlands.chessonchain.online`
- `https://api.driftlands.chessonchain.online`

Env baked by the script into compose: Dynamic env `d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6`, CORS + `NEXT_PUBLIC_*` pointing at those hosts.

## Source of truth

- ChessOnChain: `InCryptoEncrypted/chessonchain` → `scripts/sync-coolify-env.mjs`, `docs/DEPLOY-CI-COOLIFY.md`
- hitmeup: `David-glitc/hitmeup` → `scripts/deploy-coolify.mjs`
