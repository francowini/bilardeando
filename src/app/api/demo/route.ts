import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import {
  getCurrentMatchday,
  getAllMatchdays,
  advanceMatchdayStatus,
} from "@/services/matchday.service";
import { calculateAllUsersPoints } from "@/services/scoring.service";

/**
 * GET /api/demo — get full demo state (matchdays, users, points)
 */
export async function GET() {
  const matchdays = await getAllMatchdays();
  const current = await getCurrentMatchday();

  // Get all users with their points
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      matchdayPoints: {
        select: {
          matchdayId: true,
          totalPoints: true,
          matchday: { select: { name: true } },
        },
        orderBy: { matchdayId: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const leaderboard = users
    .map((u) => ({
      name: u.name,
      email: u.email,
      totalPoints: u.matchdayPoints.reduce((s, mp) => s + mp.totalPoints, 0),
      breakdown: u.matchdayPoints.map((mp) => ({
        matchday: mp.matchday.name,
        points: Math.round(mp.totalPoints * 10) / 10,
      })),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return successResponse({
    currentMatchday: current
      ? {
          id: current.id,
          name: current.name,
          status: current.status,
          matchCount: current.matches.length,
          liveCount: current.matches.filter((m) => m.status === "LIVE").length,
          finishedCount: current.matches.filter((m) => m.status === "FINISHED").length,
          scheduledCount: current.matches.filter((m) => m.status === "SCHEDULED").length,
        }
      : null,
    allMatchdays: matchdays.map((md) => ({
      id: md.id,
      name: md.name,
      status: md.status,
      matchCount: md._count.matches,
    })),
    leaderboard,
  });
}

/**
 * POST /api/demo — advance simulation one step
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = (body as { action?: string }).action || "advance";

  if (action === "reset") {
    // Reset matchday 2 to OPEN and all its matches to SCHEDULED
    const matchday2 = await prisma.matchday.findFirst({
      where: { name: "Fecha 2" },
      include: { matches: true },
    });
    if (matchday2) {
      await prisma.matchday.update({
        where: { id: matchday2.id },
        data: { status: "OPEN" },
      });
      await prisma.match.updateMany({
        where: { matchdayId: matchday2.id },
        data: { status: "SCHEDULED", homeScore: 0, awayScore: 0 },
      });
      // Clear matchday points
      await prisma.squadPlayerPoints.deleteMany({
        where: {
          matchdayPoints: { matchdayId: matchday2.id },
        },
      });
      await prisma.matchdayPoints.deleteMany({
        where: { matchdayId: matchday2.id },
      });
    }
    return successResponse({ message: "Demo reseteada a estado inicial" });
  }

  if (action === "advance") {
    const current = await getCurrentMatchday();
    if (!current) {
      return errorResponse("No hay fecha activa");
    }

    const transitions: Record<string, "LOCK" | "LIVE" | "RESULTS"> = {
      OPEN: "LOCK",
      LOCK: "LIVE",
      LIVE: "RESULTS",
    };

    const nextStatus = transitions[current.status];
    if (!nextStatus) {
      return errorResponse(`Fecha ya está en ${current.status}`);
    }

    const result = await advanceMatchdayStatus(current.id, nextStatus);
    if ("error" in result && result.error) {
      return errorResponse(result.error);
    }

    let scoringResults = null;
    if (nextStatus === "RESULTS") {
      scoringResults = await calculateAllUsersPoints(current.id);
    }

    return successResponse({
      previousStatus: current.status,
      newStatus: nextStatus,
      matchdayName: current.name,
      scoringResults,
      message: `${current.name}: ${current.status} → ${nextStatus}`,
    });
  }

  return errorResponse("Acción no válida");
}
