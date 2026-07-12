/**
 * Level Score = ln(USD_value_staked) × Duration_Multiplier × Token_Multiplier
 * Mirrors Conviction Weight pattern from ATOMIC/Krypton.
 */

export function computeLevelScore(params: {
  usdValueStaked: number;
  durationMultiplier: number;
  tokenMultiplier: number;
}): number {
  const { usdValueStaked, durationMultiplier, tokenMultiplier } = params;
  if (usdValueStaked <= 0) return 0;
  const base = Math.log(usdValueStaked);
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Number((base * durationMultiplier * tokenMultiplier).toFixed(4));
}

/** Early unstake decay: Level Score × remaining_fraction^decayPower */
export function applyUnstakeDecay(
  levelScore: number,
  elapsedSeconds: number,
  committedSeconds: number,
  decayPower = 1.5,
): number {
  if (committedSeconds <= 0) return levelScore;
  const fraction = Math.min(1, Math.max(0, elapsedSeconds / committedSeconds));
  return Number((levelScore * Math.pow(fraction, decayPower)).toFixed(4));
}

export function durationMultiplierFor(
  elapsedSeconds: number,
  tiers: Array<{ minSeconds: number; multiplier: number }>,
): number {
  const sorted = [...tiers].sort((a, b) => a.minSeconds - b.minSeconds);
  let mult = sorted[0]?.multiplier ?? 1;
  for (const tier of sorted) {
    if (elapsedSeconds >= tier.minSeconds) mult = tier.multiplier;
  }
  return mult;
}

/** Survival chance for a hazard roll (0–0.95 capped). */
export function computeSurvivalChance(params: {
  levelScore: number;
  itemBonus: number;
  difficulty: number;
}): number {
  const levelBonus = Math.min(0.35, params.levelScore / 100);
  const raw = 0.45 + levelBonus + params.itemBonus - params.difficulty * 0.08;
  return Math.max(0.05, Math.min(0.95, Number(raw.toFixed(4))));
}
