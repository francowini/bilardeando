import { NextRequest } from "next/server";
import {
  getAuthOrError,
  successResponse,
  errorResponse,
  parsePagination,
} from "@/lib/api-helpers";
import { getGeneralLeaderboard } from "@/services/leaderboard.service";
import { prisma } from "@/lib/db";

/**
 * GET /api/leaderboard — general tournament leaderboard with pagination
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof Response) return auth;

  const { searchParams } = request.nextUrl;
  const { page, pageSize } = parsePagination(searchParams);

  try {
    const leaderboard = await getGeneralLeaderboard(page, pageSize);

    // Get matchday names for display
    const matchdays = await prisma.matchday.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });

    return successResponse({
      ...leaderboard,
      matchdays,
      currentUserId: auth.userId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al cargar ranking";
    return errorResponse(message, 500);
  }
}
