import { prisma } from "@/lib/db";
import { TransactionType, TransactionStatus } from "@/generated/prisma/client";

export interface BudgetTier {
  id: string;
  virtualAmount: number; // in millions
  priceArs: number;
}

const TIERS: BudgetTier[] = [
  { id: "tier-5m", virtualAmount: 5, priceArs: 1000 },
  { id: "tier-10m", virtualAmount: 10, priceArs: 1800 },
  { id: "tier-20m", virtualAmount: 20, priceArs: 3000 },
];

export interface BudgetPurchaseResult {
  transactionId: number;
  tier: BudgetTier;
  newBudget: number;
  newBalance: number;
}

/**
 * Get available budget purchase tiers.
 */
export function getTiers(): BudgetTier[] {
  return TIERS;
}

/**
 * Purchase virtual budget directly from real balance (no MP).
 * Deducts from realBalance, credits virtualBudget immediately.
 */
export async function purchaseBudget(
  userId: string,
  tierId: string,
): Promise<BudgetPurchaseResult> {
  const tier = TIERS.find((t) => t.id === tierId);
  if (!tier) {
    throw new Error("Tier no válido");
  }

  // Check user has enough balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { realBalance: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  if (user.realBalance < tier.priceArs) {
    throw new Error(
      `Saldo insuficiente. Necesitás $${tier.priceArs.toLocaleString("es-AR")} ARS, tenés $${user.realBalance.toLocaleString("es-AR")} ARS`,
    );
  }

  // Create approved transaction, debit balance, credit budget
  const [transaction, updatedUser] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        type: TransactionType.BUDGET_PURCHASE,
        status: TransactionStatus.APPROVED,
        amountArs: tier.priceArs,
        description: `Compra $${tier.virtualAmount}M presupuesto virtual`,
        userId,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        realBalance: { decrement: tier.priceArs },
        virtualBudget: { increment: tier.virtualAmount },
      },
    }),
  ]);

  return {
    transactionId: transaction.id,
    tier,
    newBudget: updatedUser.virtualBudget,
    newBalance: updatedUser.realBalance,
  };
}
