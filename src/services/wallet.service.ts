import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";

export interface WalletBalance {
  virtualBudget: number;
  realBalance: number;
  feeWaived: boolean;
}

export interface LoadBalanceResult {
  transactionId: number;
  amountArs: number;
  newBalance: number;
}

export interface TransactionPage {
  data: {
    id: number;
    type: TransactionType;
    status: TransactionStatus;
    amountArs: number;
    description: string | null;
    createdAt: Date;
  }[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Check whether the user qualifies for fee waiver (balance >= $20,000 ARS).
 */
export async function checkFeeWaiver(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { realBalance: true },
  });
  return (user?.realBalance ?? 0) >= 20000;
}

/**
 * Get user wallet balance and fee waiver status.
 */
export async function getBalance(userId: string): Promise<WalletBalance> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { virtualBudget: true, realBalance: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    virtualBudget: user.virtualBudget,
    realBalance: user.realBalance,
    feeWaived: user.realBalance >= 20000,
  };
}

/**
 * Load balance directly (no MP). Credits the user immediately.
 */
export async function loadBalance(
  userId: string,
  amountArs: number,
): Promise<LoadBalanceResult> {
  if (amountArs <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  // Create approved transaction and credit balance in one go
  const [transaction, user] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        type: TransactionType.WALLET_LOAD,
        status: TransactionStatus.APPROVED,
        amountArs,
        description: `Carga de saldo $${amountArs.toLocaleString("es-AR")}`,
        userId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { realBalance: { increment: amountArs } },
    }),
  ]);

  return {
    transactionId: transaction.id,
    amountArs,
    newBalance: user.realBalance,
  };
}

/**
 * Get paginated transaction history for a user.
 */
export async function getTransactions(
  userId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<TransactionPage> {
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        status: true,
        amountArs: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
