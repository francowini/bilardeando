import { prisma } from "@/lib/db";
import type { MatchdayStatus } from "@/generated/prisma/client";
import finalScoresJson from "@/mock-data/match-final-scores.json";

const finalScores = finalScoresJson.scores as Record<
  string,
  { homeScore: number; awayScore: number }
>;

// ── Get current matchday ──

export async function getCurrentMatchday() {
  // Find the most recent non-RESULTS matchday, or the latest RESULTS if all are done
  const active = await prisma.matchday.findFirst({
    where: { status: { not: "RESULTS" } },
    orderBy: { startDate: "asc" },
    include: {
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true, logo: true } },
          awayTeam: { select: { id: true, name: true, logo: true } },
        },
        orderBy: { kickoff: "asc" },
      },
    },
  });

  if (active) return active;

  // All matchdays are RESULTS — return the latest
  return prisma.matchday.findFirst({
    orderBy: { startDate: "desc" },
    include: {
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true, logo: true } },
          awayTeam: { select: { id: true, name: true, logo: true } },
        },
        orderBy: { kickoff: "asc" },
      },
    },
  });
}

// ── Get matchday by ID ──

export async function getMatchdayById(id: number) {
  return prisma.matchday.findUnique({
    where: { id },
    include: {
      matches: {
        include: {
          homeTeam: { select: { id: true, name: true, logo: true } },
          awayTeam: { select: { id: true, name: true, logo: true } },
          playerMatchStats: {
            include: {
              player: {
                select: { id: true, name: true, position: true, team: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { kickoff: "asc" },
      },
    },
  });
}

// ── Get all matchdays ──

export async function getAllMatchdays() {
  return prisma.matchday.findMany({
    orderBy: { startDate: "asc" },
    include: {
      _count: { select: { matches: true } },
    },
  });
}

// ── Check if squad modifications are locked ──
// Returns the locked matchday status if locked, or null if changes are allowed

export async function isMatchdayLocked(): Promise<{
  locked: boolean;
  status: string | null;
  matchdayName: string | null;
}> {
  const current = await prisma.matchday.findFirst({
    where: { status: { not: "RESULTS" } },
    orderBy: { startDate: "asc" },
    select: { status: true, name: true },
  });

  if (!current) {
    // All matchdays are RESULTS — squad is locked
    const latest = await prisma.matchday.findFirst({
      orderBy: { startDate: "desc" },
      select: { status: true, name: true },
    });
    if (latest) {
      return { locked: true, status: latest.status, matchdayName: latest.name };
    }
    // No matchdays at all — allow changes
    return { locked: false, status: null, matchdayName: null };
  }

  const lockedStatuses = ["LOCK", "LIVE"];
  if (lockedStatuses.includes(current.status)) {
    return { locked: true, status: current.status, matchdayName: current.name };
  }

  return { locked: false, status: current.status, matchdayName: current.name };
}

// ── Advance matchday status (for simulation) ──

export async function advanceMatchdayStatus(
  matchdayId: number,
  newStatus: MatchdayStatus,
) {
  const matchday = await prisma.matchday.findUnique({
    where: { id: matchdayId },
    include: { matches: { orderBy: { kickoff: "asc" } } },
  });
  if (!matchday) return { error: "Fecha no encontrada" };

  // Valid transitions
  const validTransitions: Record<string, string[]> = {
    OPEN: ["LOCK"],
    LOCK: ["LIVE"],
    LIVE: ["RESULTS"],
    RESULTS: [],
  };

  if (!validTransitions[matchday.status]?.includes(newStatus)) {
    return {
      error: `No se puede pasar de ${matchday.status} a ${newStatus}`,
    };
  }

  // Update matchday status
  await prisma.matchday.update({
    where: { id: matchdayId },
    data: { status: newStatus },
  });

  // Handle match transitions
  if (newStatus === "LIVE") {
    // Split matches into FINISHED (~half), LIVE (~some), SCHEDULED (rest)
    // This makes the demo more realistic — mid-matchday with mixed states
    const scheduledMatches = matchday.matches.filter(
      (m) => m.status === "SCHEDULED",
    );
    const total = scheduledMatches.length;
    const finishedCount = Math.ceil(total * 0.5); // ~half finished
    const liveCount = Math.min(4, total - finishedCount); // up to 4 live
    // rest stay SCHEDULED

    const toFinish = scheduledMatches.slice(0, finishedCount);
    const toLive = scheduledMatches.slice(finishedCount, finishedCount + liveCount);

    // Mark matches as FINISHED with final scores
    for (const match of toFinish) {
      const fs = finalScores[String(match.id)];
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "FINISHED",
          homeScore: fs?.homeScore ?? Math.floor(Math.random() * 4),
          awayScore: fs?.awayScore ?? Math.floor(Math.random() * 4),
        },
      });
    }

    // Generate player stats for finished matches so points can be calculated
    await generateMissingPlayerStats(toFinish.map((m) => m.id));

    // Mark some matches as LIVE with partial scores
    for (const match of toLive) {
      const fs = finalScores[String(match.id)];
      const homeScore = fs
        ? Math.min(fs.homeScore, Math.max(1, Math.floor(fs.homeScore * 0.6)))
        : Math.floor(Math.random() * 3);
      const awayScore = fs
        ? Math.min(fs.awayScore, Math.max(0, Math.floor(fs.awayScore * 0.5)))
        : Math.floor(Math.random() * 3);

      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "LIVE",
          homeScore,
          awayScore,
        },
      });
    }
  }

  if (newStatus === "RESULTS") {
    // Mark all matches as FINISHED with final scores
    for (const match of matchday.matches) {
      const fs = finalScores[String(match.id)];
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "FINISHED",
          homeScore: fs?.homeScore ?? match.homeScore,
          awayScore: fs?.awayScore ?? match.awayScore,
        },
      });
    }

    // Generate PlayerMatchStats for all players in these matches (if not already present)
    await generateMissingPlayerStats(matchday.matches.map((m) => m.id));
  }

  return { success: true };
}

