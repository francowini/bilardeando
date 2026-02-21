import { NextResponse } from "next/server";
import { getLastAuthError } from "@/lib/auth";

export async function GET() {
  const lastError = getLastAuthError();

  if (!lastError) {
    return NextResponse.json({
      status: "no errors recorded",
      note: "Errors are stored in-memory per serverless instance. Try logging in first, then hit this endpoint immediately.",
    });
  }

  return NextResponse.json({ status: "error found", ...lastError });
}
