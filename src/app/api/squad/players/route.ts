import { NextRequest, NextResponse } from "next/server";
import {
  getAuthOrError,
  successResponse,
  errorResponse,
} from "@/lib/api-helpers";
import {
  addPlayerToSquad,
  removePlayerFromSquad,
  setCaptain,
  toggleStarter,
} from "@/services/squad.service";

// POST /api/squad/players — add player to squad
export async function POST(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const playerId = body.playerId as number;
  const isStarter = body.isStarter !== false; // default true

  if (!playerId || typeof playerId !== "number") {
    return errorResponse("playerId es requerido");
  }

  const result = await addPlayerToSquad(auth.userId, playerId, isStarter);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({ success: true }, 201);
}

// DELETE /api/squad/players — remove player from squad
export async function DELETE(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const playerId = body.playerId as number;

  if (!playerId || typeof playerId !== "number") {
    return errorResponse("playerId es requerido");
  }

  const result = await removePlayerFromSquad(auth.userId, playerId);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({ success: true });
}

// PATCH /api/squad/players — update player role (captain, captainSub, toggle starter)
export async function PATCH(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const playerId = body.playerId as number;
  const action = body.action as string;

  if (!playerId || typeof playerId !== "number") {
    return errorResponse("playerId es requerido");
  }

  if (!action || !["captain", "captainSub", "toggleStarter"].includes(action)) {
    return errorResponse(
      "action debe ser 'captain', 'captainSub', o 'toggleStarter'",
    );
  }

  let result;
  if (action === "toggleStarter") {
    result = await toggleStarter(auth.userId, playerId);
  } else {
    result = await setCaptain(
      auth.userId,
      playerId,
      action as "captain" | "captainSub",
    );
  }

  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({ success: true });
}
