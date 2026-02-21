import { NextResponse } from "next/server";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const adapter = PrismaAdapter(prisma) as Record<string, unknown>;

    // Test createUser (what NextAuth does on first OAuth login)
    const testResult: Record<string, unknown> = {};

    // Test getUserByEmail
    try {
      const user = await (adapter.getUserByEmail as Function)("test@test.com");
      testResult.getUserByEmail = user ? "found" : "null (ok)";
    } catch (e: unknown) {
      testResult.getUserByEmail = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test getUserByAccount
    try {
      const user = await (adapter.getUserByAccount as Function)({
        provider: "google",
        providerAccountId: "test123",
      });
      testResult.getUserByAccount = user ? "found" : "null (ok)";
    } catch (e: unknown) {
      testResult.getUserByAccount = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }

    return NextResponse.json({ status: "ok", adapterTests: testResult });
  } catch (e: unknown) {
    return NextResponse.json(
      { status: "error", error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
