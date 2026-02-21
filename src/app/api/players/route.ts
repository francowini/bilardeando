import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAuthOrError,
  parsePagination,
  parseIntParam,
  successResponse,
} from "@/lib/api-helpers";
import type { Position } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const auth = await getAuthOrError();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;

  // Special param to list teams for filter dropdown
  if (searchParams.get("_teams") === "1") {
    const teams = await prisma.team.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return successResponse({ teams });
  }

  const { page, pageSize } = parsePagination(searchParams);
  const search = searchParams.get("search") || undefined;
  const position = searchParams.get("position") as Position | undefined;
  const teamId = parseIntParam(searchParams.get("teamId"));
  const sortBy = (searchParams.get("sortBy") || "rating") as
    | "rating"
    | "value"
    | "name";

  // Build where clause
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

  // Build orderBy
  let orderBy: Record<string, string>;
  switch (sortBy) {
    case "value":
      orderBy = { fantasyPrice: "desc" };
      break;
    case "name":
      orderBy = { name: "asc" };
      break;
    case "rating":
    default:
      orderBy = { rating: "desc" };
      break;
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

  const totalPages = Math.ceil(total / pageSize);

  const mapped = data.map((p) => ({
    id: p.id,
    apiId: p.apiId,
    name: p.name,
    photo: p.photo,
    position: p.position,
    teamId: p.team.id,
    teamName: p.team.name,
    teamLogo: p.team.logo,
    rating: p.rating,
    fantasyPrice: p.fantasyPrice,
    appearances: p.appearances,
    goals: p.goals,
    assists: p.assists,
  }));

  return successResponse({
    data: mapped,
    total,
    page,
    pageSize,
    totalPages,
  });
}
