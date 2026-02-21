import { NextRequest, NextResponse } from "next/server";
import { getAuthOrError, successResponse, errorResponse } from "@/lib/api-helpers";
import { calculateSquadPoints } from "@/services/scoring.service";

// GET /api/matchday/[id]/points — get user's squad points for a matchday
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const matchdayId = parseInt(params.id, 10);
  if (isNaN(matchdayId)) {
    return errorResponse("ID de fecha inválido");
  }

  const result = await calculateSquadPoints(auth.userId, matchdayId);

  if (!result) {
    return successResponse({
      squadId: null,
      matchdayId,
      totalPoints: 0,
      playerPoints: [],
      message: "No tenés equipo armado",
    });
  }

  return successResponse(result);
}
