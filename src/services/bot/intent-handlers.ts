/**
 * Intent handlers for the WhatsApp bot.
 * Each handler fetches data from the database and formats it for WhatsApp.
 * AI handlers check the paywall before calling the AI service.
 */

import { prisma } from "@/lib/db";
import { BOT_INTENTS, BOT_RESPONSES } from "./bot-config";
import {
  formatSquad,
  formatScores,
  formatLeaderboard,
  formatHelp,
  type SquadPlayerFormatted,
  type PlayerScoreFormatted,
  type LeaderboardEntryFormatted,
} from "./message-formatter";
import { handleAiQuery, type AiContext } from "./ai-handler";

// ── Free Tier Handlers ──

/**
 * Handle "view squad" intent.
 * Fetches the user's most recent squad with players and formats it.
 */
export async function handleViewSquad(userId: string): Promise<string> {
  try {
    const squad = await prisma.squad.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        squadPlayers: {
          include: {
            player: {
              include: { team: true },
            },
          },
        },
      },
    });

    if (!squad || squad.squadPlayers.length === 0) {
      return BOT_RESPONSES.noSquad;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const players: SquadPlayerFormatted[] = squad.squadPlayers.map((sp: any) => ({
      name: sp.player.name as string,
      position: sp.player.position as "GK" | "DEF" | "MID" | "FWD",
      teamName: sp.player.team.name as string,
      isStarter: sp.isStarter as boolean,
      isCaptain: sp.isCaptain as boolean,
      isCaptainSub: sp.isCaptainSub as boolean,
    }));

    return formatSquad({
      formation: squad.formation,
      players,
    });
  } catch (error) {
    console.error("[Bot] Error fetching squad:", error);
    return BOT_RESPONSES.error;
  }
}

/**
 * Handle "view scores" intent.
 * Fetches the latest matchday points for the user.
 */
export async function handleViewScores(userId: string): Promise<string> {
  try {
    // Get the most recent matchday points for the user
    const latestPoints = await prisma.matchdayPoints.findFirst({
      where: { userId },
      orderBy: { matchday: { startDate: "desc" } },
      include: {
        matchday: true,
        squadPlayerPoints: true,
      },
    });

    if (!latestPoints) {
      return BOT_RESPONSES.noScores;
    }

    // Fetch player details for each squad player point entry
    const playerScores: PlayerScoreFormatted[] = [];

    for (const spp of latestPoints.squadPlayerPoints) {
      // Get player info — squadPlayerPoints stores playerId directly
      const player = await prisma.player.findUnique({
        where: { id: spp.playerId },
      });

      if (player) {
        // Determine if captain based on multiplier (2x = captain)
        const isCaptain = spp.multiplier === 2;

        playerScores.push({
          name: player.name,
          position: player.position as "GK" | "DEF" | "MID" | "FWD",
          rawPoints: spp.rawPoints,
          multiplier: spp.multiplier,
          finalPoints: spp.finalPoints,
          isCaptain,
        });
      }
    }

    return formatScores({
      matchdayName: latestPoints.matchday.name,
      totalPoints: latestPoints.totalPoints,
      playerScores,
    });
  } catch (error) {
    console.error("[Bot] Error fetching scores:", error);
    return BOT_RESPONSES.error;
  }
}

/**
 * Handle "view leaderboard" intent.
 * Fetches global ranking and finds the user's position.
 */
export async function handleViewLeaderboard(userId: string): Promise<string> {
  try {
    // Aggregate total points per user across all matchdays
    const aggregated = await prisma.matchdayPoints.groupBy({
      by: ["userId"],
      _sum: { totalPoints: true },
      orderBy: { _sum: { totalPoints: "desc" } },
    });

    if (aggregated.length === 0) {
      return BOT_RESPONSES.noLeaderboard;
    }

    // Get user details for the leaderboard
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = aggregated.map((a: any) => a.userId as string);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      users.map((u: any) => [u.id as string, (u.name as string | null) ?? "Anónimo"] as const)
    );

    // Build ranked entries
    const allEntries: LeaderboardEntryFormatted[] = aggregated.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (entry: any, index: number) => ({
        rank: index + 1,
        userName: userMap.get(entry.userId) ?? "Anónimo",
        totalPoints: (entry._sum?.totalPoints as number | null) ?? 0,
        isCurrentUser: entry.userId === userId,
      })
    );

    // Find the user's rank
    const userRank = allEntries.findIndex((e) => e.isCurrentUser);

    // Show top 10 + user's position if not in top 10
    let displayEntries = allEntries.slice(0, 10);

    if (userRank >= 10) {
      // Add separator and user's entry
      displayEntries = [
        ...displayEntries,
        allEntries[userRank],
      ];
    }

    return formatLeaderboard(displayEntries);
  } catch (error) {
    console.error("[Bot] Error fetching leaderboard:", error);
    return BOT_RESPONSES.error;
  }
}

