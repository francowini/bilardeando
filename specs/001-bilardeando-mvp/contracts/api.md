# API Contract: Bilardeando MVP

**Feature**: `001-bilardeando-mvp` | **Date**: 2026-02-20
**Base URL**: `/api` | **Auth**: JWT via Auth.js (NextAuth v5)

> Note: Most mutations use **Server Actions** (not API routes) for form-based interactions.
> API routes are used for: webhooks, programmatic access, and data fetching.

---

## Authentication

### POST `/api/auth/send-otp`

Send OTP code to phone number via WhatsApp.

**Request:**
```json
{ "phone": "+5491112345678" }
```

**Response (200):**
```json
{ "success": true, "expiresIn": 300 }
```

**Errors:** `429` rate limit (max 3 attempts per 5 min), `400` invalid phone format.

### Auth.js Routes (managed by NextAuth)

- `POST /api/auth/callback/credentials` — Verify OTP (phone + code)
- `GET /api/auth/callback/google` — Google OAuth callback
- `GET /api/auth/session` — Get current session
- `POST /api/auth/signout` — Sign out

---

## Players

### GET `/api/players`

List all available players with optional filters.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `position` | `GK\|DEF\|MID\|FWD` | Filter by position |
| `teamId` | `string` | Filter by team |
| `search` | `string` | Search by player name |
| `sort` | `value\|name\|rating` | Sort field (default: `value`) |
| `order` | `asc\|desc` | Sort order (default: `desc`) |

**Response (200):**
```json
{
  "players": [
    {
      "id": "clx...",
      "name": "Enzo Fernández",
      "position": "MID",
      "photo": "https://...",
      "marketValue": 1200,
      "team": { "id": "clx...", "name": "River Plate", "shortName": "RIV", "logo": "https://..." },
      "recentRating": 7.8,
      "seasonStats": { "goals": 5, "assists": 8, "matches": 12 }
    }
  ],
  "total": 80
}
```

### GET `/api/players/[id]`

Get single player details with full stats.

**Response (200):**
```json
{
  "id": "clx...",
  "name": "Enzo Fernández",
  "position": "MID",
  "photo": "https://...",
  "marketValue": 1200,
  "team": { "id": "clx...", "name": "River Plate", "shortName": "RIV", "logo": "https://..." },
  "matchStats": [
    { "matchdayNumber": 1, "rating": 7.2, "goals": 0, "assists": 1, "minutes": 90 },
    { "matchdayNumber": 2, "rating": 8.1, "goals": 1, "assists": 0, "minutes": 85 }
  ]
}
```

---

## Squad

### GET `/api/squad`

Get the current user's squad. **Requires auth.**

**Response (200):**
```json
{
  "id": "clx...",
  "formation": "4-3-3",
  "budget": 2500,
  "starters": [
    {
      "id": "clx...",
      "player": { "id": "clx...", "name": "...", "position": "GK", "photo": "...", "marketValue": 800 },
      "role": "STARTER",
      "isCaptain": false,
      "isCaptainSub": false
    }
  ],
  "bench": [
    {
      "id": "clx...",
      "player": { "id": "clx...", "name": "...", "position": "DEF", "photo": "...", "marketValue": 500 },
      "role": "BENCH",
      "isCaptain": false,
      "isCaptainSub": false
    }
  ]
}
```

**Error:** `404` if user has no squad yet.

### Server Action: `saveSquad`

Create or update the user's squad.

**Input:**
```typescript
{
  formation: string;          // "4-3-3"
  starters: {
    playerId: string;
    isCaptain: boolean;
    isCaptainSub: boolean;
  }[];                        // length: 11
  bench: {
    playerId: string;
  }[];                        // length: 7
}
```

**Validation:**
- 11 starters + 7 bench = 18 total
- Positions match formation
- Total value <= budget
- Exactly 1 captain, 1 captain sub among starters
- No duplicate players

### Server Action: `updateFormation`

Change formation during OPEN phase.

**Input:**
```typescript
{ formation: string }
```

