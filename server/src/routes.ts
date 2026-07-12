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
import {
  createRoom,
  joinRoom,
  leaveRoom,
  listRooms,
  getRoom,
  setReady,
  startRoomJourney,
  advanceRoomPlayer,
  reviveRoomPlayer,
} from "./engine/roomEngine.js";

export const api: ExpressRouter = Router();

const VALID_PLAYER_ID = /^[a-zA-Z0-9_.@-]{1,64}$/;

function parsePlayerId(raw: unknown): string {
  const id = String(raw ?? "demo_wanderer").trim();
  if (!VALID_PLAYER_ID.test(id)) throw new Error("Invalid playerId");
  return id;
}

api.get("/health", (_req, res) => {
  res.json({ ok: true, service: "driftlands-server", demo: process.env.DEMO_MODE === "true" });
});

api.get("/catalog", (_req, res) => {
  res.json(catalogSnapshot());
});

api.post("/journeys", async (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const difficulty = req.body.difficulty as "easy" | "standard" | "hard" | undefined;
    const levelScore = Number(req.body.levelScore ?? 12);

    await ensurePlayer(playerId);
    const active = startJourney({ playerId, difficulty, levelScore, forceNew: true });
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
    const msg = err instanceof Error ? err.message : "failed";
    if (msg.includes("Revive cap reached")) {
      const active = getActiveJourney(req.params.id);
      if (active && active.session.status === "permadeath") {
        const ended = buildResult(active, false);
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
        res.status(400).json({ error: msg, ended, signature });
        return;
      }
    }
    res.status(400).json({ error: msg });
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
    await realtime.publish(req.params.id, { type: "journey.ended", payload: { ...ended, playerId: ended.player } });
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
    entries: rows.map((r: { playerId: string; player: { displayName: string | null }; reputation: number; journeysWon: number }) => ({
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

/* ── Game Rooms (multiplayer) ── */

api.get("/rooms", (_req, res) => {
  res.json({ rooms: listRooms() });
});

api.post("/rooms", (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const room = createRoom({
      name: String(req.body.name ?? "Drift").slice(0, 48),
      hostId: playerId,
      hostName: String(req.body.displayName ?? playerId).slice(0, 32),
      maxPlayers: Math.min(8, Math.max(2, Number(req.body.maxPlayers) || 4)),
      difficulty: (["easy", "standard", "hard"].includes(req.body.difficulty) ? req.body.difficulty : "standard") as "easy" | "standard" | "hard",
    });
    res.status(201).json({ room });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.get("/rooms/:id", (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) {
    res.status(404).json({ error: "room not found" });
    return;
  }
  res.json({ room });
});

api.post("/rooms/:id/join", (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const displayName = String(req.body.displayName ?? playerId).slice(0, 32);
    const room = joinRoom(req.params.id, playerId, displayName);
    res.json({ room });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/rooms/:id/leave", (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const room = leaveRoom(req.params.id, playerId);
    res.json({ room });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/rooms/:id/ready", (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const room = setReady(req.params.id, playerId, Boolean(req.body.ready));
    res.json({ room });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/rooms/:id/start", (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const { room, journeySeed } = startRoomJourney(req.params.id, playerId);
    res.json({ room, journeySeed });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/rooms/:id/advance", (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const result = advanceRoomPlayer(req.params.id, playerId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});

api.post("/rooms/:id/revive", (req, res) => {
  try {
    const playerId = parsePlayerId(req.body.playerId);
    const player = reviveRoomPlayer(req.params.id, playerId);
    res.json({ player });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "failed" });
  }
});
