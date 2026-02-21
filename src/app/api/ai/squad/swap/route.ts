import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { swapPlayers } from "@/services/squad.service";

/**
 * POST /api/ai/squad/swap
 *
 * Swap two players' roles (starter ↔ bench). Both players must be in your squad.
 * Useful for substituting a bench player for a starter of the same position.
 *
 * Headers: x-user-email, x-user-password
 * Body: { "playerIdA": 42, "playerIdB": 18 }
 *
 * Example curl:
 *   curl -X POST /api/ai/squad/swap \
 *     -H "x-user-email: franco@test.com" \
 *     -H "x-user-password: demo123" \
 *     -H "Content-Type: application/json" \
 *     -d '{"playerIdA": 42, "playerIdB": 18}'
 */
export async function POST(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const lock = await getMatchdayLockGuard();
  if (lock) return lock;

  const body = await request.json().catch(() => null);
  if (
    !body?.playerIdA || typeof body.playerIdA !== "number" ||
    !body?.playerIdB || typeof body.playerIdB !== "number"
  ) {
    return errorResponse("Missing or invalid playerIdA / playerIdB (both must be numbers)");
  }

  const result = await swapPlayers(userId, body.playerIdA, body.playerIdB);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Players swapped. Check GET /api/ai/squad to see updated lineup.",
  });
}
