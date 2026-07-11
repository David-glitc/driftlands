# Driftlands Knowledge Base

## Product

See `../driftlands-full-prd.md`.

## Split

| Layer | Owns |
|---|---|
| `contracts/` | Stake, revive, odds pool, journey attestation (Anchor) |
| `server/` | Journey engine, artifacts, signing, REST + WS/Ably, Prisma |
| `client/` | Next.js + R3F gameplay UI |
| `shared/` | Types, schemas, balancing, artifact catalog, level/revive math |

## Local demo

- `DEMO_MODE=true` simulates revive fees without wallet txs.
- Redis/Ably optional — memory + native WS fallbacks ship by default.
- SQLite via Prisma for local; swap `provider` to `postgresql` for prod.

## Palette

Coral `#FF6B4A`, turquoise `#2EC4B6`, sun `#FFD166`, sky `#5CDBF0`, sand `#FFF1D6`, ink `#1B1F3B`.
