import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEMO_PASSWORD = "demo123";

/**
 * Authenticate an AI request via plain-text headers.
 * Headers required:
 *   x-user-email: user's email
 *   x-user-password: plain text password (demo123)
 *
 * Returns { userId, user } or a 401 NextResponse.
 */
export async function getAIAuth(request: NextRequest) {
  const email = request.headers.get("x-user-email");
  const password = request.headers.get("x-user-password");

  if (!email || !password) {
    return NextResponse.json(
      {
        error: "Missing authentication headers",
        hint: "Send x-user-email and x-user-password headers",
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
