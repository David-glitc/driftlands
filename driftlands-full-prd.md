# Driftlands — Product Requirements Document

**Version:** 0.2 (Draft)
**Owner:** David Pere / ATOMIC Labs
**Status:** Pre-build spec
**Chain:** Solana
**Token:** $DRIFT (working name)

## 1. One-Line Pitch

A lightweight 3D survival-journey game where players stake tokens to level up, pay small fees to cheat death, and pool funds with each other into pari-mutuel odds pools for in-game perks and edges — all running at 30-40fps in the browser via three.js, with only financial state and outcomes touching Solana.

## V1 Scope

**In scope:** single journey biome, stake-to-level ($DRIFT + Sanctum LSTs), revive fee sink, one players-only odds pool type, config-driven artifacts (armor/food/tool/charm), leaderboard + reputation.

**Out of scope:** governance, on-chain NFTs, multiple biomes, PvP, mobile client.

## Architecture Split

- **On-chain:** Stake/Level Vault, Revive Sink, Odds Pool, Journey Result Attestation
- **Off-chain:** journey generation, artifacts, hazard resolution, anti-cheat, matchmaking, reputation

## Level Score

`Level Score = ln(USD_value_staked) × Duration_Multiplier × Token_Multiplier`

## Revive

Escalating fees (1×, 2.5×, 6×), hard cap 3 revives/journey.

## Full detail

Canonical long-form PRD lives with the product owner; this file is the repo-facing summary agents must follow. See also `implementation-plan.mdc` and `DEVELOPMENT.md`.
