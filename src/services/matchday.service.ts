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
    // Mark first 2 matches as LIVE with partial scores (simulating matches in progress)
    const scheduledMatches = matchday.matches.filter(
      (m) => m.status === "SCHEDULED",
    );
    const toLive = scheduledMatches.slice(0, 2);

    for (const match of toLive) {
      // Use final scores or generate partial scores for LIVE matches
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
  }

  return { success: true };
}
