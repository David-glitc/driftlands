/** Driftlands — Progression, Streaks, Achievements, Ranks, Cosmetics */

/* ── WAYFARER RANKS ── */

export interface WayfarerRank {
  name: string;
  tier: number;
  xpRequired: number;
  statBonus: number;
  cloakColor: string;
  badge: string;
}

export const RANKS: WayfarerRank[] = [
  { name: "Novice", tier: 0, xpRequired: 0, statBonus: 0, cloakColor: "#7a8a9a", badge: "○" },
  { name: "Wanderer", tier: 1, xpRequired: 100, statBonus: 0.02, cloakColor: "#4ade80", badge: "◈" },
  { name: "Pathfinder", tier: 2, xpRequired: 350, statBonus: 0.04, cloakColor: "#60a5fa", badge: "◆" },
  { name: "Anchor-Bound", tier: 3, xpRequired: 800, statBonus: 0.07, cloakColor: "#c084fc", badge: "⬡" },
  { name: "Drift Lord", tier: 4, xpRequired: 1800, statBonus: 0.12, cloakColor: "#fbbf24", badge: "★" },
];

export function rankForXp(xp: number): WayfarerRank {
  let current = RANKS[0]!;
  for (const r of RANKS) {
    if (xp >= r.xpRequired) current = r;
  }
  return current;
}

export function xpToNextRank(xp: number): { current: WayfarerRank; next: WayfarerRank | null; progress: number } {
  const current = rankForXp(xp);
  const nextIdx = RANKS.indexOf(current) + 1;
  const next = nextIdx < RANKS.length ? RANKS[nextIdx]! : null;
  const progress = next
    ? Math.min(1, (xp - current.xpRequired) / (next.xpRequired - current.xpRequired))
    : 1;
  return { current, next, progress };
}

/* ── DAILY STREAKS ── */

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastLogin: number;
  multiplier: number;
}

export function computeStreak(prev: StreakState): StreakState {
  const now = Date.now();
  const msInDay = 86400000;
  const daysSinceLast = (now - prev.lastLogin) / msInDay;

  if (daysSinceLast < 1) {
    return prev;
  }
  if (daysSinceLast > 1.5) {
    return { currentStreak: 1, longestStreak: prev.longestStreak, lastLogin: now, multiplier: 1 };
  }

  const newStreak = prev.currentStreak + 1;
  const multiplier = 1 + Math.min(newStreak * 0.05, 0.5);
  return {
    currentStreak: newStreak,
    longestStreak: Math.max(prev.longestStreak, newStreak),
    lastLogin: now,
    multiplier,
  };
}

export function streakReward(streak: number): string {
  if (streak >= 30) return "30-day Legend: +50% Dust, golden trail unlocked";
  if (streak >= 14) return "14-day Anchor: +35% Dust, epic cloak tint";
  if (streak >= 7) return "7-day Pathfinder: +20% Dust, rare trail";
  if (streak >= 3) return "3-day Wanderer: +10% Dust";
  return `${streak}-day streak: +${Math.round((Math.min(streak * 0.05, 0.5)) * 100)}% Dust`;
}

