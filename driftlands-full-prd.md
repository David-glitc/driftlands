# Driftlands — Product Requirements Document

**Version:** 0.2 (Draft)
**Owner:** David Pere / ATOMIC Labs
**Status:** Pre-build spec
**Chain:** Solana
**Token:** $DRIFT (working name)

## 1. One-Line Pitch

A lightweight 3D survival-journey game where players stake tokens to level up, pay small fees to cheat death, and pool funds with each other into pari-mutuel odds pools for in-game perks and edges — all running at 30-40fps in the browser via three.js, with only financial state and outcomes touching Solana.

## 2. Problem & Positioning

Chain = settlement and risk only. Game = off-chain authoritative server (pathing, items, combat, drops). Mirrors ATOMIC enforcement vs product vs ephemeral split.

## 3. Target Users

Degen spectators, Sanctum LST holders, casual web gamers, $DRIFT holders.

## 4. Core Game Loop

Stake → Level Score → Journey (procedural risk nodes) → off-chain artifacts adjust odds → revive fees escalate (cap 3) → players-only odds pools → signed Journey Result on-chain.

## 5. Token Mechanics ($DRIFT)

- Level Score = ln(USD_value_staked) × Duration_Multiplier × Token_Multiplier
- Revive sink: 1× / 2.5× / 6×, max 3/journey
- Players-only pari-mutuel odds pools → in-game perks + protocol fee
- Reputation accrue/decay

## 6–7. On-Chain vs Off-Chain / Anchor sketch

Stake vault, revive sink, odds pool, journey result attestation. Server signs results. Only stake / revive / pool entry need wallet signatures.

## 8. Frontend (three.js)

30–40fps, <150 draw calls, <500MB heap. Instancing, LOD, frustum culling, baked lighting preferred; atlased textures. Scene: terrain, hazard-nodes, player-avatars, **instanced item pickups**, vfx-pool.

## 9. Artifacts

Config-driven armor/food/tool/charm. Ranks common→legendary. Axes: power, specialization, rarity, situational fit. Multi-stat loadout (power/vitality/focus/luck/weight) bridges into survival odds. `config_version` on journey results.

## 10–11. UX & V1 Scope

HUD: Level/Rep TL, zone progress TC, wallet TR, HP bottom-center, **artifact belt BL (max 4)**, odds ping BR. Death: Revive / End Journey only.

**In:** one biome, stake+revive+one pool type, artifacts, leaderboard.
**Out:** governance, on-chain NFTs, multi-biome, PvP, mobile-first.

## Story (summary)

The world fractured into Drifts when consensus failed. Wayfarers walk between them anchored by $DRIFT. Artifacts are fragments of old certainty. Revive = re-anchor toll. Odds pools = contagious conviction.

## Landing copy (artifacts)

**Fragments of old certainty.** Equip them to shift your odds. Rank Common→Legendary. Build a loadout that survives your kind of Drift.

## UI performance rules

DOM overlays (not canvas). No backdrop-filter. Animate transform/opacity only. Rank borders: gray/green/blue/purple/gold.
