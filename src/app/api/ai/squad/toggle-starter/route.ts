import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { toggleStarter } from "@/services/squad.service";

/**
 * GET /api/ai/squad/toggle-starter?email=...&password=...&playerId=42
 *
 * Toggle a player between starter and bench.
 * If the player is a starter, they move to bench. If bench, they become a starter.
 * Must respect formation slot limits.
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const lock = await getMatchdayLockGuard();
  if (lock) return lock;

  const playerId = parseInt(request.nextUrl.searchParams.get("playerId") || "", 10);
  if (!playerId || isNaN(playerId)) {
    return errorResponse("Missing or invalid playerId query param (must be a number)");
  }

  const result = await toggleStarter(userId, playerId);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Player toggled. Check GET /api/ai/squad to see the updated lineup.",
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
