import { NextRequest, NextResponse } from "next/server";
import {
  getAuthOrError,
  successResponse,
  parseIntParam,
} from "@/lib/api-helpers";
import {
  getCurrentMatchday,
  getMatchdayById,
  getAllMatchdays,
} from "@/services/matchday.service";

// GET /api/matchday — get current matchday or by ID
export async function GET(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const id = parseIntParam(searchParams.get("id"));
  const listAll = searchParams.get("all") === "1";

  if (listAll) {
    const matchdays = await getAllMatchdays();
    return successResponse({
      matchdays: matchdays.map((md) => ({
        id: md.id,
        name: md.name,
        status: md.status,
        startDate: md.startDate.toISOString(),
        endDate: md.endDate.toISOString(),
        matchCount: md._count.matches,
      })),
    });
  }

  if (id) {
    const matchday = await getMatchdayById(id);
    if (!matchday) {
      return successResponse({ matchday: null });
    }
    return successResponse({
      matchday: {
        id: matchday.id,
        name: matchday.name,
        status: matchday.status,
        startDate: matchday.startDate.toISOString(),
        endDate: matchday.endDate.toISOString(),
        matches: matchday.matches.map((m) => ({
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          status: m.status,
          kickoff: m.kickoff.toISOString(),
        })),
      },
    });
  }

  // Default: current matchday
  const current = await getCurrentMatchday();
  if (!current) {
    return successResponse({ matchday: null });
  }

  return successResponse({
    matchday: {
      id: current.id,
      name: current.name,
      status: current.status,
      startDate: current.startDate.toISOString(),
      endDate: current.endDate.toISOString(),
      matches: current.matches.map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        kickoff: m.kickoff.toISOString(),
      })),
    },
  });
}
