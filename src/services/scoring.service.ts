import { prisma } from "@/lib/db";

// ── Calculate player points from match rating ──

export function calculatePlayerPoints(rating: number): number {
  // The rating from the stats API (0-10) IS the fantasy score
  return rating;
}

// ── Apply multiplier based on role ──

export function applyMultiplier(
  rawPoints: number,
  isStarter: boolean,
  isCaptain: boolean,
): number {
  if (isCaptain) return rawPoints * 2;
  if (isStarter) return rawPoints * 1;
  return rawPoints * 0.5; // bench
}

// ── Get multiplier value for display ──

export function getMultiplier(
  isStarter: boolean,
  isCaptain: boolean,
): number {
  if (isCaptain) return 2;
  if (isStarter) return 1;
  return 0.5;
}

// ── Calculate total squad points for a matchday ──

export async function calculateSquadPoints(
  userId: string,
  matchdayId: number,
) {
  // Get user's squad
  const squad = await prisma.squad.findFirst({
    where: { userId },
    include: {
      squadPlayers: {
        include: {
          player: {
            include: {
              team: { select: { name: true } },
              playerMatchStats: {
                where: { match: { matchdayId } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!squad) return null;

  const playerPoints = squad.squadPlayers.map((sp) => {
    // Get the match stat for this matchday
    const stat = sp.player.playerMatchStats[0];
    const rawPoints = stat ? calculatePlayerPoints(stat.rating) : 0;
    const multiplier = getMultiplier(sp.isStarter, sp.isCaptain);
    const finalPoints = stat ? applyMultiplier(rawPoints, sp.isStarter, sp.isCaptain) : 0;

    return {
      playerId: sp.player.id,
      playerName: sp.player.name,
      position: sp.player.position,
      teamName: sp.player.team.name,
      rawPoints,
      multiplier,
      finalPoints,
      isStarter: sp.isStarter,
      isCaptain: sp.isCaptain,
      isCaptainSub: sp.isCaptainSub,
      played: !!stat,
    };
  });

  const totalPoints = playerPoints.reduce((sum, p) => sum + p.finalPoints, 0);

  return {
    squadId: squad.id,
    matchdayId,
    totalPoints,
    playerPoints,
  };
}

// ── Save squad points to DB (called during simulation) ──

export async function persistSquadPoints(
  userId: string,
  matchdayId: number,
) {
  const result = await calculateSquadPoints(userId, matchdayId);
  if (!result) return null;

  // Upsert MatchdayPoints
  const mdPoints = await prisma.matchdayPoints.upsert({
    where: {
      userId_matchdayId: { userId, matchdayId },
    },
    create: {
      userId,
      matchdayId,
      totalPoints: result.totalPoints,
    },
    update: {
      totalPoints: result.totalPoints,
    },
  });

  // Delete existing player points for this matchday
  await prisma.squadPlayerPoints.deleteMany({
    where: { matchdayPointsId: mdPoints.id },
  });

  // Create player points
  for (const pp of result.playerPoints) {
    await prisma.squadPlayerPoints.create({
      data: {
        rawPoints: pp.rawPoints,
        multiplier: pp.multiplier,
        finalPoints: pp.finalPoints,
        matchdayPointsId: mdPoints.id,
        squadId: result.squadId,
        playerId: pp.playerId,
      },
    });
  }

  return { totalPoints: result.totalPoints, playerCount: result.playerPoints.length };
}

// ── Calculate points for ALL users (called during simulation) ──

export async function calculateAllUsersPoints(matchdayId: number) {
  const users = await prisma.user.findMany({
    where: {
      squads: { some: {} },
    },
    select: { id: true },
  });

  const results = [];
  for (const user of users) {
    const result = await persistSquadPoints(user.id, matchdayId);
    if (result) {
      results.push({ userId: user.id, ...result });
    }
  }

  return results;
}
