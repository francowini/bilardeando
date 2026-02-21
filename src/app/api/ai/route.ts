import { NextResponse } from "next/server";
import { FORMATION_CODES } from "@/lib/formations";

/**
 * GET /api/ai
 *
 * Self-describing API for AI agents. No auth required.
 * Returns all available endpoints, their methods, parameters, and usage examples.
 */
export async function GET() {
  return NextResponse.json({
    name: "Bilardeando Fantasy Football AI API",
    version: "2.0",
    description:
      "API for AI agents to manage fantasy football squads. " +
      "All endpoints are GET-only (compatible with web_fetch). " +
      "Authenticate with email & password query params on every request.",
    authentication: {
      method: "Query parameters",
      params: {
        email: "User's email address (e.g. demo1@bilardeando.com)",
        password: "Password (demo123 for all users)",
      },
      example: "https://HOST/api/ai/squad?email=demo1@bilardeando.com&password=demo123",
      note: "Headers (x-user-email / x-user-password) are also supported as fallback.",
    },
    game_rules: {
      squad_size: "18 players max (11 starters + 7 bench)",
      formations: FORMATION_CODES,
      captain: "Captain gets 2x points, bench players get 0.5x, starters get 1x",
      sell_tax: "Selling a player returns 90% of their price (10% tax)",
      positions: ["GK (goalkeeper)", "DEF (defender)", "MID (midfielder)", "FWD (forward)"],
      matchday_statuses: [
        "OPEN — you can modify your squad",
        "LOCK — squad changes are blocked (matchday about to start)",
        "LIVE — matches in progress, no changes allowed",
        "RESULTS — matchday finished, points calculated",
      ],
    },
    endpoints: {
      read: [
        {
          method: "GET",
          path: "/api/ai/squad",
          description: "Get your full squad (starters, bench, formation, captain, budget info)",
          example: "https://HOST/api/ai/squad?email=demo1@bilardeando.com&password=demo123",
        },
        {
          method: "GET",
          path: "/api/ai/players",
          description: "Search the player market. Supports filters and pagination.",
          query_params: {
            search: "Filter by player/team name (e.g. &search=messi)",
            position: "Filter by position: GK, DEF, MID, FWD",
            teamId: "Filter by team ID (integer)",
            sortBy: "Sort by: rating (default), value, name",
            onlyFree: "Set to 1 to exclude players already in your squad",
            page: "Page number (default 1)",
            pageSize: "Items per page (default 20, max 100)",
          },
          example:
            "https://HOST/api/ai/players?email=demo1@bilardeando.com&password=demo123&position=FWD&sortBy=rating&pageSize=5&onlyFree=1",
        },
        {
          method: "GET",
          path: "/api/ai/budget",
          description: "Get your current budget, squad value, and sell tax rate",
          example: "https://HOST/api/ai/budget?email=demo1@bilardeando.com&password=demo123",
        },
        {
          method: "GET",
          path: "/api/ai/matchday",
          description: "Get current matchday info: status, matches, scores",
          example: "https://HOST/api/ai/matchday?email=demo1@bilardeando.com&password=demo123",
        },
        {
          method: "GET",
          path: "/api/ai/teams",
          description: "List all teams with their IDs (useful for filtering players)",
          example: "https://HOST/api/ai/teams?email=demo1@bilardeando.com&password=demo123",
        },
        {
          method: "GET",
          path: "/api/ai/leaderboard",
          description: "Get tournament leaderboard (rankings by total points)",
          query_params: {
            page: "Page number (default 1)",
            pageSize: "Items per page (default 20)",
          },
          example: "https://HOST/api/ai/leaderboard?email=demo1@bilardeando.com&password=demo123",
        },
      ],
      actions: [
        {
          method: "GET",
          path: "/api/ai/squad/buy",
          description: "Buy a player and add to your squad (deducts from virtualBudget)",
          query_params: { playerId: "Player ID to buy (integer)" },
          example:
            "https://HOST/api/ai/squad/buy?email=demo1@bilardeando.com&password=demo123&playerId=42",
        },
        {
          method: "GET",
          path: "/api/ai/squad/sell",
          description: "Sell a player from your squad (90% refund to virtualBudget)",
          query_params: { playerId: "Player ID to sell (integer)" },
          example:
            "https://HOST/api/ai/squad/sell?email=demo1@bilardeando.com&password=demo123&playerId=42",
        },
        {
          method: "GET",
          path: "/api/ai/squad/toggle-starter",
          description: "Toggle a player between starter and bench",
          query_params: { playerId: "Player ID to toggle (integer)" },
          example:
            "https://HOST/api/ai/squad/toggle-starter?email=demo1@bilardeando.com&password=demo123&playerId=42",
        },
        {
          method: "GET",
          path: "/api/ai/squad/swap",
          description: "Swap two players (e.g. swap a starter with a bench player)",
          query_params: {
            playerIdA: "First player ID (integer)",
            playerIdB: "Second player ID (integer)",
          },
          example:
            "https://HOST/api/ai/squad/swap?email=demo1@bilardeando.com&password=demo123&playerIdA=42&playerIdB=18",
        },
        {
          method: "GET",
          path: "/api/ai/squad/captain",
          description: 'Set captain (2x points) or vice-captain. Role must be "captain" or "captainSub".',
          query_params: {
            playerId: "Player ID (integer)",
            role: '"captain" or "captainSub"',
          },
          example:
            "https://HOST/api/ai/squad/captain?email=demo1@bilardeando.com&password=demo123&playerId=42&role=captain",
        },
        {
          method: "GET",
          path: "/api/ai/squad/formation",
          description: `Change formation. Available: ${FORMATION_CODES.join(", ")}. Players auto-adjust to fit.`,
          query_params: { formation: "Formation code (e.g. 4-4-2)" },
          example:
            "https://HOST/api/ai/squad/formation?email=demo1@bilardeando.com&password=demo123&formation=4-4-2",
        },
      ],
    },
    recommended_workflow: [
      "1. GET /api/ai/budget?email=...&password=... — Check how much money you have",
      "2. GET /api/ai/squad?email=...&password=... — See your current squad (may be empty)",
      "3. GET /api/ai/teams?email=...&password=... — Get team IDs for filtering",
      "4. GET /api/ai/players?email=...&password=...&onlyFree=1&position=GK&sortBy=rating — Find best available players by position",
      "5. GET /api/ai/squad/buy?email=...&password=...&playerId=42 — Buy players to fill your squad",
      "6. GET /api/ai/squad/formation?email=...&password=...&formation=4-3-3 — Set your preferred formation",
      "7. GET /api/ai/squad/toggle-starter?email=...&password=...&playerId=42 — Move players between starter/bench",
      "8. GET /api/ai/squad/captain?email=...&password=...&playerId=42&role=captain — Set your best player as captain (2x points)",
      "9. GET /api/ai/matchday?email=...&password=... — Check if matchday is OPEN (can still change squad)",
      "10. GET /api/ai/leaderboard?email=...&password=... — See how you rank against others",
    ],
  });
}
