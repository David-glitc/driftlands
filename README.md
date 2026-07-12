# Driftlands

Lightweight 3D survival-journey game on Solana. Stake to level, pay to revive, pool odds with fellow wanderers — gameplay off-chain, settlement on-chain.

## Monorepo

```
shared/     types, balancing, artifacts
server/     authoritative game API + WS
client/     Next.js + React Three Fiber
contracts/  Anchor programs (stake / revive / odds / result)
```

## Quick start

```bash
pnpm install
pnpm --filter @driftlands/shared build
pnpm --filter @driftlands/server db:generate
pnpm --filter @driftlands/server db:push
pnpm dev
```

- Client: http://localhost:3000  
- Server: http://localhost:4000/api/health  

Set `DEMO_MODE=true` (default) to play without wallet txs.

## Stack

TypeScript · Turborepo · Next.js · R3F · GSAP · Express · Prisma · Ably/WS · Anchor/Solana

## Docs

- [PRD](./driftlands-full-prd.md)
- [DEVELOPMENT log](./DEVELOPMENT.md)
- [Implementation plan](./implementation-plan.mdc)
