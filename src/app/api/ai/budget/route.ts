import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAIAuth } from "@/lib/ai-auth";
import { successResponse } from "@/lib/api-helpers";
import { SELL_TAX_RATE } from "@/lib/formations";

/**
 * GET /api/ai/budget
 *
 * Returns the user's current virtual budget, real balance, and squad value.
 *
 * Headers: x-user-email, x-user-password
 *
 * Example response:
 * {
 *   virtualBudget: 45.2,
 *   realBalance: 15000,
 *   squadValue: 104.8,
 *   sellTaxRate: 0.1,
 *   hint: "When you sell a player you get back 90% of their price."
 * }
 */
export async function GET(request: NextRequest) {
  const auth = await getAIAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { virtualBudget: true, realBalance: true },
  });

  const squad = await prisma.squad.findFirst({
    where: { userId },
    include: {
      squadPlayers: {
        include: { player: { select: { fantasyPrice: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const squadValue = squad
    ? squad.squadPlayers.reduce((sum, sp) => sum + sp.player.fantasyPrice, 0)
    : 0;

  return successResponse({
    virtualBudget: user?.virtualBudget ?? 0,
    realBalance: user?.realBalance ?? 0,
    squadValue,
    sellTaxRate: SELL_TAX_RATE,
    hint: "virtualBudget is in millions (e.g. 45.2 = $45.2M). Selling a player returns 90% of their fantasyPrice.",
  });
}
