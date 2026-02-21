import { prisma } from "@/lib/db";
import type { LeaderboardEntry } from "@/types";

export interface LeaderboardPage {
  data: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get the general tournament leaderboard.
 * Sums MatchdayPoints per user, ordered by total points descending.
 */
export async function getGeneralLeaderboard(
  page: number = 1,
  pageSize: number = 50,
): Promise<LeaderboardPage> {
  // Get all users who have matchday points
  const usersWithPoints = await prisma.user.findMany({
    where: {
      matchdayPoints: { some: {} },
    },
    select: {
      id: true,
      name: true,
      image: true,
      matchdayPoints: {
        select: {
          matchdayId: true,
          totalPoints: true,
        },
        orderBy: { matchdayId: "asc" },
      },
    },
  });

  // Calculate total points per user and sort
  const ranked = usersWithPoints
    .map((user) => {
      const totalPoints = user.matchdayPoints.reduce(
        (sum, mp) => sum + mp.totalPoints,
        0,
      );
      return {
        userId: user.id,
        userName: user.name ?? "Sin nombre",
        userImage: user.image,
        totalPoints: Math.round(totalPoints * 100) / 100,
        matchdayBreakdown: user.matchdayPoints.map((mp) => ({
          matchdayId: mp.matchdayId,
          points: Math.round(mp.totalPoints * 100) / 100,
        })),
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Add rank (handle ties)
  const withRank: LeaderboardEntry[] = ranked.map((entry, index) => ({
    ...entry,
    rank:
      index > 0 && ranked[index - 1].totalPoints === entry.totalPoints
        ? index // same rank as previous for ties
        : index + 1,
  }));

  // Paginate
  const total = withRank.length;
  const totalPages = Math.ceil(total / pageSize);
  const skip = (page - 1) * pageSize;
  const data = withRank.slice(skip, skip + pageSize);

  return { data, total, page, pageSize, totalPages };
}

/**
 * Get leaderboard scoped to a specific league's matchday range.
 */
export async function getLeagueLeaderboard(
  leagueId: number,
  page: number = 1,
  pageSize: number = 50,
): Promise<LeaderboardPage> {
  // Get league info for matchday range
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: {
      startMatchdayId: true,
      endMatchdayId: true,
      members: {
        where: { paid: true },
        select: { userId: true },
      },
    },
  });

  if (!league) {
    return { data: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const memberUserIds = league.members.map((m) => m.userId);

  // Get matchday points for league members within the league's matchday range
  const usersWithPoints = await prisma.user.findMany({
    where: {
      id: { in: memberUserIds },
    },
    select: {
      id: true,
      name: true,
      image: true,
      matchdayPoints: {
        where: {
          matchdayId: {
            gte: league.startMatchdayId,
            lte: league.endMatchdayId,
          },
        },
        select: {
          matchdayId: true,
          totalPoints: true,
        },
        orderBy: { matchdayId: "asc" },
      },
    },
  });

  const ranked = usersWithPoints
    .map((user) => {
      const totalPoints = user.matchdayPoints.reduce(
        (sum, mp) => sum + mp.totalPoints,
        0,
      );
      return {
        userId: user.id,
        userName: user.name ?? "Sin nombre",
        userImage: user.image,
        totalPoints: Math.round(totalPoints * 100) / 100,
        matchdayBreakdown: user.matchdayPoints.map((mp) => ({
          matchdayId: mp.matchdayId,
          points: Math.round(mp.totalPoints * 100) / 100,
        })),
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const withRank: LeaderboardEntry[] = ranked.map((entry, index) => ({
    ...entry,
    rank:
      index > 0 && ranked[index - 1].totalPoints === entry.totalPoints
        ? index
        : index + 1,
  }));

  const total = withRank.length;
  const totalPages = Math.ceil(total / pageSize);
  const skip = (page - 1) * pageSize;
  const data = withRank.slice(skip, skip + pageSize);

  return { data, total, page, pageSize, totalPages };
}
