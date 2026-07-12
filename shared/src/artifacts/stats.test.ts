import { describe, expect, it } from "vitest";
import { ARTIFACT_DEFINITIONS, getArtifactById } from "./catalog.js";
import { effectiveSurvivalBonus, sumInventoryStats, topEquippedForBelt } from "./stats.js";
import type { EquippedArtifact } from "../types.js";

function eq(id: string, zone = 0): EquippedArtifact {
  return { artifactId: id, instanceId: `${id}_t`, acquiredAtZone: zone };
}

describe("sumInventoryStats", () => {
  it("sums stats across inventory", () => {
    const stats = sumInventoryStats([eq("armor_sunweave"), eq("food_cactus_nectar")]);
    expect(stats.vitality).toBeGreaterThan(20);
    expect(stats.weight).toBeGreaterThan(0);
  });
});

describe("effectiveSurvivalBonus", () => {
  it("applies fire resist on fire nodes", () => {
    const fire = effectiveSurvivalBonus([eq("charm_ember_ward")], "fire");
    const storm = effectiveSurvivalBonus([eq("charm_ember_ward")], "storm");
    expect(fire).toBeGreaterThan(storm);
  });

  it("caps stacked legendary loadouts", () => {
    const heavy = effectiveSurvivalBonus(
      [eq("charm_second_sun"), eq("armor_unbroken_oath"), eq("food_conviction_draught")],
      "ambush",
    );
    expect(heavy).toBeLessThanOrEqual(0.55);
  });

  it("applies weight soft-cap penalty when overloaded", () => {
    const light = effectiveSurvivalBonus([eq("charm_sand_token")], "storm");
    // Mirage plate is heavy; stack with second sun
    const heavy = effectiveSurvivalBonus(
      [eq("armor_mirage_plate"), eq("charm_second_sun"), eq("armor_unbroken_oath")],
      "ambush",
    );
    expect(getArtifactById("armor_mirage_plate")!.stats.weight).toBeGreaterThan(10);
    expect(heavy).toBeGreaterThan(light);
  });
});

describe("topEquippedForBelt", () => {
  it("returns at most 4 highest rank items", () => {
    const inv = ARTIFACT_DEFINITIONS.slice(0, 8).map((d, i) => eq(d.artifactId, i));
    const top = topEquippedForBelt(inv, 4);
    expect(top.length).toBe(4);
    const tiers = top.map((t) => getArtifactById(t.artifactId)!.rankTier);
    expect(tiers[0]).toBeGreaterThanOrEqual(tiers[3]!);
  });
});