/* ── ACHIEVEMENTS ── */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "journey" | "collection" | "social" | "streak" | "mastery";
  hidden?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_steps", name: "First Steps", description: "Complete your first journey", icon: "👣", category: "journey" },
  { id: "survivor_5", name: "Seasoned Survivor", description: "Survive 5 journeys", icon: "🏜️", category: "journey" },
  { id: "survivor_20", name: "Dune Veteran", description: "Survive 20 journeys", icon: "⛰️", category: "journey" },
  { id: "phoenix", name: "Phoenix", description: "Revive 3 times in one journey and survive", icon: "🔥", category: "journey" },
  { id: "deathless", name: "Untouchable", description: "Complete a hard journey with zero deaths", icon: "🛡️", category: "journey" },
  { id: "speed_demon", name: "Speed Demon", description: "Complete a journey in under 6 nodes", icon: "⚡", category: "journey" },
  { id: "zones_100", name: "Century Walk", description: "Traverse 100 zones total", icon: "🛤️", category: "journey" },
  { id: "common_full", name: "Common Wealth", description: "Collect all common artifacts", icon: "🔹", category: "collection" },
  { id: "rare_hunter", name: "Rare Hunter", description: "Collect 3 rare or higher artifacts", icon: "💎", category: "collection" },
  { id: "legendary", name: "Legend Seeker", description: "Find a legendary artifact", icon: "⭐", category: "collection" },
  { id: "full_codex", name: "The Completed Codex", description: "Collect all 14 artifacts", icon: "📖", category: "collection", hidden: true },
  { id: "dust_hoarder", name: "Dust Hoarder", description: "Accumulate 1000 Drift Dust", icon: "💰", category: "collection" },
  { id: "dust_lord", name: "Dust Lord", description: "Accumulate 5000 Drift Dust", icon: "👑", category: "collection" },
  { id: "social_5", name: "Party Drifter", description: "Play in 5 multiplayer rooms", icon: "👥", category: "social" },
  { id: "streak_3", name: "Consistent", description: "Maintain a 3-day login streak", icon: "📅", category: "streak" },
  { id: "streak_7", name: "Devoted", description: "Maintain a 7-day login streak", icon: "🔥", category: "streak" },
  { id: "streak_30", name: "Unshakable", description: "Maintain a 30-day login streak", icon: "☀️", category: "streak" },
  { id: "npc_all", name: "Social Network", description: "Meet all 6 NPCs", icon: "🗣️", category: "mastery" },
  { id: "lore_full", name: "Lore Master", description: "Unlock all 6 lore entries", icon: "📜", category: "mastery" },
  { id: "rank_drift_lord", name: "Drift Lord", description: "Reach Drift Lord rank", icon: "★", category: "mastery" },
];

/* ── PROFILE ── */

export interface WandererProfile {
  playerId: string;
  displayName: string;
  xp: number;
  rank: WayfarerRank;
  reputation: number;
  journeysCompleted: number;
  journeysSurvived: number;
  totalZones: number;
  totalRevives: number;
  streak: StreakState;
  badges: string[];
  artifactCount: number;
  totalArtifacts: number;
  loreUnlocked: number;
  totalLore: number;
  npcsMet: number;
  totalNpcs: number;
  createdAt: number;
  lastActive: number;
}

/* ── COSMETICS ── */

export interface Cosmetic {
  id: string;
  name: string;
  type: "cloak" | "trail" | "accessory" | "backpack";
  color: string;
  unlockCondition: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const COSMETICS: Cosmetic[] = [
  { id: "cloak_novice", name: "Novice Grey", type: "cloak", color: "#7a8a9a", unlockCondition: "Default", rarity: "common" },
  { id: "cloak_wanderer", name: "Wanderer Green", type: "cloak", color: "#4ade80", unlockCondition: "Reach Wanderer rank", rarity: "common" },
  { id: "cloak_pathfinder", name: "Pathfinder Blue", type: "cloak", color: "#60a5fa", unlockCondition: "Reach Pathfinder rank", rarity: "rare" },
  { id: "cloak_anchor", name: "Anchor-Bound Purple", type: "cloak", color: "#c084fc", unlockCondition: "Reach Anchor-Bound rank", rarity: "epic" },
  { id: "cloak_lord", name: "Drift Lord Gold", type: "cloak", color: "#fbbf24", unlockCondition: "Reach Drift Lord rank", rarity: "legendary" },
  { id: "trail_dust", name: "Dust Trail", type: "trail", color: "#ffd166", unlockCondition: "3-day streak", rarity: "common" },
  { id: "trail_ember", name: "Ember Wake", type: "trail", color: "#ff6b4a", unlockCondition: "Find legendary artifact", rarity: "rare" },
  { id: "trail_golden", name: "Golden Path", type: "trail", color: "#fbbf24", unlockCondition: "30-day streak", rarity: "legendary" },
  { id: "acc_goggles", name: "Dune Goggles", type: "accessory", color: "#5CDBF0", unlockCondition: "Complete 5 journeys", rarity: "common" },
  { id: "acc_crown", name: "Dust Crown", type: "accessory", color: "#ffd166", unlockCondition: "Dust Lord achievement", rarity: "legendary" },
  { id: "bp_survival", name: "Survival Pack", type: "backpack", color: "#3DDC97", unlockCondition: "Complete hard zero-death", rarity: "epic" },
  { id: "bp_collector", name: "Collector's Satchel", type: "backpack", color: "#fbbf24", unlockCondition: "Collect 10+ artifacts", rarity: "rare" },
];