**Validation:** Current players can fill the new formation, matchday must be OPEN.

---

## Matchday

### GET `/api/matchday/current`

Get the current active matchday with match details.

**Response (200):**
```json
{
  "id": "clx...",
  "number": 3,
  "status": "LIVE",
  "lockTime": "2026-02-22T18:00:00Z",
  "matches": [
    {
      "id": "clx...",
      "homeTeam": { "id": "clx...", "name": "River Plate", "shortName": "RIV", "logo": "..." },
      "awayTeam": { "id": "clx...", "name": "Boca Juniors", "shortName": "BOC", "logo": "..." },
      "homeScore": 2,
      "awayScore": 1,
      "status": "FINISHED",
      "kickoff": "2026-02-22T18:00:00Z"
    }
  ]
}
```

### GET `/api/matchday/[id]/results`

Get user's squad results for a specific matchday. **Requires auth.**

**Response (200):**
```json
{
  "matchdayNumber": 3,
  "totalPoints": 67.5,
  "starters": [
    {
      "player": { "name": "...", "position": "GK", "photo": "..." },
      "rating": 7.2,
      "multiplier": 1.0,
      "points": 7.2,
      "isCaptain": false,
      "matchStatus": "FINISHED"
    }
  ],
  "bench": [
    {
      "player": { "name": "...", "position": "DEF", "photo": "..." },
      "rating": 6.8,
      "multiplier": 0.5,
      "points": 3.4,
      "matchStatus": "FINISHED"
    }
  ]
}
```

### POST `/api/admin/matchday/simulate` (Admin only)

Trigger matchday lifecycle progression for demo purposes.

**Request:**
```json
{ "matchdayId": "clx...", "targetStatus": "RESULTS" }
```

**Response (200):**
```json
{ "matchdayId": "clx...", "newStatus": "RESULTS", "scoresProcessed": true }
```

---

## Leaderboard

### GET `/api/leaderboard`

Get global tournament leaderboard.

**Query params:**
| Param | Type | Description |
|---|---|---|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 50) |

**Response (200):**
```json
{
  "rankings": [
    { "rank": 1, "userId": "clx...", "userName": "Juan", "totalPoints": 142.5 },
    { "rank": 2, "userId": "clx...", "userName": "Maria", "totalPoints": 138.0 }
  ],
  "userRank": { "rank": 15, "totalPoints": 98.5 },
  "total": 250,
  "page": 1
}
```

### GET `/api/leaderboard/league/[leagueId]`

Get private league leaderboard. **Requires auth + league membership.**

**Response (200):**
```json
{
  "leagueId": "clx...",
  "leagueName": "Los Pibes",
  "rankings": [
    { "rank": 1, "userId": "clx...", "userName": "Juan", "totalPoints": 85.0, "prizeAmount": null }
  ],
  "total": 8
}
```

---

## Transfers

### Server Action: `buyPlayer`

Buy a player during OPEN phase. **Requires auth.**

**Input:**
```typescript
{ playerId: string, role: "STARTER" | "BENCH" }
```

**Validation:** Matchday must be OPEN, budget sufficient, squad not full for role.

### Server Action: `sellPlayer`

Sell a player during OPEN phase. 10% sell tax applied. **Requires auth.**

**Input:**
```typescript
{ squadPlayerId: string }
```

**Returns:** Amount credited (90% of market value).

### Server Action: `swapPlayers`

Swap a starter with a bench player during LOCK phase. **Requires auth + payment.**

**Input:**
```typescript
{ starterId: string, benchId: string }
```

**Validation:**
- Same position
- Both players' matches not yet started
- Payment confirmed ($2,000 ARS)
- Creates a Transaction + redirects to Mercado Pago if not yet paid

---

## Leagues

### GET `/api/leagues`

List user's leagues. **Requires auth.**

