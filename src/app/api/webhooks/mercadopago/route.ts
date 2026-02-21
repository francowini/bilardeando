import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { TransactionStatus } from "@/generated/prisma/client";
import { getPaymentService } from "@/services/payment.service";

/**
 * POST /api/webhooks/mercadopago — receives MP payment notifications.
 * Does NOT require auth (called by MP servers).
 * Must be idempotent.
 *
 * Note: wallet, budget, league, and AI unlock now charge directly from balance.
 * This webhook is kept for future MP integration — it just updates transaction status.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const topic = body.type ?? body.topic;
    if (topic !== "payment") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId =
      body.data?.id?.toString() ?? body.id?.toString() ?? null;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 },
      );
    }

    const paymentService = getPaymentService();
    const paymentResult = await paymentService.handleWebhook(paymentId);

    let transaction = await prisma.transaction.findFirst({
      where: { mpPaymentId: paymentId },
    });

    if (!transaction) {
      const externalRef = body.data?.external_reference ?? body.external_reference;
      if (externalRef) {
        const txId = parseInt(externalRef, 10);
        if (!isNaN(txId)) {
          transaction = await prisma.transaction.findUnique({
            where: { id: txId },
          });
        }
      }
    }

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    if (!transaction.mpPaymentId) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { mpPaymentId: paymentId },
      });
    }

    const statusMap: Record<string, TransactionStatus> = {
      approved: TransactionStatus.APPROVED,
      rejected: TransactionStatus.REJECTED,
      pending: TransactionStatus.PENDING,
    };

    const newStatus = statusMap[paymentResult.status] ?? TransactionStatus.PENDING;

    // If already in a terminal state, skip — idempotent
    if (
      transaction.status === TransactionStatus.APPROVED ||
      transaction.status === TransactionStatus.REJECTED ||
      transaction.status === TransactionStatus.REFUNDED
    ) {
      return NextResponse.json({ received: true, status: transaction.status });
    }

    // Update transaction status
    if (newStatus !== TransactionStatus.PENDING) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: newStatus },
      });
    }

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true, error: "Internal error" }, { status: 200 });
  }
}

/**
 * GET /api/webhooks/mercadopago — health check for MP webhook verification.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
