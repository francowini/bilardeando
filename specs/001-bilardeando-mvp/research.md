# Research: Bilardeando MVP

**Feature**: `001-bilardeando-mvp` | **Date**: 2026-02-20

> All NEEDS CLARIFICATION items from the Technical Context have been resolved below.

---

## 1. Stats Provider API

### Decision: API-Football (api-football.com)

**Rationale**: Only provider with a free tier that includes Argentine Liga Profesional AND per-player match ratings. Covers all MVP requirements at $0/month.

**Alternatives considered**:

| Provider | Verdict | Why rejected |
|---|---|---|
| SportMonks | Best ratings (51-metric system), but EUR 112+/mo minimum for Argentine league | Too expensive for hackathon/early stage |
| football-data.org | No per-player match ratings — dealbreaker per MVP spec ("points come directly from stats provider API") | Missing core data point |

**Key API-Football capabilities**:
- `/fixtures/players` endpoint returns per-player per-fixture `rating` field (numeric)
- Player photos via `player_image` URL
- Argentine Liga Profesional covered on all plans (including free)
- Free tier: 100 requests/day (sufficient for post-match data ingestion)
- Pro tier ($19/mo): 7,500 req/day — more than enough at scale

**Hackathon approach**: Mock data layer with JSON fixtures. Interface `StatsProvider` allows seamless swap to API-Football post-hackathon.

---

## 2. WhatsApp Business API Provider

### Decision: Mock for hackathon, Meta Cloud API Direct for production

**Rationale**: Meta Cloud API has zero platform fees, official Node.js SDK, and cheapest per-message rates. For the hackathon, a mock provider with console/DB logging is fastest to implement.

**Alternatives considered**:

| Provider | Monthly Fixed | Markup/msg | Verdict |
|---|---|---|---|
| Meta Cloud API (Direct) | $0 | $0 | **Production choice** — cheapest, official SDK |
| Gupshup | $0 | ~$0.001/msg + 6% marketing | Good fallback if Meta verification is slow |
| 360dialog | $49/mo | $0 | Fixed cost bad for early stage |
| Twilio | $0 | $0.005/msg | Best DX but most expensive per message |

