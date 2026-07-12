import type { HazardKind, JourneyNode, JourneySeed } from "../types.js";
import { GAME_CONFIG_VERSION } from "./balancing.js";

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const NODE_KINDS: HazardKind[] = [
  "cache",
  "storm",
  "ambush",
  "fire",
  "fork",
  "checkpoint",
];

const LABELS: Record<HazardKind, string[]> = {
  cache: ["Buried Cache", "Sunken Chest", "Mirage Stash"],
  storm: ["Sandstorm Front", "Glass Gale", "Dune Tempest"],
  ambush: ["Ridge Ambush", "Canyon Raiders", "Night Stalkers"],
  fire: ["Ember Flats", "Heat Mirage", "Ash Drift"],
  fork: ["Twin Paths", "Split Dunes", "Forked Trail"],
  checkpoint: ["Oasis Gate", "Waystone", "Sky Arch"],
};

/**
 * Procedural coral-dunes journey: fixed length with seeded variation.
 * Positions march along +Z so the R3F client can stream chunks.
 */
export function generateJourney(params: {
  journeyId: string;
  seed: number;
  difficulty?: JourneySeed["difficulty"];
  nodeCount?: number;
}): JourneySeed {
  const difficulty = params.difficulty ?? "standard";
  const nodeCount = params.nodeCount ?? 8;
  const rand = mulberry32(params.seed);
  const difficultyBias = difficulty === "easy" ? -0.4 : difficulty === "hard" ? 0.5 : 0;

  const nodes: JourneyNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const isLast = i === nodeCount - 1;
    const isMidCheck = i === Math.floor(nodeCount / 2) - 1;
    let kind: HazardKind;
    if (isLast || isMidCheck) kind = "checkpoint";
    else kind = NODE_KINDS[Math.floor(rand() * (NODE_KINDS.length - 1))]!;

    const labels = LABELS[kind];
    const label = labels[Math.floor(rand() * labels.length)]!;
    const baseDiff = 1 + i * 0.35 + difficultyBias + rand() * 0.4;

    nodes.push({
      nodeId: `node_${i}`,
      zone: i,
      kind,
      difficulty: Number(Math.max(0.5, baseDiff).toFixed(2)),
      label,
      oddsPoolEligible: kind === "fork" || kind === "checkpoint" || kind === "storm",
      position: {
        x: (rand() - 0.5) * 8,
        y: 0,
        z: i * 18,
      },
    });
  }

  return {
    journeyId: params.journeyId,
    seed: params.seed,
    biome: "coral_dunes",
    configVersion: GAME_CONFIG_VERSION,
    difficulty,
    nodes,
    createdAt: Date.now(),
  };
}