// ── Create next matchday dynamically ──

export async function createNextMatchday() {
  // Find the latest matchday to determine the next number and dates
  const lastMatchday = await prisma.matchday.findFirst({
    orderBy: { startDate: "desc" },
  });

  const nextNumber = lastMatchday
    ? parseInt(lastMatchday.name.replace("Fecha ", ""), 10) + 1
    : 1;
  const nextStart = lastMatchday
    ? new Date(lastMatchday.startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date();
  const nextEnd = new Date(nextStart.getTime() + 5 * 60 * 60 * 1000);

  // Create the matchday
  const newMatchday = await prisma.matchday.create({
    data: {
      name: `Fecha ${nextNumber}`,
      status: "OPEN",
      startDate: nextStart,
      endDate: nextEnd,
    },
  });

  // Get all teams and create random pairings (14 matches = 28 teams)
  const teams = await prisma.team.findMany({ select: { id: true } });
  const shuffled = teams.sort(() => Math.random() - 0.5);
  const matchCount = Math.min(14, Math.floor(shuffled.length / 2));

  for (let i = 0; i < matchCount; i++) {
    const homeTeam = shuffled[i * 2];
    const awayTeam = shuffled[i * 2 + 1];
    // Stagger kickoff times across the date
    const kickoff = new Date(nextStart.getTime() + i * 30 * 60 * 1000);

    await prisma.match.create({
      data: {
        homeScore: 0,
        awayScore: 0,
        status: "SCHEDULED",
        kickoff,
        matchday: { connect: { id: newMatchday.id } },
        homeTeam: { connect: { id: homeTeam.id } },
        awayTeam: { connect: { id: awayTeam.id } },
      },
    });
  }

  return newMatchday;
}

// ── Generate simulated stats for players who don't have them ──

async function generateMissingPlayerStats(matchIds: number[]) {
  for (const matchId of matchIds) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (!match) continue;

    // Get all players from both teams
    const players = await prisma.player.findMany({
      where: {
        teamId: { in: [match.homeTeamId, match.awayTeamId] },
      },
      select: { id: true },
    });

    // Check which already have stats for this match
    const existingStats = await prisma.playerMatchStat.findMany({
      where: { matchId },
      select: { playerId: true },
    });
    const existingPlayerIds = new Set(existingStats.map((s) => s.playerId));

    // Create stats for missing players
    const missing = players.filter((p) => !existingPlayerIds.has(p.id));
    for (const player of missing) {
      // Generate realistic rating between 4.0 and 9.5
      const rating = Math.round((4 + Math.random() * 5.5) * 10) / 10;
      const minutesPlayed = Math.random() > 0.15 ? 90 : Math.floor(Math.random() * 70) + 20;
      const goals = Math.random() > 0.85 ? Math.floor(Math.random() * 2) + 1 : 0;
      const assists = Math.random() > 0.8 ? 1 : 0;
      const yellowCards = Math.random() > 0.8 ? 1 : 0;

      await prisma.playerMatchStat.create({
        data: {
          rating,
          minutesPlayed,
          goals,
          assists,
          yellowCards,
          redCards: 0,
          saves: 0,
          player: { connect: { id: player.id } },
          match: { connect: { id: matchId } },
        },
      });
    }
  }
}
