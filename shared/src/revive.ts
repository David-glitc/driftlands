/**
 * Revive fee escalates per revive within a journey.
 * Default multipliers: 1×, 2.5×, 6× — hard cap 3 revives.
 */

export function reviveFeeFor(
  reviveCount: number,
  baseFee: number,
  multipliers: number[],
): number {
  if (reviveCount < 0 || reviveCount >= multipliers.length) {
    throw new Error(`Revive index ${reviveCount} exceeds configured multipliers`);
  }
  return Number((baseFee * multipliers[reviveCount]!).toFixed(6));
}

export function canRevive(
  reviveCount: number,
  maxRevives: number,
): boolean {
  return reviveCount < maxRevives;
}

/** Apply artifact revive discounts (stacked, capped at 50%). */
export function applyReviveDiscount(
  fee: number,
  discounts: number[],
): number {
  const total = Math.min(0.5, discounts.reduce((a, b) => a + b, 0));
  return Number((fee * (1 - total)).toFixed(6));
}
