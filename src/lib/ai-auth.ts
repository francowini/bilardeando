import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEMO_PASSWORD = "demo123";

/**
 * Authenticate an AI request via query params, headers, or JSON body.
 *
 * Priority:
 *   1. Query params: ?email=...&password=...
 *   2. Headers: x-user-email / x-user-password
 *
 * Returns { userId, user } or a 401 NextResponse.
 */
export async function getAIAuth(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // 1. Query params (preferred — works with simple GET tools like web_fetch)
  let email = searchParams.get("email");
  let password = searchParams.get("password");

  // 2. Fallback to headers
  if (!email || !password) {
    email = request.headers.get("x-user-email");
    password = request.headers.get("x-user-password");
  }

  if (!email || !password) {
    return NextResponse.json(
      {
        error: "Missing authentication",
        hint: "Send email & password as query params (?email=...&password=...) or as x-user-email / x-user-password headers",
      },
      { status: 401 },
    );
  }

  if (password !== DEMO_PASSWORD) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, virtualBudget: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: `User not found: ${email}` },
      { status: 401 },
    );
  }

  return { userId: user.id, user };
}
