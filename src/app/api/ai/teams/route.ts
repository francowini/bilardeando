import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAIAuth } from "@/lib/ai-auth";
import { successResponse } from "@/lib/api-helpers";

/**
 * GET /api/ai/teams
 *
 * Returns all available teams with their IDs.
 * Useful for filtering players by team.
 *
 * Auth: ?email=...&password=... (query params)
 *
 * Example response:
 * {
 *   teams: [
 *     { teamId: 1, name: "Boca Juniors", tier: 1 },
 *     { teamId: 2, name: "River Plate", tier: 1 },
 *     ...
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;

  const teams = await prisma.team.findMany({
    select: { id: true, name: true, code: true, logo: true, tier: true },
    orderBy: { name: "asc" },
  });

  return successResponse({
    teams: teams.map((t) => ({
      teamId: t.id,
      name: t.name,
      code: t.code,
      tier: t.tier,
    })),
  });
}
