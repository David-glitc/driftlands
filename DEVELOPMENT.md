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

## 2026-07-11 — Coolify harden

- Bookworm-based Dockerfiles + healthchecks; compose exposes Traefik-friendly labels.
- Need Coolify panel URL/token (or invite) to finish remote deploy from here.

## 2026-07-11 16:45 UTC+1 — Coolify live deploy

- Cloned/used `David-glitc/driftlands` on VPS; token from `~/.config/driftlands/coolify.env`.
- Created Coolify compose service `pjs273bfq41mp9zcq2e714ki` on personal project / server `goyjivzepwvgk2egci5nms3i`.
- Built `driftlands-server:latest` + `driftlands-client:latest` on VPS; fixed Prisma path, copied `server/node_modules`, ensured `client/public`.
- Domains: web `https://driftlands.kierkegaard.space` (200), API `https://driftlands-api.kierkegaard.space` (health ok). Avoided `api.driftlands.*` (Cloudflare free SSL is single-level only).
- Redeploy: rebuild images on VPS, then `node scripts/deploy-coolify.mjs`.

## 2026-07-11 17:00 UTC+1 — kierkegaard.space + public repo

- Repo set public: https://github.com/David-glitc/driftlands
- Coolify rebound to `driftlands.kierkegaard.space` + `driftlands-api.kierkegaard.space`; client rebuilt with matching `NEXT_PUBLIC_*`.
- Cloudflare API tokens IP-restricted from VPS/Windows — add A records manually in CF zone `kierkegaard.space` → `109.205.181.119` (proxied) for `driftlands` and `driftlands-api`.
- Prep for app overhaul on the kierkegaard.space domain.

## 2026-07-11 21:55 UTC+1 — blank landing fix

- DNS + API were already OK; client logs showed Next Server Action mismatches after rebuilds.
- Fixed Landing GSAP: no longer uses `.from(autoAlpha:0)` (could leave hero invisible). Set `Cache-Control` so HTML isn't sticky forever.
- Rebuilt + restarted Coolify client; `https://driftlands.kierkegaard.space` → 200.

## 2026-07-11 22:10 UTC+1 — player-facing copy

- Removed “Atomic Dynamic env” wallet line → “Connect your wallet to play, or continue as a guest below.”
- Guest field → “Guest name”; default id `Wanderer`; demo note rewritten without pay_revive jargon.
- Redeployed client (web 200).

## 2026-07-11 22:35 UTC+1 — artifacts, shaders, stats (PRD §8–9)

- Shared: ArtifactStats, expanded catalog (~14), `sumInventoryStats` / `effectiveSurvivalBonus` / belt ranking; GAME_CONFIG_VERSION `balancing-v1.1.0+artifacts-v1.1.0`.
- Server journey engine uses effectiveSurvivalBonus; catalog snapshot exposes axes.
- Client: procedural PBR materials + category kits; EquippedGear + InstancedPickups in JourneyCanvas; ArtifactBelt (max 4, rank borders), loadout stats, InventoryPanel; death modal itemBonus line; PRD sync in driftlands-full-prd.md.

## 2026-07-11 22:45 UTC+1 — Phase 4 wallet + demo stake + Coolify redeploy

- Landing DemoStakePanel: asset / USD / duration → `computeLevelScore`; persisted; startJourney uses score (fallback 14).
- Dynamic Solana wallet unchanged as Phase 4 adapter; COOLIFY.md documents Vercel client + Fly server targets.
- Synced to VPS, rebuilt `driftlands-server` + `driftlands-client`, Coolify service restart.

## 2026-07-11 23:05 UTC+1 — settings, hotkeys, logo, landing

- SettingsPanel + HotkeysManual dialogs; AppChrome; keyboard: Space/Enter advance, I inventory, S/Esc settings, ? manual, 1–3 difficulty, L leave.
- Graphics quality / reduced motion / camera sway wired into JourneyCanvas.
- HD logo mark → `public/logo.png`, `logo-512.png`, `logo-192.png`, `favicon.ico` + app icons; redesigned landing hero with brand-first composition.

## 2026-07-11 23:20 UTC+1 — artifact/shader visibility + Coolify ship

- WorldArtifactProps at hazard/cache nodes (lit floating meshes); bigger EquippedGear + ActiveLootBurst; stronger emissive materials.
- Starter Sunweave on journey start; drop chance ~72%. Redeployed client+server images on Coolify.
