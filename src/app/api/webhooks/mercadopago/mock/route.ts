import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TransactionStatus } from "@/generated/prisma/client";

/**
 * GET /api/webhooks/mercadopago/mock — Mock payment completion handler.
 * Used in development when MERCADOPAGO_ACCESS_TOKEN is not set.
 * Simulates a successful payment and redirects back to the wallet.
 *
 * Note: wallet, budget, league, and AI unlock now charge directly from balance,
 * so this mock webhook just marks any remaining PENDING transactions as APPROVED.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const prefId = searchParams.get("pref");
  const redirect = searchParams.get("redirect") ?? "/wallet";

  if (!prefId) {
    return NextResponse.json(
      { error: "Missing preference ID" },
      { status: 400 },
    );
  }

  const parts = prefId.split("_");
  const externalRef = parts.slice(3).join("_");
  const transactionId = parseInt(externalRef, 10);

  if (isNaN(transactionId)) {
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.status !== TransactionStatus.PENDING) {
      return NextResponse.redirect(new URL(redirect, request.url));
    }

    // Just mark as approved — actual balance changes happen at purchase time now
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        mpPaymentId: `mock_pay_${Date.now()}`,
        status: TransactionStatus.APPROVED,
      },
    });
  } catch (error) {
    console.error("Mock webhook error:", error);
  }

  return NextResponse.redirect(new URL(redirect, request.url));
}
