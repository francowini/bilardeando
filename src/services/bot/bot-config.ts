/**
 * Bot configuration: intent patterns, response templates, and intent matching.
 * Central registry of all commands the WhatsApp bot understands.
 */

// ── Types ──

export interface BotIntent {
  id: string;
  patterns: RegExp[]; // regex patterns to match user messages
  description: string; // what this intent does (shown in help)
  requiresAi: boolean; // whether this is a paid AI feature
  handler: string; // handler function name in intent-handlers.ts
}

// ── Intent Definitions ──

export const BOT_INTENTS: BotIntent[] = [
  {
    id: "view_squad",
    patterns: [/mi equipo/i, /mi plantel/i, /equipo/i, /squad/i],
    description: "Ver tu equipo actual",
    requiresAi: false,
    handler: "handleViewSquad",
  },
  {
    id: "view_scores",
    patterns: [/puntaje/i, /puntos/i, /score/i, /resultado/i],
    description: "Ver puntaje de la ultima fecha",
    requiresAi: false,
    handler: "handleViewScores",
  },
  {
    id: "view_leaderboard",
    patterns: [/ranking/i, /tabla/i, /posicion/i, /posición/i, /leaderboard/i],
    description: "Ver tu posicion en el ranking",
    requiresAi: false,
    handler: "handleViewLeaderboard",
  },
  {
    id: "make_substitution",
    patterns: [/cambio/i, /sustitu/i, /swap/i, /reemplaz/i],
    description: "Hacer un cambio en tu equipo",
    requiresAi: false,
    handler: "handleMakeSubstitution",
  },
  {
    id: "ai_advice",
    patterns: [
      /consejo/i,
      /recomend/i,
      /suger/i,
      /quién.*pongo/i,
      /quien.*pongo/i,
      /tip/i,
      /advice/i,
    ],
    description: "Consejos del asistente AI (Premium)",
    requiresAi: true,
    handler: "handleAiAdvice",
  },
  {
    id: "ai_predictions",
    patterns: [
      /predicción/i,
      /prediccion/i,
      /pronóstico/i,
      /pronostico/i,
      /predict/i,
    ],
    description: "Predicciones de la fecha (Premium)",
    requiresAi: true,
    handler: "handleAiPredictions",
  },
  {
    id: "ai_injuries",
    patterns: [/lesion/i, /lesión/i, /injur/i, /baja/i],
    description: "Alertas de lesiones (Premium)",
    requiresAi: true,
    handler: "handleAiInjuries",
  },
  {
    id: "help",
    patterns: [
      /ayuda/i,
      /help/i,
      /comando/i,
      /qué puedo/i,
      /que puedo/i,
      /menu/i,
      /menú/i,
    ],
    description: "Ver comandos disponibles",
    requiresAi: false,
    handler: "handleHelp",
  },
];

// ── Response Templates ──

export const BOT_RESPONSES = {
  welcome:
    '⚽ ¡Hola! Soy el bot de Bilardeando. Escribí "ayuda" para ver los comandos disponibles.',
  unknown:
    '🤔 No entendí tu mensaje. Escribí "ayuda" para ver los comandos disponibles.',
  error:
    "❌ Hubo un error procesando tu mensaje. Intentá de nuevo más tarde.",
  aiLocked:
    "🔒 Esta función es exclusiva para usuarios Premium. Desbloqueá las funciones AI por $500 ARS desde la app web en bilardeando.com/wallet",
  noSquad:
    "⚠️ Todavía no tenés un equipo armado. Ingresá a bilardeando.com/squad para crear tu plantel.",
  noScores:
    "📊 Todavía no hay puntajes registrados para tu equipo.",
  noLeaderboard:
    "🏆 Todavía no hay datos de ranking disponibles.",
  helpHeader: "📋 *Comandos disponibles:*",
} as const;

// ── Intent Matching ──

/**
 * Match a user message to a bot intent.
 * Returns the first matching intent, or null if no match found.
 */
export function matchIntent(message: string): BotIntent | null {
  for (const intent of BOT_INTENTS) {
    if (intent.patterns.some((p) => p.test(message))) {
      return intent;
    }
  }
  return null;
}
