import { PrismaClient } from "@prisma/client";

/**
 * Single PrismaClient per process (prisma-client-setup skill).
 * Avoids connection exhaustion under Next/tsx watch reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function ensurePlayer(playerId: string, displayName?: string) {
  return prisma.player.upsert({
    where: { id: playerId },
    create: { id: playerId, displayName },
    update: displayName ? { displayName } : {},
  });
}

export async function persistJourneyStart(params: {
  journeyId: string;
  playerId: string;
  seed: number;
  difficulty: string;
  configVersion: string;
}) {
  await ensurePlayer(params.playerId);
  await prisma.journey.upsert({
    where: { id: params.journeyId },
    create: {
      id: params.journeyId,
      playerId: params.playerId,
      seed: params.seed,
      difficulty: params.difficulty,
      status: "active",
      configVersion: params.configVersion,
    },
    update: {
      status: "active",
      difficulty: params.difficulty,
    },
  });
}

export async function persistJourneyEnd(params: {
  journeyId: string;
  status: string;
  zoneReached: number;
  reviveCount: number;
  resultHash: string;
  inventoryJson: string;
  reputationDelta: number;
  playerId: string;
}) {
  await prisma.journey.update({
    where: { id: params.journeyId },
    data: {
      status: params.status,
      zoneReached: params.zoneReached,
      reviveCount: params.reviveCount,
      resultHash: params.resultHash,
      inventoryJson: params.inventoryJson,
      endedAt: new Date(),
    },
  });

  const player = await prisma.player.update({
    where: { id: params.playerId },
    data: { reputation: { increment: params.reputationDelta } },
  });

  await prisma.leaderboardEntry.upsert({
    where: { playerId: params.playerId },
    create: {
      playerId: params.playerId,
      reputation: player.reputation,
      journeysWon: params.status === "survived" ? 1 : 0,
    },
    update: {
      reputation: player.reputation,
      ...(params.status === "survived" ? { journeysWon: { increment: 1 } } : {}),
    },
  });
}

export async function topLeaderboard(limit = 20) {
  return prisma.leaderboardEntry.findMany({
    orderBy: { reputation: "desc" },
    take: limit,
    include: { player: true },
  });
}
