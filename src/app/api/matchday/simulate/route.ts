import { NextRequest, NextResponse } from "next/server";
import { getAuthOrError, successResponse, errorResponse } from "@/lib/api-helpers";
import { getCurrentMatchday, advanceMatchdayStatus } from "@/services/matchday.service";
import { calculateAllUsersPoints } from "@/services/scoring.service";

// POST /api/matchday/simulate — demo simulation endpoint
// Transitions current matchday: OPEN → LOCK → LIVE → RESULTS
// When reaching RESULTS, calculates all users' points
export async function POST(_request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const current = await getCurrentMatchday();
  if (!current) {
    return errorResponse("No hay fecha activa");
  }

  // Determine next status
  const transitions: Record<string, "LOCK" | "LIVE" | "RESULTS"> = {
    OPEN: "LOCK",
    LOCK: "LIVE",
    LIVE: "RESULTS",
  };

  const nextStatus = transitions[current.status];
  if (!nextStatus) {
    return errorResponse(
      `La fecha "${current.name}" ya está en ${current.status}, no se puede avanzar`,
    );
  }

  // Advance status
  const result = await advanceMatchdayStatus(current.id, nextStatus);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  let scoringResults = null;

  // If we reached RESULTS, calculate points for all users
  if (nextStatus === "RESULTS") {
    scoringResults = await calculateAllUsersPoints(current.id);
  }

  return successResponse({
    matchdayId: current.id,
    matchdayName: current.name,
    previousStatus: current.status,
    newStatus: nextStatus,
    scoringResults,
    message: `Fecha "${current.name}" avanzó de ${current.status} a ${nextStatus}`,
  });
}
