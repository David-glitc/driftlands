import type { ArtifactDefinition, ArtifactRank } from "../types.js";

export const RANK_META: Record<
  ArtifactRank,
  { tier: number; relativeDropShare: string; modifierRange: string }
> = {
  common: { tier: 1, relativeDropShare: "~50%", modifierRange: "±5–10%" },
  uncommon: { tier: 2, relativeDropShare: "~30%", modifierRange: "±10–20%" },
  rare: { tier: 3, relativeDropShare: "~12%", modifierRange: "±15–30%" },
  epic: { tier: 4, relativeDropShare: "~6%", modifierRange: "±25–40%" },
  legendary: { tier: 5, relativeDropShare: "~2%", modifierRange: "±35–50%+" },
};

/** Multi-axis rank score so V1 isn't "always equip biggest number". */
export function scoreArtifactAxes(def: ArtifactDefinition): {
  power: number;
  specialization: number;
  rarity: number;
  situationalFit: number;
} {
  const power = Math.min(100, Math.abs(def.survivalModifier) * 200);
  const specialization =
    def.modifierType === "general_survival" ? 20 : def.modifierType === "resource_boost" ? 55 : 80;
  const rarity = (6 - def.rankTier) * 15 + (1 - Math.min(1, def.dropWeight / 0.3)) * 25;
  const situationalFit = def.minJourneyZone * 18 + (def.reviveDiscount > 0 ? 15 : 0);
  return {
    power: Number(power.toFixed(1)),
    specialization,
    rarity: Number(rarity.toFixed(1)),
    situationalFit: Number(situationalFit.toFixed(1)),
  };
}
