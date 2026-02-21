import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { sellPlayer } from "@/services/transfer.service";

/**
 * POST /api/ai/squad/sell
 *
 * Sell a player from your squad. You get back 90% of their fantasyPrice (10% tax).
 * The refund is added to your virtualBudget.
 *
 * Headers: x-user-email, x-user-password
 * Body: { "playerId": 42 }
 *
 * Example curl:
 *   curl -X POST /api/ai/squad/sell \
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

  const result = await sellPlayer(userId, body.playerId);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Player sold. Check GET /api/ai/budget to see updated budget.",
  });
}
