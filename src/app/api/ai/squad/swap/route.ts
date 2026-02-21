import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { swapPlayers } from "@/services/squad.service";

/**
 * GET /api/ai/squad/swap?email=...&password=...&playerIdA=42&playerIdB=18
 *
 * Swap two players' roles (starter <-> bench). Both players must be in your squad.
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const lock = await getMatchdayLockGuard();
  if (lock) return lock;

  const playerIdA = parseInt(request.nextUrl.searchParams.get("playerIdA") || "", 10);
  const playerIdB = parseInt(request.nextUrl.searchParams.get("playerIdB") || "", 10);
  if (!playerIdA || isNaN(playerIdA) || !playerIdB || isNaN(playerIdB)) {
    return errorResponse("Missing or invalid playerIdA / playerIdB query params (both must be numbers)");
  }

  const result = await swapPlayers(userId, playerIdA, playerIdB);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Players swapped. Check GET /api/ai/squad to see updated lineup.",
  });
}

/** POST kept for backwards compatibility */
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
