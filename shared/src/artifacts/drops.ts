import type { ArtifactDefinition, EquippedArtifact, HazardKind } from "../types.js";
import { ARTIFACT_DEFINITIONS } from "./catalog.js";

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function modifierMatchesHazard(
  modifierType: ArtifactDefinition["modifierType"],
  hazard: HazardKind,
): boolean {
  if (modifierType === "general_survival" || modifierType === "revive_discount") return true;
  if (modifierType === "resource_boost") return hazard === "cache";
  if (modifierType === "storm_resist") return hazard === "storm";
  if (modifierType === "ambush_resist") return hazard === "ambush";
  if (modifierType === "fire_hazard_resist") return hazard === "fire";
  return false;
}

/** Weighted random drop gated by zone. */
export function rollArtifactDrop(
  zone: number,
  seed: number,
  catalog: ArtifactDefinition[] = ARTIFACT_DEFINITIONS,
): EquippedArtifact | undefined {
  const eligible = catalog.filter((a) => a.minJourneyZone <= zone);
  if (eligible.length === 0) return undefined;

  const rand = mulberry32(seed);
  // ~55% chance of any drop at a cache/hazard resolve
  if (rand() > 0.55) return undefined;

  const totalWeight = eligible.reduce((s, a) => s + a.dropWeight, 0);
  let pick = rand() * totalWeight;
  for (const artifact of eligible) {
    pick -= artifact.dropWeight;
    if (pick <= 0) {
      return {
        artifactId: artifact.artifactId,
        instanceId: `${artifact.artifactId}_${seed}_${zone}`,
        acquiredAtZone: zone,
      };
    }
  }
  const last = eligible[eligible.length - 1]!;
  return {
    artifactId: last.artifactId,
    instanceId: `${last.artifactId}_${seed}_${zone}`,
    acquiredAtZone: zone,
  };
}

/** Sum survival modifiers that apply to the current hazard. */
export function sumItemBonus(
  inventory: EquippedArtifact[],
  hazard: HazardKind,
  catalog: ArtifactDefinition[] = ARTIFACT_DEFINITIONS,
): number {
  let bonus = 0;
  for (const item of inventory) {
    const def = catalog.find((a) => a.artifactId === item.artifactId);
    if (!def) continue;
    if (modifierMatchesHazard(def.modifierType, hazard)) {
      bonus += def.survivalModifier;
    }
  }
  return Number(bonus.toFixed(4));
}
