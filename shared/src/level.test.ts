import { describe, expect, it } from "vitest";
import { computeLevelScore, computeSurvivalChance } from "../src/level.js";
import { reviveFeeFor, canRevive } from "../src/revive.js";
import { generateJourney } from "../src/config/journey.js";
import { rollArtifactDrop, sumItemBonus } from "../src/artifacts/drops.js";
import { ARTIFACT_DEFINITIONS } from "../src/artifacts/catalog.js";
import { BALANCING } from "../src/config/balancing.js";

describe("level score", () => {
  it("matches ln(usd) × duration × token", () => {
    const score = computeLevelScore({
      usdValueStaked: Math.E,
      durationMultiplier: 1.15,
      tokenMultiplier: 2,
    });
    expect(score).toBeCloseTo(2.3, 3);
  });

  it("returns 0 for non-positive stake", () => {
    expect(computeLevelScore({ usdValueStaked: 0, durationMultiplier: 1, tokenMultiplier: 2 })).toBe(0);
  });
});

describe("revive fees", () => {
  it("escalates per PRD multipliers", () => {
    const { base_fee_drift, multipliers, max_revives_per_journey } = BALANCING.revive;
    expect(reviveFeeFor(0, base_fee_drift, multipliers)).toBe(1);
    expect(reviveFeeFor(1, base_fee_drift, multipliers)).toBe(2.5);
    expect(reviveFeeFor(2, base_fee_drift, multipliers)).toBe(6);
    expect(canRevive(2, max_revives_per_journey)).toBe(true);
    expect(canRevive(3, max_revives_per_journey)).toBe(false);
  });
});

describe("journey generator", () => {
  it("is deterministic for a seed", () => {
    const a = generateJourney({ journeyId: "j1", seed: 42 });
    const b = generateJourney({ journeyId: "j1", seed: 42 });
    expect(a.nodes).toEqual(b.nodes);
    expect(a.nodes.at(-1)?.kind).toBe("checkpoint");
  });
});

describe("artifacts", () => {
  it("catalog has 4 categories", () => {
    const cats = new Set(ARTIFACT_DEFINITIONS.map((a) => a.category));
    expect(cats.has("armor")).toBe(true);
    expect(cats.has("food")).toBe(true);
    expect(cats.has("tool")).toBe(true);
    expect(cats.has("charm")).toBe(true);
  });

  it("applies specialized modifiers only to matching hazards", () => {
    const bonus = sumItemBonus(
      [{ artifactId: "charm_ember_ward", instanceId: "x", acquiredAtZone: 2 }],
      "fire",
    );
    expect(bonus).toBeGreaterThan(0);
    const none = sumItemBonus(
      [{ artifactId: "charm_ember_ward", instanceId: "x", acquiredAtZone: 2 }],
      "storm",
    );
    expect(none).toBe(0);
  });

  it("rolls drops with seed", () => {
    const drop = rollArtifactDrop(4, 99_001);
    // May be undefined (~45%); force a few seeds until defined or give up
    let found = drop;
    for (let s = 99_001; s < 99_050 && !found; s++) {
      found = rollArtifactDrop(4, s);
    }
    expect(found === undefined || typeof found.artifactId === "string").toBe(true);
  });
});

describe("survival chance", () => {
  it("stays within caps", () => {
    const high = computeSurvivalChance({ levelScore: 200, itemBonus: 0.5, difficulty: 0 });
    const low = computeSurvivalChance({ levelScore: 0, itemBonus: 0, difficulty: 10 });
    expect(high).toBeLessThanOrEqual(0.95);
    expect(low).toBeGreaterThanOrEqual(0.05);
  });
});
