# Quickstart: Bilardeando MVP

**Feature**: `001-bilardeando-mvp` | **Date**: 2026-02-20

---

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL (or use Supabase free tier)
- Git

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd proyecto
npm install
```

## 2. Environment Setup

Copy the example env file and fill in values:

```bash
cp .env.example .env.local
```

**Required `.env.local` variables:**

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Auth.js (NextAuth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth (optional — skip for hackathon)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""

# Mercado Pago (Sandbox)
MERCADOPAGO_ACCESS_TOKEN="TEST-xxxxxxxxxxxxxxxx"
MERCADOPAGO_PUBLIC_KEY="TEST-xxxxxxxxxxxxxxxx"
MERCADOPAGO_WEBHOOK_SECRET=""

# WhatsApp (mock for hackathon)
WHATSAPP_PROVIDER="mock"

# Claude API (for AI chat features)
# ANTHROPIC_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed mock data (4 teams, 80 players, 2 matchdays)
npx tsx prisma/seed.ts
```

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Test Login

- Enter any phone number (e.g., `+5491112345678`)
- Use OTP code `000000` (mock bypass in development)
- You're in!

## 6. Test Mercado Pago (optional)

To test payments locally:

```bash
# Install ngrok
npm install -g ngrok

# Expose localhost
ngrok http 3000

# Update .env.local
NEXT_PUBLIC_APP_URL="https://your-ngrok-url.ngrok.io"
```

Then configure the webhook URL in Mercado Pago Developer Panel.

**Test cards:**
- Visa: `4509 9535 6623 3704` / CVV `123` / Exp `11/30`
- Cardholder name: `APRO` (approved), `OTHE` (declined)

---

## Key Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests (Vitest)
npm run lint         # ESLint
npx prisma studio    # Visual DB editor
npx prisma migrate dev --name <name>  # Create migration
npx tsx prisma/seed.ts                # Seed mock data
```

---

## Project Structure Quick Reference

```
src/
  app/             # Next.js App Router (pages + API routes)
  components/      # React components (ui/, squad/, matchday/, etc.)
  lib/             # Shared utilities (db.ts, auth.ts, utils.ts)
  services/        # Business logic layer
  providers/       # External API abstractions (stats, whatsapp, payments)
  types/           # TypeScript type definitions
  mock-data/       # JSON fixtures for hackathon demo

prisma/
  schema.prisma    # Database schema
  seed.ts          # Seed script
  migrations/      # Auto-generated migrations
```

---

## Development Workflow

1. `board` — check what others are working on
2. `hack <feature> "description"` — create your worktree
3. Work, commit frequently
4. `sync` — rebase on latest main before merging
5. Merge via `--no-ff` and push
6. `hackdone <feature>` — mark complete

---

## Mock Data for Demo

The seed script creates:
- **4 teams**: River Plate, Boca Juniors, Racing Club, Independiente
- **~80 players**: 20 per team with realistic stats
- **2 matchdays**: Complete with fixtures, scores, and player ratings
- **2 demo users**: Pre-built squads for demonstration

To reset demo data:
```bash
npx prisma migrate reset
npx tsx prisma/seed.ts
```
