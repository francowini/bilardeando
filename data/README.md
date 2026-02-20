# Data Pipeline — API-Football (Liga Profesional Argentina)

Pre-fetched player and team data from [API-Football](https://www.api-football.com/) for the fantasy football app. All data is committed to the repo so **no API key is needed at development time**.

## Directory Structure

```
data/
├── raw/                          # Raw API responses (33 JSON files)
│   ├── teams.json                # GET /teams?league=128&season=2024
│   ├── squads/{teamId}.json      # GET /players/squads?team={id} × 28 teams
│   ├── topscorers.json           # GET /players/topscorers?league=128&season=2024
│   ├── topassists.json           # GET /players/topassists?league=128&season=2024
│   ├── topyellowcards.json       # GET /players/topyellowcards?league=128&season=2024
│   └── topredcards.json          # GET /players/topredcards?league=128&season=2024
├── processed/                    # Clean, DB-ready JSON (what you should consume)
│   ├── teams.json                # 28 teams with tier, logo, venue
│   └── players.json              # 889 players with position, fantasyPrice, stats
├── scripts/
│   ├── fetch-api-football.mjs    # Step 1: Download from API
│   ├── process-data.mjs          # Step 2: Transform raw → processed
│   └── apply-manual-adjustments.mjs  # Step 3: Apply research-based price corrections
└── README.md                     # This file
```

## For Development (Most Common Case)

**Just import the processed JSON files.** No scripts to run.

```ts
// In prisma/seed.ts or any service
import teams from '../../data/processed/teams.json';
import players from '../../data/processed/players.json';
```

### Team Shape

```ts
{
  apiId: number,        // API-Football team ID (e.g. 451 = Boca Juniors)
  name: string,         // "Boca Juniors"
  code: string,         // "BOC"
  logo: string,         // URL to team logo PNG
  founded: number,
  venue: { name, city, capacity, image } | null,
  tier: 1 | 2 | 3       // 1 = big club, 2 = mid-table, 3 = smaller
}
```

### Player Shape

```ts
{
  apiId: number,         // API-Football player ID
  name: string,          // "A. Martínez"
  photo: string,         // URL to player photo PNG
  age: number | null,
  number: number | null, // Shirt number
  position: "GK" | "DEF" | "MID" | "FWD",
  teamApiId: number,     // Links to team.apiId
  teamName: string,
  stats: {               // null for ~844 players without ranking data
    rating: number | null,
    appearances: number,
    minutes: number,
    goals: number,
    assists: number,
    yellowCards: number,
    redCards: number,
    shots: number | null,
    shotsOn: number | null,
    passes: number | null,
    passAccuracy: number | null,
    tackles: number | null,
    saves: number | null,
  } | null,
  hasRealStats: boolean, // true for ~45 players from ranking endpoints
  fantasyPrice: number,  // $1M–$15M (virtual currency)
  // Optional fields (present on adjusted players):
  notes?: string,        // Human-readable context
  manuallyAdjusted?: boolean,
  manuallyAdded?: boolean,
}
```

## Data Stats

| Metric | Value |
|---|---|
| Teams | 28 (all Liga Profesional Argentina 2024) |
| Players | 889 |
| Players with real stats | 45 (from top scorers/assists/cards rankings) |
| Players without stats | 844 (have name, photo, position, age, number) |
| Price range | $1M – $15M |
| Median price | $3.6M |
| Manually adjusted | 37 players (based on Feb 2026 research) |
| Manually added | 2 players (Bareiro, O. Romero — signed Feb 2026) |

## Fantasy Price Logic

Prices are assigned in three layers:

1. **Algorithmic (process-data.mjs)**: Two-tier formula:
   - Players with stats: power score (goals×3 + assists×2 + rating bonus + appearances) normalized via sqrt curve to $8M–$15M
   - Players without stats: position base × tier multiplier × age factor → $1M–$7M

2. **Manual adjustments (apply-manual-adjustments.mjs)**: Research-based corrections for ~40 well-known players. Examples:
   - Di María: $3M → $14M (World Cup winner, 10G in 22 matches)
   - Cavani: $12.5M → $4M (retiring, barely plays)
   - Paredes: $4.3M → $10M (World Cup winner, key Boca signing)

3. **Team tiers** affect base price:
   - Tier 1 (×1.25): Boca, River, Racing, Independiente, San Lorenzo, Vélez, Estudiantes
   - Tier 2 (×1.0): Lanús, Talleres, Newell's, Rosario Central, etc.
   - Tier 3 (×0.8): Barracas Central, Riestra, Platense, etc.

## Re-fetching Data (Only If Needed)

You only need to re-run these if you want fresh data from the API (e.g. new season).

### Prerequisites

- `API_FOOTBALL_KEY` in `.env` (free tier: 100 req/day, 10 req/min)
- Node.js 18+ (uses native `fetch`)

### Pipeline

```bash
# Step 1: Fetch raw data from API-Football (33 requests, ~3 min due to rate limiting)
node data/scripts/fetch-api-football.mjs

# Step 2: Process raw → clean JSON with algorithmic prices
node data/scripts/process-data.mjs

# Step 3: Apply manual price adjustments based on research
node data/scripts/apply-manual-adjustments.mjs
```

The fetch script is **resumable** — it skips files that already have valid data. Safe to re-run if interrupted.

### Rate Limits

The free tier allows 10 requests/minute. The fetch script auto-throttles with 62s pauses between batches. Total runtime: ~3–4 minutes for all 33 requests.

## API-Football Reference

- **Base URL**: `https://v3.football.api-sports.io`
- **Auth header**: `x-apisports-key: {YOUR_KEY}`
- **Liga Profesional Argentina**: league ID `128`
- **Season used**: 2024 (2025 blocked on free tier)
- **Free tier**: 100 requests/day, no credit card
- **Docs**: https://www.api-football.com/documentation-v3

### Key Team IDs

| Team | ID |
|---|---|
| Boca Juniors | 451 |
| River Plate | 435 |
| Racing Club | 436 |
| Independiente | 453 |
| San Lorenzo | 460 |
| Vélez Sarsfield | 438 |
| Lanús | 446 |
| Rosario Central | 437 |

See `data/processed/teams.json` for all 28 teams.
