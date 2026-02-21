import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAIAuth } from "@/lib/ai-auth";
import { successResponse, parsePagination, parseIntParam } from "@/lib/api-helpers";
import type { Position } from "@/generated/prisma/client";

/**
 * GET /api/ai/players
 *
 * List available players in the market. Supports filters and pagination.
 *
 * Auth: ?email=...&password=... (query params)
 *
 * Query params:
 *   search    - Filter by player name or team name (partial match)
 *   position  - Filter by position: GK, DEF, MID, FWD
 *   teamId    - Filter by team ID (integer)
 *   sortBy    - Sort by: rating (default), value, name
 *   page      - Page number (default 1)
 *   pageSize  - Items per page (default 20, max 100)
 *   onlyFree  - If "1", only show players NOT in user's squad
 *
 * Example:
 *   GET /api/ai/players?position=FWD&sortBy=rating&pageSize=10
 *   GET /api/ai/players?search=messi
 *   GET /api/ai/players?onlyFree=1&position=DEF&sortBy=value
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const { searchParams } = request.nextUrl;
  const { page, pageSize: rawPageSize } = parsePagination(searchParams);
  const pageSize = Math.min(rawPageSize, 100);
  const search = searchParams.get("search") || undefined;
  const position = searchParams.get("position") as Position | undefined;
  const teamId = parseIntParam(searchParams.get("teamId"));
  const sortBy = (searchParams.get("sortBy") || "rating") as "rating" | "value" | "name";
  const onlyFree = searchParams.get("onlyFree") === "1";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { team: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (position && ["GK", "DEF", "MID", "FWD"].includes(position)) {
    where.position = position;
  }

  if (teamId) {
    where.teamId = teamId;
  }

  // Exclude players already in user's squad
  if (onlyFree) {
    const squad = await prisma.squad.findFirst({
      where: { userId },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    if (squad) {
      const ownedIds = await prisma.squadPlayer.findMany({
        where: { squadId: squad.id },
        select: { playerId: true },
      });
      if (ownedIds.length > 0) {
        where.id = { notIn: ownedIds.map((sp) => sp.playerId) };
      }
    }
  }

  let orderBy: Record<string, string>;
  switch (sortBy) {
    case "value":
      orderBy = { fantasyPrice: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    default:
      orderBy = { rating: "desc" };
  }

  const [data, total] = await Promise.all([
    prisma.player.findMany({
      where,
      include: { team: { select: { id: true, name: true, logo: true } } },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.player.count({ where }),
  ]);

  const mapped = data.map((p) => ({
    playerId: p.id,
    name: p.name,
    position: p.position,
    teamId: p.team.id,
    teamName: p.team.name,
    rating: p.rating,
    fantasyPrice: p.fantasyPrice,
    age: p.age,
    appearances: p.appearances,
    goals: p.goals,
    assists: p.assists,
  }));

  return successResponse({
    data: mapped,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