/**
 * Handle "make substitution" intent.
 * Substitutions require payment via Mercado Pago, so we direct the user to the web app.
 */
export async function handleMakeSubstitution(): Promise<string> {
  return (
    "🔄 *Cambios en tu equipo*\n\n" +
    "Los cambios tienen un costo y se procesan a través de Mercado Pago.\n" +
    "Para hacer un cambio, ingresá a:\n" +
    "👉 bilardeando.com/squad\n\n" +
    "Desde ahí podés elegir qué jugador sacar y cuál meter."
  );
}

/**
 * Handle "help" intent.
 * Lists all available commands grouped by free and premium.
 */
export async function handleHelp(): Promise<string> {
  return formatHelp(BOT_INTENTS);
}

// ── AI Tier Handlers (paywall gated) ──

/**
 * Check if a user has AI features unlocked (paid).
 */
async function checkAiPaywall(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiUnlocked: true },
    });
    return user?.aiUnlocked ?? false;
  } catch (error) {
    console.error("[Bot] Error checking AI paywall:", error);
    return false;
  }
}

/**
 * Build the AI context from the user's squad and recent scores.
 */
async function buildAiContext(userId: string): Promise<AiContext> {
  const context: AiContext = { userId, squad: [], recentScores: [] };

  try {
    // Fetch user's squad
    const squad = await prisma.squad.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        squadPlayers: {
          include: {
            player: {
              include: { team: true },
            },
          },
        },
      },
    });

    if (squad) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.squad = squad.squadPlayers.map((sp: any) => ({
        playerName: sp.player.name as string,
        position: sp.player.position as string,
        team: sp.player.team.name as string,
        rating: (sp.player.rating as number | null) ?? 0,
        isStarter: sp.isStarter as boolean,
      }));
    }

    // Fetch recent matchday scores (last 5)
    const recentPoints = await prisma.matchdayPoints.findMany({
      where: { userId },
      orderBy: { matchday: { startDate: "desc" } },
      take: 5,
      include: { matchday: true },
    });

    if (recentPoints.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.recentScores = recentPoints.map((mp: any) => ({
        matchday: mp.matchday.name as string,
        points: mp.totalPoints as number,
      }));
    }
  } catch (error) {
    console.error("[Bot] Error building AI context:", error);
  }

  return context;
}

/**
 * Handle "AI advice" intent.
 * Checks paywall, then calls AI handler for personalized advice.
 */
export async function handleAiAdvice(
  userId: string,
  query: string
): Promise<string> {
  const hasAi = await checkAiPaywall(userId);
  if (!hasAi) return BOT_RESPONSES.aiLocked;

  const context = await buildAiContext(userId);
  return handleAiQuery(query, context);
}

/**
 * Handle "AI predictions" intent.
 * Checks paywall, then calls AI handler for matchday predictions.
 */
export async function handleAiPredictions(
  userId: string,
  query: string
): Promise<string> {
  const hasAi = await checkAiPaywall(userId);
  if (!hasAi) return BOT_RESPONSES.aiLocked;

  const context = await buildAiContext(userId);
  return handleAiQuery(query, context);
}

/**
 * Handle "AI injuries" intent.
 * Checks paywall, then calls AI handler for injury alerts.
 */
export async function handleAiInjuries(
  userId: string,
  query: string
): Promise<string> {
  const hasAi = await checkAiPaywall(userId);
  if (!hasAi) return BOT_RESPONSES.aiLocked;

  const context = await buildAiContext(userId);
  return handleAiQuery(query, context);
}

// ── Main Dispatcher ──

/**
 * Dispatch an intent to the appropriate handler.
 * Maps intent IDs to their handler functions.
 */
export async function dispatchIntent(
  intentId: string,
  userId: string,
  originalMessage: string
): Promise<string> {
  switch (intentId) {
    case "view_squad":
      return handleViewSquad(userId);
    case "view_scores":
      return handleViewScores(userId);
    case "view_leaderboard":
      return handleViewLeaderboard(userId);
    case "make_substitution":
      return handleMakeSubstitution();
    case "help":
      return handleHelp();
    case "ai_advice":
      return handleAiAdvice(userId, originalMessage);
    case "ai_predictions":
      return handleAiPredictions(userId, originalMessage);
    case "ai_injuries":
      return handleAiInjuries(userId, originalMessage);
    default:
      return BOT_RESPONSES.unknown;
  }
}
