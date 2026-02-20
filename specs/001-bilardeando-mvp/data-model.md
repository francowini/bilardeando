# Data Model: Bilardeando MVP

**Feature**: `001-bilardeando-mvp` | **Date**: 2026-02-20
**ORM**: Prisma | **Database**: PostgreSQL (Supabase)

---

## Entity Relationship Overview

```
User ──1:N── Squad
User ──1:N── Transaction
User ──N:M── League (via LeagueMember)
User ──1:N── OtpCode

Squad ──N:M── Player (via SquadPlayer)

Team ──1:N── Player

Tournament ──1:N── Matchday
Matchday ──1:N── Match
Match ──1:N── PlayerMatchStats

League ──1:1── Tournament
League ──1:N── LeagueMember
LeagueMember ──1:1── User
```

---

## Prisma Schema

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// ─── AUTH (Auth.js / NextAuth) ───────────────────────────

model User {
  id            String    @id @default(cuid())
  phone         String?   @unique
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?

  // App-specific
  balance       Int       @default(0)        // Wallet balance in ARS cents
  isPremium     Boolean   @default(false)    // AI features unlocked
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts      Account[]
  sessions      Session[]
  squads        Squad[]
  transactions  Transaction[]
  leagueMemberships LeagueMember[]
  createdLeagues    League[]
  otpCodes      OtpCode[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model OtpCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  expires   DateTime
  used      Boolean  @default(false)
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@index([phone, code])
}

// ─── FOOTBALL DATA ───────────────────────────────────────

model Team {
  id          String   @id @default(cuid())
  name        String
  shortName   String
  logo        String?  // URL to team crest
  createdAt   DateTime @default(now())

  players     Player[]
  homeMatches Match[]  @relation("HomeTeam")
  awayMatches Match[]  @relation("AwayTeam")
}

model Player {
  id          String   @id @default(cuid())
  externalId  String?  @unique  // API-Football player ID
  name        String
  position    Position
  photo       String?  // URL to player photo
  marketValue Int      // Virtual currency value (in millions * 100 for precision)
  teamId      String
  team        Team     @relation(fields: [teamId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  squadPlayers     SquadPlayer[]
  matchStats       PlayerMatchStats[]

  @@index([teamId])
  @@index([position])
}

enum Position {
  GK
  DEF
  MID
  FWD
}

// ─── SQUAD ───────────────────────────────────────────────

model Squad {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  formation   String    // e.g. "4-3-3", "4-4-2", "3-5-2"
  budget      Int       @default(10000) // Remaining budget (value * 100 for precision, starts at 100M = 10000)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  players     SquadPlayer[]

  @@index([userId])
}

model SquadPlayer {
  id          String      @id @default(cuid())
  squadId     String
  squad       Squad       @relation(fields: [squadId], references: [id], onDelete: Cascade)
  playerId    String
  player      Player      @relation(fields: [playerId], references: [id])
  role        SquadRole   // STARTER, BENCH
  isCaptain   Boolean     @default(false)
  isCaptainSub Boolean    @default(false)  // Captain substitute
  createdAt   DateTime    @default(now())

  @@unique([squadId, playerId])
  @@index([squadId])
}

enum SquadRole {
  STARTER
  BENCH
}

// ─── TOURNAMENT & MATCHDAY ────────────────────────────────

model Tournament {
  id          String   @id @default(cuid())
  name        String   // e.g. "Copa de la Liga 2026"
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  matchdays   Matchday[]
  leagues     League[]
}

model Matchday {
  id            String        @id @default(cuid())
  tournamentId  String
  tournament    Tournament    @relation(fields: [tournamentId], references: [id])
  number        Int           // Matchday number (1, 2, 3...)
  status        MatchdayStatus @default(OPEN)
  lockTime      DateTime?     // When first match kicks off
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  matches       Match[]

  @@unique([tournamentId, number])
  @@index([tournamentId])
  @@index([status])
}

enum MatchdayStatus {
  OPEN       // Squad changes allowed
  LOCK       // First match kicked off, squad frozen
  LIVE       // Matches in progress
  RESULTS    // All matches finished, scores processed
}

model Match {
  id            String      @id @default(cuid())
  matchdayId    String
  matchday      Matchday    @relation(fields: [matchdayId], references: [id])
  homeTeamId    String
  homeTeam      Team        @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeamId    String
  awayTeam      Team        @relation("AwayTeam", fields: [awayTeamId], references: [id])
  homeScore     Int?
  awayScore     Int?
  status        MatchStatus @default(SCHEDULED)
  kickoff       DateTime
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  playerStats   PlayerMatchStats[]

  @@index([matchdayId])
  @@index([status])
}

enum MatchStatus {
  SCHEDULED
  LIVE
  FINISHED
  POSTPONED
}

model PlayerMatchStats {
  id          String  @id @default(cuid())
  playerId    String
  player      Player  @relation(fields: [playerId], references: [id])
  matchId     String
  match       Match   @relation(fields: [matchId], references: [id])
  rating      Float   // API-Football numeric rating (6.0-10.0)
  minutes     Int     @default(0)
  goals       Int     @default(0)
  assists     Int     @default(0)
  cleanSheet  Boolean @default(false)
  yellowCards Int     @default(0)
  redCards    Int     @default(0)
  saves       Int     @default(0)
  createdAt   DateTime @default(now())

  @@unique([playerId, matchId])
  @@index([matchId])
  @@index([playerId])
}

// ─── LEAGUES ──────────────────────────────────────────────

model League {
  id              String       @id @default(cuid())
  name            String
  creatorId       String
  creator         User         @relation(fields: [creatorId], references: [id])
  tournamentId    String
  tournament      Tournament   @relation(fields: [tournamentId], references: [id])
  inviteCode      String       @unique @default(cuid()) // Shareable invite code
  buyIn           Int          // Buy-in amount in ARS cents (10000-100000 in $5000 steps)
  rakePct         Int          @default(10) // Platform rake percentage (e.g. 10 = 10%)
  minPlayers      Int          @default(3)
  maxPlayers      Int          @default(20)
  startMatchday   Int          // Matchday number when league starts
  endMatchday     Int          // Matchday number when league ends
  status          LeagueStatus @default(OPEN)
  prizePool       Int          @default(0) // Accumulated prize pool in ARS cents
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  members         LeagueMember[]

  @@index([inviteCode])
  @@index([status])
}

enum LeagueStatus {
  OPEN        // Accepting new members
  ACTIVE      // League started, no new members
  FINISHED    // League ended, prizes distributed
  CANCELLED   // Auto-cancelled (fewer than 3 players)
}

model LeagueMember {
  id          String   @id @default(cuid())
  leagueId    String
  league      League   @relation(fields: [leagueId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  paid        Boolean  @default(false)
  totalPoints Float    @default(0) // Accumulated points in this league
  rank        Int?
  prizeAmount Int?     // Prize won (null if not winner)
  joinedAt    DateTime @default(now())

  @@unique([leagueId, userId])
  @@index([leagueId])
}

// ─── WALLET & TRANSACTIONS ────────────────────────────────

model Transaction {
  id                String            @id @default(cuid())
  userId            String
  user              User              @relation(fields: [userId], references: [id])
  type              TransactionType
  amount            Int               // Amount in ARS cents (positive = credit, negative = debit)
  status            TransactionStatus @default(PENDING)
  description       String?
  externalReference String?           @unique // Mercado Pago external_reference
  mpPaymentId       String?           // Mercado Pago payment ID
  metadata          Json?             // Flexible metadata (league_id, swap details, etc.)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([userId])
  @@index([status])
  @@index([externalReference])
}

enum TransactionType {
  BALANCE_LOAD     // User loads funds via Mercado Pago
  SWAP_PURCHASE    // Paid substitution ($2,000 ARS)
  BUDGET_PURCHASE  // Buy additional squad budget
  LEAGUE_BUY_IN    // Pay to join a private league
  LEAGUE_REFUND    // Auto-refund from cancelled league
  PRIZE_PAYOUT     // Prize distribution from finished league
  SERVICE_FEE      // Platform service fee
}

enum TransactionStatus {
  PENDING
  CONFIRMED
  FAILED
  REFUNDED
}
```

---

## Validation Rules

### Squad Validation
- Exactly 18 players (11 starters + 7 bench)
- Exactly 1 starter with `isCaptain = true`
- Exactly 1 starter with `isCaptainSub = true`
- Captain and captain sub must be different players
- Starters must match formation (e.g., 4-3-3 = 1 GK + 4 DEF + 3 MID + 3 FWD)
- Total player market values must not exceed budget
- No duplicate players in squad

### Formation Rules
| Formation | GK | DEF | MID | FWD |
|---|---|---|---|---|
| 4-3-3 | 1 | 4 | 3 | 3 |
| 4-4-2 | 1 | 4 | 4 | 2 |
| 3-5-2 | 1 | 3 | 5 | 2 |
| 3-4-3 | 1 | 3 | 4 | 3 |
| 5-3-2 | 1 | 5 | 3 | 2 |
| 5-4-1 | 1 | 5 | 4 | 1 |
| 4-5-1 | 1 | 4 | 5 | 1 |

### Transfer Rules
- Only allowed during OPEN matchday status
- Sell tax: 10% (user recovers 90% of current market value)
- Budget must remain >= 0 after purchase

### Substitution Rules (During LOCK/LIVE)
- Same position only (DEF <-> DEF, MID <-> MID, etc.)
- Both players' matches must not have started (match status = SCHEDULED)
- Costs $2,000 ARS per swap (Transaction created)
- Formation stays frozen

### League Rules
- Buy-in: $10,000 to $100,000 ARS in $5,000 steps
- 3-20 members
- Auto-cancel if < 3 members by start matchday lock
- Prize distribution (poker-style):
  - 3-6 members: top 1-2 paid
  - 7-15 members: top 3 paid
  - 16-20 members: top 4 paid

### Scoring
- Starter multiplier: 1.0x rating
- Bench multiplier: 0.5x rating
- Captain multiplier: 2.0x rating
- Captain sub: inherits 2.0x if captain has 0 minutes played

---

## State Transitions

### Matchday Lifecycle
```
OPEN ──[first match kickoff]──> LOCK ──[matches in progress]──> LIVE ──[all matches end]──> RESULTS ──[admin/cron opens]──> OPEN
```

### League Lifecycle
```
OPEN ──[start matchday locks + >=3 members]──> ACTIVE ──[end matchday results processed]──> FINISHED
OPEN ──[start matchday locks + <3 members]──> CANCELLED (full refund)
```

### Transaction Lifecycle
```
PENDING ──[webhook confirms]──> CONFIRMED
PENDING ──[webhook rejects]──> FAILED
CONFIRMED ──[league cancelled]──> REFUNDED
```

---

## Indexes & Performance Notes

- All foreign keys are indexed
- `SquadPlayer` has a unique composite on `[squadId, playerId]` to prevent duplicates
- `PlayerMatchStats` has a unique composite on `[playerId, matchId]`
- `Transaction.externalReference` is unique for Mercado Pago deduplication
- `League.inviteCode` is unique and indexed for fast invite link lookups
- `Matchday.status` is indexed for quick lifecycle queries
- Balance is stored in ARS cents (integer) to avoid floating-point issues
- Market values stored as int (multiply by factor for display)
