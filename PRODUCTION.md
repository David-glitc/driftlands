# Driftlands — Production Roadmap

**Goal**: Ship a competitive browser game for the Orynth Game Cup 2026 (deadline July 20, $10K prize). Handle 200+ concurrent users and 20 simultaneous MMO players.

---

## Current State (July 12, 2026)

### Live
- **Web**: https://driftlands.kierkegaard.space
- **API**: https://driftlands-api.kierkegaard.space/api/health
- **Docker images**: `ghcr.io/david-glitc/driftlands-{server,client}:latest`
- **Coolify service**: `pjs273bfq41mp9zcq2e714ki` on VPS `109.205.181.119`

### Deployed Features
- 3D lobby with floating island (React Three Fiber)
- Open-world WASD movement with proximity-based NPC interaction
- Single-player journey engine (14 zones, hazards, artifacts, odds pools)
- Multiplayer rooms (create/join/ready/start/advance/revive, up to 8 players)
- Token/Jupiter swap UI + leaderboard
- Story system (6 lore entries, 6 NPCs, 6 dialogue trees)
- Progression: 5 ranks, 20 achievements, 12 cosmetics, daily streaks, codex
- Full wanderer profile page
- WebSocket realtime + Ably dual-publish
- SQLite with WAL mode, rate limiting, gzip compression, graceful shutdown

### Server Hardening Done
- Rate limiting: 60 req/10s per IP
- Gzip compression on all API responses
- SQLite WAL mode + busy_timeout=5000ms
- Graceful shutdown (SIGTERM/SIGINT → close WS → disconnect DB)
- Body size limit 256kb
- Non-root container users (drift/nextjs)

---

## Roadmap to Full Production

### Phase 1: Stability & Load Capacity (July 12-14) — DONE

| Item | Status | Notes |
|---|---|---|
| GHCR image pipeline | Done | `scripts/build-and-push.sh` builds + pushes locally |
| Coolify auto-pull from GHCR | Done | Compose patched, service restarted |
| Rate limiting (60 req/10s) | Done | In-memory, per-IP |
| Gzip compression | Done | `compression()` middleware |
| SQLite WAL mode | Done | Concurrent reads for 200 users |
| Graceful shutdown | Done | SIGTERM → close WS → disconnect |
| Body size limit | Done | 256kb max |
| Health check endpoint | Done | `/api/health` |

### Phase 2: Scale to 200 Users + 20 MMO Players (July 14-16)

| Item | Priority | Effort | Notes |
|---|---|---|---|
| WebSocket connection pooling | High | 4h | Track active WS connections, evict stale connections after 60s timeout |
| Room capacity monitoring | High | 2h | Log active rooms/players, reject new joins when at capacity |
| SQLite → PostgreSQL migration | Medium | 6h | `prisma migrate`, update `DATABASE_URL`, add connection pooling (pgBouncer) |
| Redis for session cache | Medium | 3h | Set `REDIS_URL` in Coolify, replaces in-memory Map for multi-node |
| Client-side reconnection logic | High | 3h | Exponential backoff (2s → 4s → 8s → 16s), replay missed events |
| API request timeout | Medium | 1h | 10s timeout on all routes, return 504 if engine is slow |
| Journey session TTL | Medium | 2h | Auto-expire abandoned journeys after 30 min, free memory |
| Load test with k6 | Medium | 3h | Simulate 200 concurrent users hitting /api/health + /api/catalog |

### Phase 3: Game Polish for Tournament (July 16-19)

| Item | Priority | Effort | Notes |
|---|---|---|---|
| Wire streak login on page load | High | 1h | Call `/profile/:id/streak` in initial useEffect |
| Wire XP award on journey end | High | 1h | Call `/profile/:id/xp` after journey completes |
| Wire artifact recording | Medium | 1h | Call `/profile/:id/artifact` when artifact looted |
| Sound effects | Medium | 4h | Hazard sounds, artifact pickup, level up, ambient |
| Mobile responsive layout | Low | 4h | Touch controls for mobile play |
| Tutorial overlay for new players | Medium | 3h | First-time user experience |
| Leaderboard refresh on interval | Low | 1h | Poll /api/leaderboard every 30s |
| Cosmetics display in 3D world | Low | 4h | Show equipped cloak/trail on avatar |

### Phase 4: Tournament Day (July 20)

| Item | Priority | Notes |
|---|---|---|
| Pre-game smoke test | Critical | Verify both URLs respond, WS connects, rooms work |
| Monitor server logs | Critical | `docker logs` on VPS, watch for OOM/errors |
| Backup SQLite DB | Critical | Copy `/data/driftlands.db` before tournament |
| Announce on socials | Medium | Twitter/Discord with play link |

### Phase 5: Post-Tournament Hardening (July 21+)

| Item | Priority | Notes |
|---|---|---|
| PostgreSQL migration | Medium | SQLite won't scale past ~500 concurrent writes |
| Multi-node WS via Redis pub/sub | Medium | For >1 server instance, room state needs Redis backing |
| Sentry error tracking | Low | Client + server error capture |
| CDN for static assets | Low | Cloudflare cache for `/_next/static/*` |
| Cron job for stale room cleanup | Low | Delete rooms older than 2h |
| On-chain integration (non-demo) | Low | Disable DEMO_MODE, wire real Solana txs |
| E2E tests with Playwright | Low | Cover critical user journeys |

---

## Deploy Commands

```bash
# Build and push images locally
bash scripts/build-and-push.sh latest

# Deploy to Coolify (patches compose + restarts)
ABLY_API_KEY=xxx node scripts/deploy-coolify.mjs

# List Coolify services
node scripts/deploy-coolify.mjs --list

# Check health
curl https://driftlands-api.kierkegaard.space/api/health
curl -o /dev/null -w "%{http_code}" https://driftlands.kierkegaard.space
```

## Capacity Notes

| Metric | Current | Target | Path |
|---|---|---|---|
| Concurrent WS connections | ~100 (single Node) | 200 | Increase Node memory, add connection timeout |
| Concurrent MMO players | ~20 (in-memory rooms) | 20 | Already sufficient |
| API requests/sec | ~600 (rate limited) | 1000 | Increase rate limit, add Redis cache |
| DB connections | SQLite (1 writer) | PostgreSQL | Phase 5 migration |
| Container memory | ~512MB each | 1GB | Coolify resource limits |

## Known Limitations

1. **Single-node only**: Room state is in-memory (Map). No horizontal scaling until Redis-backed room state.
2. **SQLite**: Fine for 200 users. WAL mode helps but single-writer limit means ~100 writes/sec max.
3. **No persistent sessions**: If server restarts, all active journeys and rooms are lost. Redis cache would persist journey sessions.
4. **GH Actions billing locked**: CI fails silently (`continue-on-error: true`). All testing is local (`pnpm typecheck && pnpm test`).