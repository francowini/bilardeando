import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { buyPlayer } from "@/services/transfer.service";

/**
 * POST /api/ai/squad/buy
 *
 * Buy a player and add them to your squad.
 * The player goes to the bench first; if bench is full, they go as starter.
 * Cost is deducted from your virtualBudget.
 *
 * Headers: x-user-email, x-user-password
 * Body: { "playerId": 42 }
 *
 * Example curl:
 *   curl -X POST /api/ai/squad/buy \
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

  const result = await buyPlayer(userId, body.playerId);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    success: true,
    ...result,
    hint: "Player added to your squad. Check GET /api/ai/squad to see updated lineup.",
  });
}
