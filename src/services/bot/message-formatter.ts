/**
 * Format data into WhatsApp-friendly text messages.
 * Uses WhatsApp markdown: *bold*, _italic_.
 * Keeps messages compact for mobile readability.
 */

import type { BotIntent } from "./bot-config";

// ── Types for formatter inputs ──

export interface SquadPlayerFormatted {
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  isStarter: boolean;
  isCaptain: boolean;
  isCaptainSub: boolean;
}

export interface SquadFormatted {
  formation: string;
  players: SquadPlayerFormatted[];
}

export interface PlayerScoreFormatted {
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  rawPoints: number;
  multiplier: number;
  finalPoints: number;
  isCaptain: boolean;
}

export interface MatchdayScoreFormatted {
  matchdayName: string;
  totalPoints: number;
  playerScores: PlayerScoreFormatted[];
}

export interface LeaderboardEntryFormatted {
  rank: number;
  userName: string;
  totalPoints: number;
  isCurrentUser: boolean;
}

// ── Position Emoji Map ──

const POSITION_EMOJI: Record<string, string> = {
  GK: "🥅",
  DEF: "🛡️",
  MID: "🎯",
  FWD: "⚡",
};

// ── Formatters ──

/**
 * Format a user's squad into a WhatsApp-friendly message.
 * Groups by position, marks captain with star, shows bench separately.
 */
export function formatSquad(squad: SquadFormatted): string {
  const lines: string[] = [];

  lines.push(`⚽ *Tu Equipo — ${squad.formation}*`);
  lines.push("");

  // Separate starters and bench
  const starters = squad.players.filter((p) => p.isStarter);
  const bench = squad.players.filter((p) => !p.isStarter);

  // Group starters by position in order: GK, DEF, MID, FWD
  const positionOrder: Array<"GK" | "DEF" | "MID" | "FWD"> = [
    "GK",
    "DEF",
    "MID",
    "FWD",
  ];

  for (const pos of positionOrder) {
    const posPlayers = starters.filter((p) => p.position === pos);
    if (posPlayers.length === 0) continue;

    const emoji = POSITION_EMOJI[pos];
    const playerTexts = posPlayers.map((p) => {
      let text = `${p.name} (${p.teamName})`;
      if (p.isCaptain) text += " — ⭐ Capitán";
      if (p.isCaptainSub) text += " — 🔄 Sub Capitán";
      return text;
    });

    lines.push(`${emoji} ${pos}: ${playerTexts.join(", ")}`);
  }

  // Bench section
  if (bench.length > 0) {
    lines.push("");
    lines.push("🪑 *Suplentes (0.5x):*");

    const benchTexts = bench.map(
      (p) => `${p.name} (${POSITION_EMOJI[p.position]})`
    );
    lines.push(benchTexts.join(", "));
  }

  return lines.join("\n");
}

/**
 * Format matchday scores into a WhatsApp-friendly message.
 * Shows total points and per-player breakdown sorted by points descending.
 */
export function formatScores(scores: MatchdayScoreFormatted): string {
  const lines: string[] = [];

  lines.push(
    `📊 *${scores.matchdayName} — Total: ${scores.totalPoints} pts*`
  );
  lines.push("");

  // Sort players by final points descending
  const sorted = [...scores.playerScores].sort(
    (a, b) => b.finalPoints - a.finalPoints
  );

  for (const player of sorted) {
    const emoji = POSITION_EMOJI[player.position];
    const captainMark = player.isCaptain ? " ⭐" : "";
    const multiplierText = `${player.multiplier}x`;
    lines.push(
      `${player.name} ${emoji} — ${player.finalPoints} pts (${multiplierText})${captainMark}`
    );
  }

  return lines.join("\n");
}

/**
 * Format leaderboard into a WhatsApp-friendly message.
 * Shows top entries and highlights the current user's position.
 */
export function formatLeaderboard(
  entries: LeaderboardEntryFormatted[]
): string {
  const lines: string[] = [];

  lines.push("🏆 *Ranking General*");
  lines.push("");

  for (const entry of entries) {
    const marker = entry.isCurrentUser ? "  ← Vos" : "";
    const medal =
      entry.rank === 1
        ? "🥇"
        : entry.rank === 2
          ? "🥈"
          : entry.rank === 3
            ? "🥉"
            : `${entry.rank}.`;

    lines.push(`${medal} ${entry.userName} — ${entry.totalPoints} pts${marker}`);
  }

  return lines.join("\n");
}

/**
 * Format the help message listing all available commands.
 * Separates free and premium (AI) features.
 */
export function formatHelp(intents: BotIntent[]): string {
  const lines: string[] = [];

  lines.push("📋 *Comandos disponibles:*");
  lines.push("");

  // Free commands
  const freeIntents = intents.filter((i) => !i.requiresAi && i.id !== "help");
  if (freeIntents.length > 0) {
    lines.push("*Gratis:*");
    for (const intent of freeIntents) {
      // Use the first pattern as a hint for the user
      const exampleKeyword = extractKeyword(intent.patterns[0]);
      lines.push(`• _"${exampleKeyword}"_ — ${intent.description}`);
    }
  }

  // AI/premium commands
  const aiIntents = intents.filter((i) => i.requiresAi);
  if (aiIntents.length > 0) {
    lines.push("");
    lines.push("*Premium (AI):* 🔒");
    for (const intent of aiIntents) {
      const exampleKeyword = extractKeyword(intent.patterns[0]);
      lines.push(`• _"${exampleKeyword}"_ — ${intent.description}`);
    }
  }

  lines.push("");
  lines.push('Escribí cualquier comando para empezar. Ej: _"mi equipo"_');

  return lines.join("\n");
}

/**
 * Extract a readable keyword from a regex pattern for display in help text.
 * Strips regex delimiters and flags to show the raw keyword.
 */
function extractKeyword(pattern: RegExp): string {
  return pattern.source
    .replace(/\\/g, "") // remove escape backslashes
    .replace(/\.\*/g, " ") // replace .* with space
    .replace(/[[\]()^$|?+{}]/g, "") // remove regex special chars
    .trim();
}