**Response (200):**
```json
{
  "leagues": [
    {
      "id": "clx...",
      "name": "Los Pibes",
      "buyIn": 25000,
      "memberCount": 8,
      "maxPlayers": 20,
      "status": "ACTIVE",
      "startMatchday": 3,
      "endMatchday": 10,
      "myRank": 2
    }
  ]
}
```

### GET `/api/leagues/[id]`

Get league details.

**Response (200):**
```json
{
  "id": "clx...",
  "name": "Los Pibes",
  "inviteCode": "abc123",
  "inviteUrl": "https://bilardeando.com/liga/abc123",
  "buyIn": 25000,
  "rakePct": 10,
  "prizePool": 200000,
  "status": "ACTIVE",
  "startMatchday": 3,
  "endMatchday": 10,
  "members": [
    { "userId": "clx...", "userName": "Juan", "totalPoints": 85.0, "rank": 1, "paid": true }
  ],
  "prizeDistribution": [
    { "position": 1, "percentage": 60 },
    { "position": 2, "percentage": 30 },
    { "position": 3, "percentage": 10 }
  ]
}
```

### GET `/api/leagues/join/[inviteCode]`

Get league info from invite link (public, no auth required).

**Response (200):**
```json
{
  "id": "clx...",
  "name": "Los Pibes",
  "buyIn": 25000,
  "memberCount": 5,
  "maxPlayers": 20,
  "creatorName": "Juan",
  "startMatchday": 3,
  "endMatchday": 10
}
```

### Server Action: `createLeague`

Create a private league. **Requires auth.**

**Input:**
```typescript
{
  name: string;
  buyIn: number;          // 10000-100000 in 5000 steps
  maxPlayers: number;     // 3-20
  startMatchday: number;  // Must be future matchday
  endMatchday: number;    // Must be after start
}
```

### Server Action: `joinLeague`

Join a league via invite code. Triggers Mercado Pago payment. **Requires auth.**

**Input:**
```typescript
{ inviteCode: string }
```

**Flow:** Validates league is OPEN + not full → creates Transaction → redirects to Mercado Pago for buy-in payment → webhook confirms → user added to league.

---

## Wallet

### GET `/api/wallet`

Get user's wallet info. **Requires auth.**

**Response (200):**
```json
{
  "balance": 15000,
  "feeWaived": false,
  "transactions": [
    {
      "id": "clx...",
      "type": "BALANCE_LOAD",
      "amount": 20000,
      "status": "CONFIRMED",
      "description": "Carga de saldo",
      "createdAt": "2026-02-20T15:30:00Z"
    }
  ]
}
```

### Server Action: `loadBalance`

Initiate balance load via Mercado Pago. **Requires auth.**

**Input:**
```typescript
{ amount: number }  // ARS amount to load
```

**Flow:** Creates Transaction → creates Mercado Pago Preference → redirects to checkout.

---

## Webhooks (External → Our App)

### POST `/api/webhooks/mercadopago`

Receive Mercado Pago payment notifications.

**Headers:**
- `x-signature`: HMAC-SHA256 signature
- `x-request-id`: Request ID for signature validation

**Body:**
```json
{
  "type": "payment",
  "action": "payment.created",
  "data": { "id": "999999999" }
}
```

**Handler:**
1. Validate signature (HMAC-SHA256)
2. Fetch payment via `Payment.get({ id })`
3. If `status === "approved"`: update Transaction → execute business logic (add to league, unlock swap, credit balance)
4. Return `200`

### POST `/api/webhooks/whatsapp`

Receive WhatsApp messages from bot users (post-hackathon).

**Handler:**
1. Parse incoming message
2. Route to bot command handler (view squad, scores, leaderboard, swap)
3. Respond via WhatsApp provider

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Squad must have exactly 11 starters",
    "details": { "starterCount": 10 }
  }
}
```

**Common error codes:**
| Code | HTTP | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized for this action |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `MATCHDAY_LOCKED` | 409 | Action not allowed in current matchday phase |
| `INSUFFICIENT_BUDGET` | 409 | Not enough budget for purchase |
| `PAYMENT_REQUIRED` | 402 | Action requires payment |
