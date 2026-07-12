"use client";

import type { LevelStateView } from "@driftlands/shared";
import { BALANCING, computeLevelScore, durationMultiplierFor } from "@driftlands/shared";

const STORAGE_KEY = "dl_demo_stake";

export type DemoStakeDraft = {
  symbol: string;
  usdValue: number;
  durationSeconds: number;
};

export function loadDemoLevel(player: string): LevelStateView | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LevelStateView;
    if (!parsed || typeof parsed.levelScore !== "number") return null;
    return { ...parsed, player: player || parsed.player };
  } catch {
    return null;
  }
}

export function saveDemoLevel(view: LevelStateView): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(view));
}

export function clearDemoLevel(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function previewLevelScore(draft: DemoStakeDraft): LevelStateView {
  const asset = BALANCING.stake_assets.find((a) => a.symbol === draft.symbol) ?? BALANCING.stake_assets[0]!;
  const usd = Math.max(BALANCING.level.min_usd_stake, draft.usdValue);
  const durationMultiplier = durationMultiplierFor(
    draft.durationSeconds,
    BALANCING.level.duration_tiers.map((t) => ({
      minSeconds: t.min_seconds,
      multiplier: t.multiplier,
    })),
  );
  const tokenMultiplier = asset.token_multiplier;
  const levelScore = computeLevelScore({
    usdValueStaked: usd,
    durationMultiplier,
    tokenMultiplier,
  });
  return {
    player: "demo",
    usdValueStaked: usd,
    durationMultiplier,
    tokenMultiplier,
    levelScore,
    stakedAt: Date.now(),
  };
}

export const DURATION_PRESETS = [
  { label: "Flexible", seconds: 0 },
  { label: "1 day", seconds: 86_400 },
  { label: "7 days", seconds: 604_800 },
  { label: "30 days", seconds: 2_592_000 },
] as const;
