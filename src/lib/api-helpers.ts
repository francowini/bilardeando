import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Get the authenticated user or return a 401 response.
 * Use in API route handlers:
 *   const auth = await getAuthOrError();
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId, user } = auth;
 */
export async function getAuthOrError() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 },
    );
  }
  return { userId: session.user.id, user: session.user };
}

/**
 * Standard error response builder.
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response builder.
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Check if squad changes are locked (matchday in LOCK or LIVE).
 * Returns a 403 response if locked, or null if changes are allowed.
 */
export async function getMatchdayLockGuard(): Promise<NextResponse | null> {
  const { isMatchdayLocked } = await import("@/services/matchday.service");
  const lockState = await isMatchdayLocked();
  if (lockState.locked) {
    const statusLabel =
      lockState.status === "LOCK" ? "bloqueada" :
      lockState.status === "LIVE" ? "en vivo" :
      "finalizada";
    return NextResponse.json(
      {
        error: `La fecha "${lockState.matchdayName}" está ${statusLabel}. No se pueden hacer cambios al equipo.`,
        locked: true,
        matchdayStatus: lockState.status,
      },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Parse a numeric query param. Returns undefined if not present or invalid.
 */
export function parseIntParam(
  value: string | null | undefined,
): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  return isNaN(n) ? undefined : n;
}

/**
 * Parse pagination params from URL search params.
 */
export function parsePagination(searchParams: URLSearchParams) {
  return {
    page: parseIntParam(searchParams.get("page")) ?? 1,
    pageSize: parseIntParam(searchParams.get("pageSize")) ?? 20,
  };
}
