import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { toggleStarter } from "@/services/squad.service";

/**
 * POST /api/ai/squad/toggle-starter
 *
 * Toggle a player between starter and bench.
 * If the player is a starter, they move to bench. If bench, they become a starter.
 * Must respect formation slot limits (e.g., 4-3-3 allows max 3 FWD starters).
 *
 * Headers: x-user-email, x-user-password
 * Body: { "playerId": 42 }
 *
 * Example curl:
 *   curl -X POST /api/ai/squad/toggle-starter \
 *     -H "x-user-email: franco@test.com" \
 *     -H "x-user-password: demo123" \
 *     -H "Content-Type: application/json" \
 *     -d '{"playerId": 42}'
 */
export async function POST(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const lock = await getMatchdayLockGuard();
  if (lock) return lock;

  const body = await request.json().catch(() => null);
  if (!body?.playerId || typeof body.playerId !== "number") {
    return errorResponse("Missing or invalid playerId (must be a number)");
  }

  const result = await toggleStarter(userId, body.playerId);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Player toggled. Check GET /api/ai/squad to see the updated lineup.",
  });
}
