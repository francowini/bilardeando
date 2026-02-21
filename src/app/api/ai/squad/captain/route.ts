import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { setCaptain } from "@/services/squad.service";

/**
 * GET /api/ai/squad/captain?email=...&password=...&playerId=42&role=captain
 *
 * Set the captain or vice-captain (captainSub). The player must be a starter.
 * Captain gets 2x points multiplier.
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

  const role = request.nextUrl.searchParams.get("role");
  if (role !== "captain" && role !== "captainSub") {
    return errorResponse('Invalid or missing role query param. Must be "captain" or "captainSub".');
  }

  const result = await setCaptain(userId, playerId, role);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Captain updated. Captain gets 2x points multiplier.",
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
