# DEVELOPMENT

## 2026-07-11 — Phase 0–3 bootstrap

- Created Turborepo monorepo at `C:\home\david\driftlands` with `shared/`, `server/`, `client/`, `contracts/`.
- Shared: Level Score, revive fees, artifact catalog (4 categories, 5 ranks), journey generator, bright palette constants, Vitest coverage.
- Server: journey engine, REST `/api`, Prisma SQLite, memory Redis fallback, Ably-optional WS hub, HMAC journey attestation.
- Client: Next.js App Router, R3F coral-dunes scene, GSAP landing/HUD/death/result motion (`useGSAP`, transform/opacity, reduced-motion).
- Contracts: Anchor program sketch matching PRD §7 (stake/revive/odds/result).
- Skills applied: gsap-react, gsap-core, gsap-timeline, gsap-performance, create-rule, prisma-client singleton (v6 SQLite — skipped Prisma v7 adapter migration for local MVP).
- Explicitly skipped shadcn init — conflicts with brand-first game shell / no-card hero rules.

## 2026-07-11 — Build verified + local servers

- `shared` tests: 8 passed; `server` tests: 2 passed; `client` `next build` succeeded.
- Fixed ioredis typing, Express Router export type, vitest import path.
- Dev servers launching on :4000 (API) and :3000 (web).

## 2026-07-11 — Dynamic wallet + Coolify

- Wired `@dynamic-labs/sdk-react-core` + Solana connectors using Atomic env id `d388d3b0-2620-4ef0-8c09-3ace6d0ebbf6`.
- Client-only auth shell (Atomic pattern) + wallet → playerId sync.
- Added `client/Dockerfile`, `server/Dockerfile`, `docker-compose.yml`, `COOLIFY.md` for Coolify git/compose deploy.

## 2026-07-11 — Visual cleanup pass

- Replaced low-poly flat dunes with HD desert: displaced terrain, PBR materials, Sky/Environment/SoftShadows, path ribbon, rock field, humanoid wanderer, cinematic camera.
- Full-bleed immersive stage + slim glass HUD; gameplay loop still button-advance (depth pass later).
