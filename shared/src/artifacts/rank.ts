import type { ArtifactDefinition, ArtifactRank } from "../types.js";

export const RANK_META: Record<
  ArtifactRank,
  { tier: number; relativeDropShare: string; modifierRange: string; border: string }
> = {
  common: { tier: 1, relativeDropShare: "~50%", modifierRange: "±5–10%", border: "#9ca3af" },
  uncommon: { tier: 2, relativeDropShare: "~30%", modifierRange: "±10–20%", border: "#22c55e" },
  rare: { tier: 3, relativeDropShare: "~12%", modifierRange: "±15–30%", border: "#3b82f6" },
  epic: { tier: 4, relativeDropShare: "~6%", modifierRange: "±25–40%", border: "#a855f7" },
  legendary: { tier: 5, relativeDropShare: "~2%", modifierRange: "±35–50%+", border: "#eab308" },
};

/** Multi-axis rank score so V1 isn't "always equip biggest number". */
export function scoreArtifactAxes(def: ArtifactDefinition): {
  power: number;
  specialization: number;
  rarity: number;
  situationalFit: number;
} {
  const power = Math.min(
    100,
    Math.abs(def.survivalModifier) * 160 + def.stats.power * 0.45,
  );
  const specialization =
    def.modifierType === "general_survival"
      ? 20 + def.stats.focus * 0.15
      : def.modifierType === "resource_boost"
        ? 55
        : 70 + def.stats.focus * 0.2;
  const rarity = (6 - def.rankTier) * 15 + (1 - Math.min(1, def.dropWeight / 0.3)) * 25;
  const situationalFit =
    def.minJourneyZone * 18 + (def.reviveDiscount > 0 ? 15 : 0) + def.stats.luck * 0.1;
  return {
    power: Number(power.toFixed(1)),
    specialization: Number(Math.min(100, specialization).toFixed(1)),
    rarity: Number(rarity.toFixed(1)),
    situationalFit: Number(situationalFit.toFixed(1)),
  };
}
