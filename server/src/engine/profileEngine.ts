import {
  type WandererProfile,
  type StreakState,
  type Achievement,
  RANKS,
  ACHIEVEMENTS,
  COSMETICS,
  rankForXp,
  computeStreak,
} from "@driftlands/shared";

const profiles = new Map<string, WandererProfile>();

function defaultProfile(playerId: string): WandererProfile {
  return {
    playerId,
    displayName: playerId.slice(0, 12),
    xp: 0,
    rank: RANKS[0]!,
    reputation: 0,
    journeysCompleted: 0,
    journeysSurvived: 0,
    totalZones: 0,
    totalRevives: 0,
    streak: { currentStreak: 0, longestStreak: 0, lastLogin: 0, multiplier: 1 },
    badges: [],
    artifactCount: 0,
    totalArtifacts: 14,
    loreUnlocked: 0,
    totalLore: 6,
    npcsMet: 0,
    totalNpcs: 6,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };
}

export function getProfile(playerId: string): WandererProfile {
  if (!profiles.has(playerId)) {
    profiles.set(playerId, defaultProfile(playerId));
  }
  return profiles.get(playerId)!;
}

export function loginStreak(playerId: string): { streak: StreakState; reward: string } {
  const profile = getProfile(playerId);
  const result = computeStreak(profile.streak);
  profile.streak = result;
  profile.lastActive = Date.now();

  return {
    streak: result,
    reward: result.multiplier > 1 ? `+${Math.round((result.multiplier - 1) * 100)}% Dust bonus today` : "Streak started!",
  };
}

export function awardJourneyXp(playerId: string, survived: boolean, zonesReached: number, reviveCount: number): number {
  const profile = getProfile(playerId);
  let xp = zonesReached * 5;
  if (survived) xp += 50;
  if (reviveCount === 0) xp += 20;
  if (reviveCount === 3 && survived) xp += 30;

  profile.xp += xp;
  profile.journeysCompleted += 1;
  if (survived) profile.journeysSurvived += 1;
  profile.totalZones += zonesReached;
  profile.totalRevives += reviveCount;
  profile.lastActive = Date.now();

  const newRank = rankForXp(profile.xp);
  profile.rank = newRank;

  checkAchievements(profile);

  return xp;
}

function checkAchievements(profile: WandererProfile): string[] {
  const newlyUnlocked: string[] = [];

  const checks: Array<[string, () => boolean]> = [
    ["first_steps", () => profile.journeysCompleted >= 1],
    ["survivor_5", () => profile.journeysSurvived >= 5],
    ["survivor_20", () => profile.journeysSurvived >= 20],
    ["zones_100", () => profile.totalZones >= 100],
    ["streak_3", () => profile.streak.currentStreak >= 3],
    ["streak_7", () => profile.streak.currentStreak >= 7],
    ["streak_30", () => profile.streak.currentStreak >= 30],
    ["npc_all", () => profile.npcsMet >= 6],
    ["lore_full", () => profile.loreUnlocked >= 6],
    ["rank_drift_lord", () => profile.rank.tier >= 4],
    ["dust_hoarder", () => false], // checked separately
    ["dust_lord", () => false],
    ["legendary", () => false],
    ["full_codex", () => profile.artifactCount >= 14],
    ["social_5", () => false],
  ];

  for (const [id, check] of checks) {
    if (!profile.badges.includes(id) && check()) {
      profile.badges.push(id);
      newlyUnlocked.push(id);
    }
  }

  return newlyUnlocked;
}

export function recordArtifactFound(playerId: string): void {
  const profile = getProfile(playerId);
  profile.artifactCount += 1;
  checkAchievements(profile);
}

export function recordNpcMet(playerId: string): void {
  const profile = getProfile(playerId);
  if (profile.npcsMet < 6) {
    profile.npcsMet += 1;
    checkAchievements(profile);
  }
}

export function recordLoreUnlocked(playerId: string): void {
  const profile = getProfile(playerId);
  if (profile.loreUnlocked < 6) {
    profile.loreUnlocked += 1;
    checkAchievements(profile);
  }
}

export function getBadgeInfo(badgeId: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === badgeId);
}

export function unlockedCosmetics(profile: WandererProfile): string[] {
  const unlocked: string[] = [];
  for (const c of COSMETICS) {
    if (profile.badges.includes(c.id) || profile.rank.tier >= 1) {
      unlocked.push(c.id);
    }
  }
  // Always unlock cloak matching current rank
  const rankCloak = COSMETICS.find((c) => c.name === profile.rank.name + " Grey") ??
    COSMETICS.find((c) => c.id.includes(profile.rank.name.toLowerCase()));
  if (rankCloak && !unlocked.includes(rankCloak.id)) {
    unlocked.push(rankCloak.id);
  }
  return [...new Set(unlocked)];
}
