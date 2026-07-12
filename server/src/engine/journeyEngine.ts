import { createHash, createHmac, randomInt } from "node:crypto";
import { nanoid } from "nanoid";
import {
  BALANCING,
  GAME_CONFIG_VERSION,
  canRevive,
  catalogSnapshot as artifactCatalogSnapshot,
  computeSurvivalChance,
  effectiveSurvivalBonus,
  generateJourney,
  getArtifactById,
  reviveFeeFor,
  rollArtifactDrop,
  type EquippedArtifact,
  type HazardRollResult,
  type JourneyResultPayload,
  type JourneySeed,
  type OddsPoolView,
  type PlayerSession,
  type RealtimeEvent,
} from "@driftlands/shared";

export interface ActiveJourney {
  seed: JourneySeed;
  session: PlayerSession;
  demoLevelScore: number;
}

const journeys = new Map<string, ActiveJourney>();
const pools = new Map<string, OddsPoolView>();

export function getActiveJourney(journeyId: string): ActiveJourney | undefined {
  return journeys.get(journeyId);
}

export function listActiveForPlayer(playerId: string): ActiveJourney | undefined {
  for (const j of journeys.values()) {
    if (j.session.playerId === playerId && ["active", "awaiting_revive", "lobby"].includes(j.session.status)) {
      return j;
    }
  }
  return undefined;
}

export function startJourney(params: {
  playerId: string;
  difficulty?: JourneySeed["difficulty"];
  levelScore?: number;
  reputation?: number;
  /** Force a fresh run even if one is active */
  forceNew?: boolean;
}): ActiveJourney {
  if (!params.forceNew) {
    const existing = listActiveForPlayer(params.playerId);
    if (existing) return existing;
  } else {
    const existing = listActiveForPlayer(params.playerId);
    if (existing) {
      existing.session.status = "abandoned";
    }
  }

  const journeyId = `j_${nanoid(10)}`;
  const seed = randomInt(1, 2_147_483_647);
  const journeySeed = generateJourney({
    journeyId,
    seed,
    difficulty: params.difficulty ?? "standard",
  });

  const demoLevelScore = params.levelScore ?? 12;
  const session: PlayerSession = {
    playerId: params.playerId,
    journeyId,
    levelScore: demoLevelScore,
    reputation: params.reputation ?? 0,
    zoneIndex: 0,
    hp: 100,
    inventory: [
      {
        artifactId: "armor_sunweave",
        instanceId: `starter_${journeyId}`,
        acquiredAtZone: 0,
      },
    ],
    reviveCount: 0,
    status: "active",
  };

  const active: ActiveJourney = { seed: journeySeed, session, demoLevelScore };
  journeys.set(journeyId, active);
  return active;
}

export function resolveCurrentNode(journeyId: string): {
  result: HazardRollResult;
  session: PlayerSession;
  event: RealtimeEvent;
  ended?: JourneyResultPayload;
} {
  const active = journeys.get(journeyId);
  if (!active) throw new Error("Journey not found");
  if (active.session.status !== "active") throw new Error(`Journey is ${active.session.status}`);

  const node = active.seed.nodes[active.session.zoneIndex];
  if (!node) throw new Error("No node at current zone");

  const itemBonus = effectiveSurvivalBonus(active.session.inventory, node.kind);
  const survivalChance = computeSurvivalChance({
    levelScore: active.session.levelScore,
    itemBonus,
    difficulty: node.difficulty,
  });

  const rollSeed = active.seed.seed + active.session.zoneIndex * 9973;
  const roll = ((rollSeed * 2654435761) >>> 0) / 4294967296;
  const survived = node.kind === "cache" || node.kind === "checkpoint" || roll < survivalChance;

  let droppedArtifact: EquippedArtifact | undefined;
  if (survived && (node.kind === "cache" || roll > 0.7)) {
    droppedArtifact = rollArtifactDrop(node.zone, rollSeed);
    if (droppedArtifact) {
      const def = getArtifactById(droppedArtifact.artifactId);
      const count = active.session.inventory.filter((i) => i.artifactId === droppedArtifact!.artifactId).length;
      if (def && count < def.stackLimit) {
        active.session.inventory.push(droppedArtifact);
      } else {
        droppedArtifact = undefined;
      }
    }
  }

  const result: HazardRollResult = {
    nodeId: node.nodeId,
    survived,
    survivalChance,
    roll: Number(roll.toFixed(4)),
    itemBonus,
    levelBonus: Math.min(0.35, active.session.levelScore / 100),
    droppedArtifact,
  };

  if (!survived) {
    active.session.status = "awaiting_revive";
    active.session.hp = 0;
    const fee = currentReviveFee(active);
    const event: RealtimeEvent = {
      type: "player.died",
      payload: {
        playerId: active.session.playerId,
        reviveFeeDrift: fee,
        reviveCount: active.session.reviveCount,
      },
    };
    return { result, session: active.session, event };
  }

  // Advance
  const nextIndex = active.session.zoneIndex + 1;
  const finished = nextIndex >= active.seed.nodes.length;
  if (finished) {
    active.session.zoneIndex = active.seed.nodes.length - 1;
    active.session.status = "survived";
    const ended = buildResult(active, true);
    const event: RealtimeEvent = { type: "journey.ended", payload: { ...ended, playerId: ended.player } };
    return { result, session: active.session, event, ended };
  }

  active.session.zoneIndex = nextIndex;
    const event: RealtimeEvent = {
      type: "hazard.resolved",
      payload: { ...result, playerId: active.session.playerId },
    };
    return { result, session: active.session, event };
}

