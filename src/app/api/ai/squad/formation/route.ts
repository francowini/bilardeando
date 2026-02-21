import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getMatchdayLockGuard, errorResponse, successResponse } from "@/lib/api-helpers";
import { updateFormation } from "@/services/squad.service";
import { FORMATION_CODES } from "@/lib/formations";
import type { FormationCode } from "@/types";

/**
 * POST /api/ai/squad/formation
 *
 * Change your squad's formation. Players will be auto-adjusted to fit the new formation.
 * Excess starters at a position are moved to bench; bench players may be promoted.
 *
 * Headers: x-user-email, x-user-password
 * Body: { "formation": "4-4-2" }
 *
 * Available formations: 4-3-3, 4-4-2, 3-5-2, 3-4-3, 4-5-1, 5-3-2, 5-4-1
 *
 * Example curl:
 *   curl -X POST /api/ai/squad/formation \
 *     -H "x-user-email: franco@test.com" \
 *     -H "x-user-password: demo123" \
 *     -H "Content-Type: application/json" \
 *     -d '{"formation": "4-4-2"}'
 */
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
