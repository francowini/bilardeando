import { prisma } from "@/lib/db";
import type { MatchdayStatus } from "@/generated/prisma/client";

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

  await prisma.matchday.update({
    where: { id: matchdayId },
    data: { status: newStatus },
  });

  // If transitioning to RESULTS, also mark all matches as FINISHED
  if (newStatus === "RESULTS") {
    await prisma.match.updateMany({
      where: { matchdayId },
      data: { status: "FINISHED" },
    });
  }

  return { success: true };
}
