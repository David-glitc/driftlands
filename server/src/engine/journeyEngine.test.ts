import { describe, expect, it } from "vitest";

process.env.DEMO_MODE = "true";
process.env.JOURNEY_SIGNING_SECRET = "test-secret";

import {
  abandonJourney,
  buildResult,
  currentReviveFee,
  resolveCurrentNode,
  reviveJourney,
  signJourneyResult,
  startJourney,
} from "./journeyEngine.js";

describe("journey engine", () => {
  it("starts a journey with expected shape", () => {
    const active = startJourney({ playerId: `test_${Date.now()}`, levelScore: 20 });
    expect(active.session.status).toBe("active");
    expect(active.seed.nodes.length).toBeGreaterThan(3);
    expect(active.session.inventory.length).toBe(1);
    expect(active.session.zoneIndex).toBe(0);
  });

  it("advances a journey node", () => {
    const active = startJourney({ playerId: `test_${Date.now()}`, levelScore: 20, difficulty: "easy" });
    const step = resolveCurrentNode(active.seed.journeyId);
    expect(step.result.nodeId).toBeDefined();
    expect(["active", "awaiting_revive", "survived"]).toContain(step.session.status);
  });

  it("signs a journey result", () => {
    const active = startJourney({ playerId: `sig_${Date.now()}`, levelScore: 15 });
    const result = buildResult(active, false);
    const sig = signJourneyResult(result);
    expect(sig).toHaveLength(64);
  });

  it("enforces revive cap", () => {
    const active = startJourney({
      playerId: `cap_${Date.now()}`,
      levelScore: 15,
      forceNew: true,
    });

    active.session.reviveCount = 3;
    active.session.status = "awaiting_revive";

    expect(currentReviveFee(active)).toBe(Infinity);

    expect(() => reviveJourney(active.seed.journeyId, { demoPaid: true })).toThrow("Revive cap reached");
    expect(active.session.status).toBe("permadeath");
  });

  it("revives successfully in demo mode under the cap", () => {
    const active = startJourney({
      playerId: `rv_${Date.now()}`,
      levelScore: 15,
      forceNew: true,
    });

    active.session.status = "awaiting_revive";
    active.session.reviveCount = 1;

    const fee = currentReviveFee(active);
    expect(fee).toBeGreaterThan(0);
    expect(fee).not.toBe(Infinity);

    const revived = reviveJourney(active.seed.journeyId, { demoPaid: true });
    expect(revived.session.status).toBe("active");
    expect(revived.session.reviveCount).toBe(2);
  });

  it("abandons a journey and builds a permadeath result", () => {
    const active = startJourney({ playerId: `abandon_${Date.now()}`, levelScore: 10 });
    const result = abandonJourney(active.seed.journeyId);
    expect(result.survived).toBe(false);
    expect(result.resultHash).toHaveLength(64);
  });
});
