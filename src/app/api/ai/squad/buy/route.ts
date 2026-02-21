import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { buyPlayer } from "@/services/transfer.service";

/**
 * GET /api/ai/squad/buy?email=...&password=...&playerId=42
 *
 * Buy a player and add them to your squad.
 * The player goes to the bench first; if bench is full, they go as starter.
 * Cost is deducted from your virtualBudget.
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

  const result = await buyPlayer(userId, playerId);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    success: true,
    ...result,
    hint: "Player added to your squad. Check GET /api/ai/squad to see updated lineup.",
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
