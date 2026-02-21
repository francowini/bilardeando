import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getSquadByUser, getSquadSummary } from "@/services/squad.service";
import { successResponse, errorResponse } from "@/lib/api-helpers";

/**
 * GET /api/ai/squad
 *
 * Returns the user's full squad: formation, players (starters & bench),
 * budget, captain info, and validation status.
 *
 * Headers: x-user-email, x-user-password
 *
 * Example response:
 * {
 *   summary: { formation: "4-3-3", playerCount: 15, remainingBudget: 45.2, ... },
 *   starters: [{ id: 42, name: "L. Messi", position: "FWD", ... }],
 *   bench: [{ id: 18, name: "E. Fernández", position: "MID", ... }]
 * }
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const squad = await getSquadByUser(userId);
  if (!squad) {
    return successResponse({
      summary: null,
      starters: [],
      bench: [],
      hint: "Squad is empty. Use POST /api/ai/squad/buy to add players.",
    });
  }

  const summary = await getSquadSummary(userId);

  const mapPlayer = (sp: (typeof squad.squadPlayers)[number]) => ({
    playerId: sp.playerId,
    name: sp.player.name,
    position: sp.player.position,
    teamId: sp.player.team.id,
    teamName: sp.player.team.name,
    rating: sp.player.rating,
    fantasyPrice: sp.player.fantasyPrice,
    isStarter: sp.isStarter,
    isCaptain: sp.isCaptain,
    isCaptainSub: sp.isCaptainSub,
    goals: sp.player.goals,
    assists: sp.player.assists,
    appearances: sp.player.appearances,
  });

  const starters = squad.squadPlayers.filter((sp) => sp.isStarter).map(mapPlayer);
  const bench = squad.squadPlayers.filter((sp) => !sp.isStarter).map(mapPlayer);

  return successResponse({ summary, starters, bench });
}
