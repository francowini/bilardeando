import { NextRequest, NextResponse } from "next/server";
import { getAIAuth } from "@/lib/ai-auth";
import { getGeneralLeaderboard } from "@/services/leaderboard.service";
import { successResponse, parsePagination } from "@/lib/api-helpers";

/**
 * GET /api/ai/leaderboard
 *
 * Returns the general tournament leaderboard, ranked by total points.
 *
 * Auth: ?email=...&password=... (query params)
 * Query: page (default 1), pageSize (default 20)
 *
 * Example response:
 * {
 *   data: [
 *     { rank: 1, userId: "abc", userName: "Franco", totalPoints: 87.5 },
 *     ...
 *   ],
 *   total: 50,
 *   page: 1,
 *   pageSize: 20,
 *   totalPages: 3
 * }
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const { page, pageSize } = parsePagination(searchParams);

  const result = await getGeneralLeaderboard(page, pageSize);

  return successResponse(result);
}