export function currentReviveFee(active: ActiveJourney): number {
  const { base_fee_drift, multipliers, max_revives_per_journey } = BALANCING.revive;
  if (!canRevive(active.session.reviveCount, max_revives_per_journey)) {
    return Infinity;
  }
  const discounts = active.session.inventory
    .map((i) => getArtifactById(i.artifactId)?.reviveDiscount ?? 0)
    .filter((d) => d > 0);
  const fee = reviveFeeFor(active.session.reviveCount, base_fee_drift, multipliers);
  const totalDiscount = Math.min(0.5, discounts.reduce((a, b) => a + b, 0));
  return Number((fee * (1 - totalDiscount)).toFixed(6));
}

export function reviveJourney(journeyId: string, opts?: { demoPaid?: boolean }): {
  session: PlayerSession;
  fee: number;
  event: RealtimeEvent;
} {
  const active = journeys.get(journeyId);
  if (!active) throw new Error("Journey not found");
  if (active.session.status !== "awaiting_revive") throw new Error("Not awaiting revive");

  const { max_revives_per_journey } = BALANCING.revive;
  if (!canRevive(active.session.reviveCount, max_revives_per_journey)) {
    active.session.status = "permadeath";
    throw new Error("Revive cap reached");
  }

  const fee = currentReviveFee(active);
  // In demo mode fee is recorded; on-chain pay_revive is required in production
  if (!opts?.demoPaid && process.env.DEMO_MODE !== "true") {
    throw new Error("On-chain revive payment required");
  }

  active.session.reviveCount += 1;
  active.session.hp = 100;
  active.session.status = "active";
  // Continue from same node (retry)
  const event: RealtimeEvent = {
    type: "player.revived",
    payload: { playerId: active.session.playerId, reviveCount: active.session.reviveCount },
  };
  return { session: active.session, fee, event };
}

export function abandonJourney(journeyId: string): JourneyResultPayload {
  const active = journeys.get(journeyId);
  if (!active) throw new Error("Journey not found");
  active.session.status = "permadeath";
  return buildResult(active, false);
}

export function buildResult(active: ActiveJourney, survived: boolean): JourneyResultPayload {
  const reputationDelta = survived
    ? BALANCING.reputation.survive_bonus
    : BALANCING.reputation.death_penalty;

  const body = {
    journeyId: active.seed.journeyId,
    player: active.session.playerId,
    survived,
    zoneReached: active.session.zoneIndex,
    reviveCount: active.session.reviveCount,
    reputationDelta,
    configVersion: GAME_CONFIG_VERSION,
    timestamp: Date.now(),
  };

  const resultHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  return { ...body, resultHash };
}

export function signJourneyResult(payload: JourneyResultPayload): string {
  const secret = process.env.JOURNEY_SIGNING_SECRET;
  if (!secret) {
    if (process.env.DEMO_MODE === "true") {
      console.warn("[driftlands] JOURNEY_SIGNING_SECRET not set — using unsafe default (demo mode OK)");
    } else {
      throw new Error("JOURNEY_SIGNING_SECRET is required in production mode");
    }
  }
  return createHmac("sha256", secret ?? "driftlands-dev-ed25519-change-in-prod").update(JSON.stringify(payload)).digest("hex");
}

export function openOddsPool(journeyId: string, nodeId: string): OddsPoolView {
  const active = journeys.get(journeyId);
  if (!active) throw new Error("Journey not found");
  const node = active.seed.nodes.find((n) => n.nodeId === nodeId);
  if (!node?.oddsPoolEligible) throw new Error("Node not odds-pool eligible");

  const poolId = `pool_${journeyId}_${nodeId}`;
  if (pools.has(poolId)) return pools.get(poolId)!;

  const view: OddsPoolView = {
    poolId,
    journeyId,
    nodeId,
    outcomes: [
      { outcomeId: "survives", label: "Survives this node", totalStaked: 0 },
      { outcomeId: "fails", label: "Fails this node", totalStaked: 0 },
    ],
    closeTime: Date.now() + 60_000,
    resolved: false,
    feeBps: BALANCING.odds_pool.fee_bps,
  };
  pools.set(poolId, view);
  return view;
}

export function enterOddsPool(
  poolId: string,
  playerId: string,
  outcomeId: string,
  amount: number,
): OddsPoolView {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("Pool not found");
  if (pool.resolved) throw new Error("Pool already resolved");
  if (amount < BALANCING.odds_pool.min_buy_in) throw new Error("Below min buy-in");

  const active = journeys.get(pool.journeyId);
  if (!active || active.session.playerId !== playerId) {
    throw new Error("Only active journey players may enter");
  }

  const outcome = pool.outcomes.find((o) => o.outcomeId === outcomeId);
  if (!outcome) throw new Error("Invalid outcome");
  outcome.totalStaked += amount;
  return pool;
}

export function resolveOddsPool(poolId: string, survived: boolean): OddsPoolView {
  const pool = pools.get(poolId);
  if (!pool) throw new Error("Pool not found");
  pool.resolved = true;
  pool.winningOutcomeId = survived ? "survives" : "fails";
  return pool;
}

export function catalogSnapshot() {
  const snap = artifactCatalogSnapshot();
  return {
    configVersion: GAME_CONFIG_VERSION,
    artifactConfigVersion: snap.configVersion,
    artifacts: snap.artifacts,
    balancing: BALANCING,
  };
}
