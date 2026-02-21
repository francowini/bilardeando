import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";

const AI_UNLOCK_PRICE_ARS = 500;

export interface AiUnlockResult {
  transactionId: number;
  amountArs: number;
  unlocked: boolean;
}

/**
 * Purchase AI unlock directly from real balance (no MP).
 * Deducts from user balance, creates approved transaction, sets aiUnlocked.
 */
export async function purchaseAiUnlock(
  userId: string,
): Promise<AiUnlockResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiUnlocked: true, realBalance: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.aiUnlocked) {
    throw new Error("AI Premium ya está activado");
  }

  if (user.realBalance < AI_UNLOCK_PRICE_ARS) {
    throw new Error(
      `Saldo insuficiente. Necesitás $${AI_UNLOCK_PRICE_ARS.toLocaleString("es-AR")} ARS para AI Premium`,
    );
  }

  // Create approved transaction, debit balance, unlock AI — all in one tx
  const [transaction] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        type: TransactionType.AI_UNLOCK,
        status: TransactionStatus.APPROVED,
        amountArs: AI_UNLOCK_PRICE_ARS,
        description: "Desbloqueo AI Premium",
        userId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        realBalance: { decrement: AI_UNLOCK_PRICE_ARS },
        aiUnlocked: true,
      },
    }),
  ]);

  return {
    transactionId: transaction.id,
    amountArs: AI_UNLOCK_PRICE_ARS,
    unlocked: true,
  };
}

/**
 * Unlock AI premium for the user after webhook confirmation.
 * Idempotent: only unlocks if transaction is still PENDING.
 */
export async function unlockAi(
  userId: string,
  transactionId: number,
): Promise<void> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction || transaction.userId !== userId) {
    throw new Error("Transaction not found");
  }

  if (transaction.status === TransactionStatus.APPROVED) {
    return; // already unlocked — idempotent
  }

  if (transaction.type !== TransactionType.AI_UNLOCK) {
    throw new Error("Transaction is not an AI unlock");
  }

  await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: TransactionStatus.APPROVED },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { aiUnlocked: true },
    }),
  ]);
}
