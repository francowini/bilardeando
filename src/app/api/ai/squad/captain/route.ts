import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { setCaptain } from "@/services/squad.service";

/**
 * POST /api/ai/squad/captain
 *
 * Set the captain or vice-captain (captainSub). The player must be a starter.
 * Captain gets 2x points multiplier. Vice-captain gets captain role if captain doesn't play.
 *
 * Headers: x-user-email, x-user-password
 * Body: { "playerId": 42, "role": "captain" }
 *   role: "captain" or "captainSub"
 *
 * Example curl:
 *   curl -X POST /api/ai/squad/captain \
 *     -H "x-user-email: franco@test.com" \
 *     -H "x-user-password: demo123" \
 *     -H "Content-Type: application/json" \
 *     -d '{"playerId": 42, "role": "captain"}'
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

  const role = body.role;
  if (role !== "captain" && role !== "captainSub") {
    return errorResponse('Invalid role. Must be "captain" or "captainSub".');
  }

  const result = await setCaptain(userId, body.playerId, role);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Captain updated. Captain gets 2x points multiplier.",
  });
}
