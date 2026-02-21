import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { updateFormation } from "@/services/squad.service";
import { FORMATION_CODES } from "@/lib/formations";
import type { FormationCode } from "@/types";

/**
 * GET /api/ai/squad/formation?email=...&password=...&formation=4-4-2
 *
 * Change your squad's formation. Players will be auto-adjusted to fit the new formation.
 * Available formations: 4-3-3, 4-4-2, 3-5-2, 3-4-3, 4-5-1, 5-3-2, 5-4-1
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const lock = await getMatchdayLockGuard();
  if (lock) return lock;

  const formation = request.nextUrl.searchParams.get("formation");
  if (!formation) {
    return errorResponse(
      `Missing formation query param. Valid values: ${FORMATION_CODES.join(", ")}`,
    );
  }

  const result = await updateFormation(userId, formation as FormationCode);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Formation updated. Players may have been auto-adjusted. Check GET /api/ai/squad.",
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
  if (!body?.formation || typeof body.formation !== "string") {
    return errorResponse(
      `Missing or invalid formation. Valid values: ${FORMATION_CODES.join(", ")}`,
    );
  }

  const result = await updateFormation(userId, body.formation as FormationCode);
  if ("error" in result && result.error) {
    return errorResponse(result.error);
  }

  return successResponse({
    ...result,
    hint: "Formation updated. Players may have been auto-adjusted. Check GET /api/ai/squad.",
  });
}
