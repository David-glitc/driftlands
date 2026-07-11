import { Router, type Router as ExpressRouter } from "express";
import {
  abandonJourney,
  buildResult,
  catalogSnapshot,
  currentReviveFee,
  enterOddsPool,
  getActiveJourney,
  openOddsPool,
  resolveCurrentNode,
  resolveOddsPool,
  reviveJourney,
  signJourneyResult,
  startJourney,
} from "./engine/journeyEngine.js";
import { persistJourneyEnd, persistJourneyStart, topLeaderboard, ensurePlayer } from "./db.js";
import { realtime } from "./realtime.js";
import { cache } from "./cache.js";

export const api: ExpressRouter = Router();

api.get("/health", (_req, res) => {
  res.json({ ok: true, service: "driftlands-server", demo: process.env.DEMO_MODE === "true" });
});

api.get("/catalog", (_req, res) => {
  res.json(catalogSnapshot());
});

api.post("/journeys", async (req, res) => {
  try {
    const playerId = String(req.body.playerId ?? "demo_wanderer");
    const difficulty = req.body.difficulty as "easy" | "standard" | "hard" | undefined;
    const levelScore = Number(req.body.levelScore ?? 12);

    await ensurePlayer(playerId);
    const active = startJourney({ playerId, difficulty, levelScore });
    await persistJourneyStart({
      journeyId: active.seed.journeyId,
      playerId,
      seed: active.seed.seed,
      difficulty: active.seed.difficulty,
      configVersion: active.seed.configVersion,
    });
    await cache.set(`journey:${active.seed.journeyId}`, JSON.stringify(active.session), 3600);

    await realtime.publish(active.seed.journeyId, {
      type: "journey.started",
      payload: { journeyId: active.seed.journeyId, seed: active.seed.seed },
    });

    res.status(201).json({
      journey: active.seed,
      session: active.session,
      reviveFeePreview: currentReviveFee(active),
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.get("/journeys/:id", (req, res) => {
  const active = getActiveJourney(req.params.id);
  if (!active) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json({
    journey: active.seed,
    session: active.session,
    reviveFeePreview: Number.isFinite(currentReviveFee(active)) ? currentReviveFee(active) : null,
  });
});

api.post("/journeys/:id/advance", async (req, res) => {
  try {
    const { result, session, event, ended } = resolveCurrentNode(req.params.id);
    await realtime.publish(req.params.id, event);

    if (ended) {
      const signature = signJourneyResult(ended);
      await persistJourneyEnd({
        journeyId: ended.journeyId,
        status: ended.survived ? "survived" : "permadeath",
        zoneReached: ended.zoneReached,
        reviveCount: ended.reviveCount,
        resultHash: ended.resultHash,
        inventoryJson: JSON.stringify(session.inventory),
        reputationDelta: ended.reputationDelta,
        playerId: ended.player,
      });
      res.json({ result, session, ended, signature });
      return;
    }

    // Open odds pool hint at eligible nodes
    const active = getActiveJourney(req.params.id)!;
    const node = active.seed.nodes[session.zoneIndex];
    let pool = null;
    if (node?.oddsPoolEligible && session.status === "active") {
      pool = openOddsPool(req.params.id, node.nodeId);
      await realtime.publish(req.params.id, { type: "odds_pool.opened", payload: pool });
    }

    res.json({ result, session, pool });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/journeys/:id/revive", async (req, res) => {
  try {
    const demoPaid = process.env.DEMO_MODE === "true" || Boolean(req.body.demoPaid);
    const { session, fee, event } = reviveJourney(req.params.id, { demoPaid });
    await realtime.publish(req.params.id, event);
    res.json({ session, fee, note: demoPaid ? "demo revive — no on-chain tx" : "on-chain verified" });
  } catch (err) {
    const active = getActiveJourney(req.params.id);
    if (active?.session.status === "awaiting_revive") {
      try {
        // Cap reached → permadeath
        const ended = abandonJourney(req.params.id);
        const signature = signJourneyResult(ended);
        await persistJourneyEnd({
          journeyId: ended.journeyId,
          status: "permadeath",
          zoneReached: ended.zoneReached,
          reviveCount: ended.reviveCount,
          resultHash: ended.resultHash,
          inventoryJson: JSON.stringify(active.session.inventory),
          reputationDelta: ended.reputationDelta,
          playerId: ended.player,
        });
        res.status(400).json({ error: err instanceof Error ? err.message : "failed", ended, signature });
        return;
      } catch {
        /* fall through */
      }
    }
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/journeys/:id/abandon", async (req, res) => {
  try {
    const active = getActiveJourney(req.params.id);
    if (!active) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const ended = abandonJourney(req.params.id);
    const signature = signJourneyResult(ended);
    await persistJourneyEnd({
      journeyId: ended.journeyId,
      status: "permadeath",
      zoneReached: ended.zoneReached,
      reviveCount: ended.reviveCount,
      resultHash: ended.resultHash,
      inventoryJson: JSON.stringify(active.session.inventory),
      reputationDelta: ended.reputationDelta,
      playerId: ended.player,
    });
    await realtime.publish(req.params.id, { type: "journey.ended", payload: ended });
    res.json({ ended, signature });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/pools/:poolId/enter", (req, res) => {
  try {
    const { playerId, outcomeId, amount } = req.body as {
      playerId: string;
      outcomeId: string;
      amount: number;
    };
    const pool = enterOddsPool(req.params.poolId, playerId, outcomeId, Number(amount));
    res.json({ pool });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/pools/:poolId/resolve", async (req, res) => {
  try {
    const survived = Boolean(req.body.survived);
    const pool = resolveOddsPool(req.params.poolId, survived);
    await realtime.publish(pool.journeyId, { type: "odds_pool.resolved", payload: pool });
    res.json({ pool });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.get("/leaderboard", async (_req, res) => {
  const rows = await topLeaderboard(25);
  res.json({
    entries: rows.map((r) => ({
      playerId: r.playerId,
      displayName: r.player.displayName,
      reputation: r.reputation,
      journeysWon: r.journeysWon,
    })),
  });
});

/** Attestation helper — returns signed result for on-chain post_journey_result */
api.get("/journeys/:id/attestation", (req, res) => {
  const active = getActiveJourney(req.params.id);
  if (!active) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (!["survived", "permadeath"].includes(active.session.status)) {
    res.status(400).json({ error: "journey still in progress" });
    return;
  }
  const payload = buildResult(active, active.session.status === "survived");
  res.json({ payload, signature: signJourneyResult(payload) });
});
