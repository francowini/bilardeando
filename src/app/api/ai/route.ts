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
    version: "1.0",
    description:
      "API for AI agents to manage fantasy football squads. " +
      "Authenticate with x-user-email and x-user-password headers on every request.",
    authentication: {
      method: "Plain text headers",
      headers: {
        "x-user-email": "User's email address (e.g. franco@test.com)",
        "x-user-password": "Password (demo123 for all users)",
      },
      example: 'curl -H "x-user-email: franco@test.com" -H "x-user-password: demo123"',
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
          example_curl:
            'curl -H "x-user-email: franco@test.com" -H "x-user-password: demo123" https://HOST/api/ai/squad',
        },
        {
          method: "GET",
          path: "/api/ai/players",
          description: "Search the player market. Supports filters and pagination.",
          query_params: {
            search: "Filter by player/team name (e.g. ?search=messi)",
            position: "Filter by position: GK, DEF, MID, FWD",
            teamId: "Filter by team ID (integer)",
            sortBy: "Sort by: rating (default), value, name",
            onlyFree: "Set to 1 to exclude players already in your squad",
            page: "Page number (default 1)",
            pageSize: "Items per page (default 20, max 100)",
          },
          example_curl:
            'curl -H "x-user-email: franco@test.com" -H "x-user-password: demo123" "https://HOST/api/ai/players?position=FWD&sortBy=rating&pageSize=5&onlyFree=1"',
        },
        {
          method: "GET",
          path: "/api/ai/budget",
          description: "Get your current budget, squad value, and sell tax rate",
          example_curl:
            'curl -H "x-user-email: franco@test.com" -H "x-user-password: demo123" https://HOST/api/ai/budget',
        },
        {
          method: "GET",
          path: "/api/ai/matchday",
          description: "Get current matchday info: status, matches, scores",
          example_curl:
            'curl -H "x-user-email: franco@test.com" -H "x-user-password: demo123" https://HOST/api/ai/matchday',
        },
        {
          method: "GET",
          path: "/api/ai/teams",
          description: "List all teams with their IDs (useful for filtering players)",
          example_curl:
            'curl -H "x-user-email: franco@test.com" -H "x-user-password: demo123" https://HOST/api/ai/teams',
        },
        {
          method: "GET",
          path: "/api/ai/leaderboard",
          description: "Get tournament leaderboard (rankings by total points)",
          query_params: {
            page: "Page number (default 1)",
            pageSize: "Items per page (default 20)",
          },
          example_curl:
            'curl -H "x-user-email: franco@test.com" -H "x-user-password: demo123" https://HOST/api/ai/leaderboard',
        },
      ],
      actions: [
        {
          method: "POST",
          path: "/api/ai/squad/buy",
          description: "Buy a player and add to your squad (deducts from virtualBudget)",
          body: { playerId: 42 },
          example_curl:
            'curl -X POST -H "x-user-email: franco@test.com" -H "x-user-password: demo123" -H "Content-Type: application/json" -d \'{"playerId": 42}\' https://HOST/api/ai/squad/buy',
        },
        {
          method: "POST",
          path: "/api/ai/squad/sell",
          description: "Sell a player from your squad (90% refund to virtualBudget)",
          body: { playerId: 42 },
          example_curl:
            'curl -X POST -H "x-user-email: franco@test.com" -H "x-user-password: demo123" -H "Content-Type: application/json" -d \'{"playerId": 42}\' https://HOST/api/ai/squad/sell',
        },
        {
          method: "POST",
          path: "/api/ai/squad/toggle-starter",
          description: "Toggle a player between starter and bench",
          body: { playerId: 42 },
          example_curl:
            'curl -X POST -H "x-user-email: franco@test.com" -H "x-user-password: demo123" -H "Content-Type: application/json" -d \'{"playerId": 42}\' https://HOST/api/ai/squad/toggle-starter',
        },
        {
          method: "POST",
          path: "/api/ai/squad/swap",
          description: "Swap two players (e.g. swap a starter with a bench player)",
          body: { playerIdA: 42, playerIdB: 18 },
          example_curl:
            'curl -X POST -H "x-user-email: franco@test.com" -H "x-user-password: demo123" -H "Content-Type: application/json" -d \'{"playerIdA": 42, "playerIdB": 18}\' https://HOST/api/ai/squad/swap',
        },
        {
          method: "POST",
          path: "/api/ai/squad/captain",
          description: 'Set captain (2x points) or vice-captain. Role must be "captain" or "captainSub".',
          body: { playerId: 42, role: "captain" },
          example_curl:
            'curl -X POST -H "x-user-email: franco@test.com" -H "x-user-password: demo123" -H "Content-Type: application/json" -d \'{"playerId": 42, "role": "captain"}\' https://HOST/api/ai/squad/captain',
        },
        {
          method: "POST",
          path: "/api/ai/squad/formation",
          description: `Change formation. Available: ${FORMATION_CODES.join(", ")}. Players auto-adjust to fit.`,
          body: { formation: "4-4-2" },
          example_curl:
            'curl -X POST -H "x-user-email: franco@test.com" -H "x-user-password: demo123" -H "Content-Type: application/json" -d \'{"formation": "4-4-2"}\' https://HOST/api/ai/squad/formation',
        },
      ],
    },
    recommended_workflow: [
      "1. GET /api/ai/budget — Check how much money you have",
      "2. GET /api/ai/squad — See your current squad (may be empty)",
      "3. GET /api/ai/teams — Get team IDs for filtering",
      "4. GET /api/ai/players?onlyFree=1&position=GK&sortBy=rating — Find best available players by position",
      "5. POST /api/ai/squad/buy — Buy players to fill your squad (11 starters + up to 7 bench)",
      "6. POST /api/ai/squad/formation — Set your preferred formation",
      "7. POST /api/ai/squad/toggle-starter — Move players between starter/bench",
      "8. POST /api/ai/squad/captain — Set your best player as captain (2x points)",
      "9. GET /api/ai/matchday — Check if matchday is OPEN (can still change squad)",
      "10. GET /api/ai/leaderboard — See how you rank against others",
    ],
  });
}
