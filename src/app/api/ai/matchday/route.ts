import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getCurrentMatchday } from "@/services/matchday.service";
import { successResponse } from "@/lib/api-helpers";

/**
 * GET /api/ai/matchday
 *
 * Returns the current matchday with its matches and scores.
 *
 * Auth: ?email=...&password=... (query params)
 *
 * Example response:
 * {
 *   id: 1,
 *   name: "Fecha 1",
 *   status: "OPEN",
 *   matches: [
 *     { id: 1, homeTeam: "Boca Juniors", awayTeam: "River Plate", ... }
 *   ],
 *   hint: "When status is OPEN you can modify your squad. LOCK/LIVE means changes are blocked."
 * }
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;

  const matchday = await getCurrentMatchday();
  if (!matchday) {
    return successResponse({ matchday: null, hint: "No matchdays available." });
  }

  return successResponse({
    id: matchday.id,
    name: matchday.name,
    status: matchday.status,
    startDate: matchday.startDate,
    endDate: matchday.endDate,
    matches: matchday.matches.map((m) => ({
      matchId: m.id,
      homeTeam: m.homeTeam.name,
      homeTeamId: m.homeTeamId,
      awayTeam: m.awayTeam.name,
      awayTeamId: m.awayTeamId,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      kickoff: m.kickoff,
    })),
    hint: "OPEN = you can modify squad. LOCK/LIVE = changes blocked. RESULTS = matchday finished.",
  });
}
