import { BALANCING } from "../config/balancing.js";
import type { ArtifactDefinition, ArtifactStats, EquippedArtifact, HazardKind } from "../types.js";
import { ARTIFACT_DEFINITIONS } from "./catalog.js";
import { sumItemBonus } from "./drops.js";

const EMPTY_STATS: ArtifactStats = {
  power: 0,
  vitality: 0,
  focus: 0,
  luck: 0,
  weight: 0,
};

/** Aggregate loadout stats across equipped inventory. */
export function sumInventoryStats(
  inventory: EquippedArtifact[],
  catalog: ArtifactDefinition[] = ARTIFACT_DEFINITIONS,
): ArtifactStats {
  const totals = { ...EMPTY_STATS };
  for (const item of inventory) {
    const def = catalog.find((a) => a.artifactId === item.artifactId);
    if (!def) continue;
    totals.power += def.stats.power;
    totals.vitality += def.stats.vitality;
    totals.focus += def.stats.focus;
    totals.luck += def.stats.luck;
    totals.weight += def.stats.weight;
  }
  return {
    power: Number(totals.power.toFixed(1)),
    vitality: Number(totals.vitality.toFixed(1)),
    focus: Number(totals.focus.toFixed(1)),
    luck: Number(totals.luck.toFixed(1)),
    weight: Number(totals.weight.toFixed(1)),
  };
}

/**
 * Combat bridge: hazard-matched modifiers + capped vitality/focus stats − weight soft-cap.
 * Still meant to feed `computeSurvivalChance` (which clamps 0.05–0.95).
 */
export function effectiveSurvivalBonus(
  inventory: EquippedArtifact[],
  hazard: HazardKind,
  catalog: ArtifactDefinition[] = ARTIFACT_DEFINITIONS,
): number {
  const cfg = BALANCING.artifacts;
  const base = sumItemBonus(inventory, hazard, catalog);
  const stats = sumInventoryStats(inventory, catalog);

  let bonus = base + stats.vitality * cfg.vitality_to_bonus;

  const specialized = inventory.some((item) => {
    const def = catalog.find((a) => a.artifactId === item.artifactId);
    if (!def) return false;
    if (def.modifierType === "general_survival" || def.modifierType === "revive_discount") return false;
    if (def.modifierType === "resource_boost") return hazard === "cache";
    if (def.modifierType === "storm_resist") return hazard === "storm";
    if (def.modifierType === "ambush_resist") return hazard === "ambush";
    if (def.modifierType === "fire_hazard_resist") return hazard === "fire";
    return false;
  });
  if (specialized) {
    bonus += stats.focus * cfg.focus_to_bonus;
  }

  if (stats.weight > cfg.weight_soft_cap) {
    const excess = stats.weight - cfg.weight_soft_cap;
    bonus -= Math.min(cfg.max_weight_penalty, excess * cfg.weight_penalty_per_point);
  }

  bonus = Math.min(cfg.max_item_bonus, Math.max(0, bonus));
  return Number(bonus.toFixed(4));
}

/** Top N artifacts by rank tier then power — for belt / 3D attach slots. */
export function topEquippedForBelt(
  inventory: EquippedArtifact[],
  limit = 4,
  catalog: ArtifactDefinition[] = ARTIFACT_DEFINITIONS,
): EquippedArtifact[] {
  return [...inventory]
    .map((item) => {
      const def = catalog.find((a) => a.artifactId === item.artifactId);
      return { item, tier: def?.rankTier ?? 0, power: def?.stats.power ?? 0 };
    })
    .sort((a, b) => b.tier - a.tier || b.power - a.power)
    .slice(0, limit)
    .map((x) => x.item);
}
