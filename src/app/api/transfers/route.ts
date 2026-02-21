import { NextRequest, NextResponse } from "next/server";
import {
  getAuthOrError,
  successResponse,
  errorResponse,
  getMatchdayLockGuard,
} from "@/lib/api-helpers";
import { buyPlayer, sellPlayer } from "@/services/transfer.service";
import { getSquadSummary } from "@/services/squad.service";

// POST /api/transfers — buy or sell a player
export async function POST(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  // Check if matchday is locked
  const lockGuard = await getMatchdayLockGuard();
  if (lockGuard) return lockGuard;

  const body = await request.json().catch(() => ({}));
  const action = body.action as string;
  const playerId = body.playerId as number;

  if (!action || !["buy", "sell"].includes(action)) {
    return errorResponse("action debe ser 'buy' o 'sell'");
  }

  if (!playerId || typeof playerId !== "number") {
    return errorResponse("playerId es requerido");
  }

  if (action === "buy") {
    const result = await buyPlayer(auth.userId, playerId);
    if ("error" in result && result.error) {
      return errorResponse(result.error);
    }
    const summary = await getSquadSummary(auth.userId);
    return successResponse({
      success: true,
      remainingBudget: summary?.remainingBudget ?? 0,
    }, 201);
  }

  // sell
  const result = await sellPlayer(auth.userId, playerId);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }
  const summary = await getSquadSummary(auth.userId);
  return successResponse({
    success: true,
    ...result,
    remainingBudget: summary?.remainingBudget ?? 0,
  });
}