**Argentina per-message rates (Meta's base)**:
- Authentication (OTP): $0.026
- Utility (notifications): $0.026
- Service (bot replies within 24h): **FREE**

**Hackathon approach**:
- `MockWhatsAppProvider`: logs messages to DB, shown in admin panel as simulated chat
- OTP bypass: accept `000000` in dev mode
- Optional: Twilio sandbox for live demo (5-min setup, free, shared number)

**Production migration path**: Apply for Meta Business verification, implement `MetaCloudProvider` using official SDK.

---

## 3. Mercado Pago Integration

### Decision: Checkout Pro with server-side redirect flow

**Rationale**: Simplest integration — create a Preference on the server, redirect user to Mercado Pago, handle webhook on return. No frontend SDK needed. Well-documented with an official Node.js reference implementation.

**Key SDK Pattern**:

```typescript
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Create payment link
const preference = await new Preference(client).create({
  body: {
    items: [{ id, title, quantity: 1, unit_price }],
    back_urls: { success, failure, pending },
    notification_url: webhookUrl,
    external_reference: "user-123-league-456",
    metadata: { user_id, league_id },
  }
});
// Redirect to: preference.sandbox_init_point (test) or preference.init_point (prod)
```

**Webhook handling**: POST to `/api/webhooks/mercadopago`, validate signature via HMAC-SHA256, fetch full payment via `Payment.get({ id })`, update DB on `status === "approved"`.

**Sandbox setup**:
- Test credentials: `TEST-xxxx` prefix
- Test cards: Visa `4509 9535 6623 3704`, Mastercard `5031 7557 3453 0604`
- Simulate outcomes via cardholder name: `APRO` (approved), `OTHE` (declined), `CONT` (pending)
- Local webhook testing: ngrok tunnel to expose localhost

**Hackathon approach**: Mercado Pago sandbox works end-to-end with test accounts and test cards. This is one integration we can demo live (not mocked).

---

## 4. Authentication Pattern

### Decision: Auth.js v5 (NextAuth) with Credentials provider (phone OTP) + Google OAuth provider

**Rationale**: Auth.js handles OAuth complexity (redirect, callback, token exchange), has a built-in Prisma adapter, and supports JWT sessions needed for the Credentials provider. Custom OTP logic is ~50 lines of code.

**Key decisions**:
- **Session strategy**: JWT (required when using Credentials provider)
- **Account linking**: By phone number — Google users link via phone verification flow
- **OTP delivery**: Via WhatsApp provider interface (mocked for hackathon)
- **OTP bypass in dev**: Accept `000000` as valid code

**Alternatives considered**:
- Custom JWT auth — more work for same result, no OAuth support out of the box
- Clerk/Auth0 — adds vendor dependency, overkill for hackathon

---

## 5. Database & Hosting

### Decision: PostgreSQL on Supabase with Prisma ORM

**Rationale**: Supabase provides free PostgreSQL with built-in connection pooling (PgBouncer on port 6543), eliminating the #1 Prisma-on-Vercel pain point. Free tier is generous for hackathon.

**Prisma setup**:
- `prisma/schema.prisma` at repo root
- Connection pooling via Supabase PgBouncer: `DATABASE_URL` (port 6543) + `DIRECT_DATABASE_URL` (port 5432 for migrations)
- `postinstall` script: `prisma generate` (required for Vercel build cache)
- `vercel-build` script: `prisma generate && prisma migrate deploy && next build`

**Alternatives considered**:
- Neon — excellent serverless Postgres, also free, but Supabase has better dashboard for hackathon demo
- Railway — paid ($5/mo), no advantage over Supabase free tier
- Prisma Accelerate — adds another service to manage; Supabase's built-in pooler is simpler

---

## 6. Project Architecture

### Decision: Single Next.js project, App Router, co-located API routes

**Rationale**: Simplest architecture for a hackathon. No separate backend. API routes in `app/api/`, business logic in `services/`, external integrations in `providers/` with interface + mock + real pattern.

**Key patterns**:
- **Server Actions** for form mutations (squad updates, league creation) — less boilerplate, built-in revalidation
- **API routes** only for external webhooks (Mercado Pago, WhatsApp) and programmatic access
- **Service layer** (`services/`) — all business logic, called by both Server Actions and API routes
- **Provider layer** (`providers/`) — all external APIs behind interfaces, swappable via env vars
- **Zod schemas** for validation shared between client and server

---

## 7. Testing Strategy

### Decision: Vitest + React Testing Library, focus on services

**Rationale**: Fastest setup, highest value per test in a hackathon context.

**What to test**:
- Service layer functions (scoring calculations, squad validation, transfer rules)
- Complex interactive components (formation builder, player catalog)

**What to skip for hackathon**:
- E2E tests (too slow to set up)
- API route tests (thin wrappers around services)
- Simple presentational components

---

## 8. Mock Data Strategy (Hackathon Critical)

### What gets mocked vs. what's real

| Component | Hackathon Demo | Why |
|---|---|---|
| **Stats data** | Mock (JSON fixtures) | No time for API-Football setup |
| **WhatsApp bot** | Mock (admin panel chat viewer) | Business verification takes days |
| **Mercado Pago** | **Real sandbox** | Works end-to-end with test accounts, impressive for judges |
| **Auth OTP** | Mock (accept `000000`) | No WhatsApp provider to deliver real OTPs |
| **Google OAuth** | **Real** (if time) | Quick to set up via Google Cloud Console |
| **Database** | **Real** (Supabase free) | Easy setup, persists data for demo |
| **AI chat (Claude)** | **Real** (API key required) | Core differentiator, worth demoing live |

### Mock data requirements
- 4 Argentine teams with real names
- ~80 players with realistic names, positions, and stats
- 2 matchdays with complete fixture results
- Pre-built demo squads for 2-3 demo users
- Player ratings per match (6.0-9.5 scale matching API-Football format)

---

## 9. Hackathon Demo Flow

The demo should run this complete cycle in under 10 minutes (SC-007):

1. **Sign up** — enter phone, enter mock OTP → Squad Builder
2. **Build squad** — pick 11+7 from catalog, choose formation, set captain
3. **Trigger matchday** — admin button simulates LOCK → LIVE → RESULTS
4. **View results** — see per-player points, total score, leaderboard update
5. **Make a swap** — pay $2,000 ARS via Mercado Pago sandbox → swap executes
6. **Create private league** — set buy-in, get invite link
7. **Join league** — second demo user pays via Mercado Pago → league leaderboard
8. **WhatsApp bot** — show admin panel with simulated bot conversation (AI tip)

### Admin tools needed for demo
- "Simulate matchday" button (advances lifecycle LOCK → RESULTS)
- WhatsApp message log viewer (simulated chat)
- Seed data script (`prisma/seed.ts`) to pre-populate players, teams, matchdays
