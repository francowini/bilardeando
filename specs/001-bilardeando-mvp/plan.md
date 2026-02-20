# Implementation Plan: Bilardeando MVP

**Branch**: `001-bilardeando-mvp` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-bilardeando-mvp/spec.md`

## Summary

Build a fantasy football platform for the Argentine Liga Profesional. Users sign up via phone OTP, build 18-player squads from a player catalog, earn points based on real match performance (consumed from a stats API), compete on global and private league leaderboards, and interact via a WhatsApp bot. Payments for premium features (swaps, leagues, budget) go through Mercado Pago Checkout Pro. The hackathon demo runs entirely on mock data behind abstracted provider interfaces.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Framework**: Next.js 14+ (App Router)
**Primary Dependencies**: React 18, Tailwind CSS, shadcn/ui, Lucide icons, Prisma ORM, NextAuth.js (Auth.js v5), mercadopago SDK
**Storage**: PostgreSQL (via Prisma) — hosted on Supabase or Railway for hackathon
**Testing**: Vitest + React Testing Library (unit/component), Playwright (e2e — post-MVP)
**Target Platform**: Web (desktop-first), Vercel deployment
**Project Type**: Web application (Next.js full-stack — single project with App Router)
**Performance Goals**: All screens interactive within 2 seconds; 500 concurrent users during matchday; matchday results processed within 2 minutes of last match
**Constraints**: Vercel-compatible (no long-running processes — use cron/webhooks for matchday processing); skeleton loading states (no spinners); mobile-responsive but desktop-first
**Scale/Scope**: ~500 users initially, 8 key screens, ~80 players in mock dataset, 4 teams, 2 simulated matchdays

### External Integrations

| Integration | Hackathon (Mock) | Production |
|---|---|---|
| Stats Provider | JSON fixtures (4 teams, 80 players, 2 matchdays) | API-Football (NEEDS CLARIFICATION — see research.md) |
| WhatsApp Bot | Console/log-based mock | Gupshup or 360dialog (NEEDS CLARIFICATION — see research.md) |
| Payments | Mercado Pago Sandbox (Checkout Pro) | Mercado Pago Production |
| AI Chat | Claude API with guardrails | Claude API with guardrails |
| Auth OTP | Mock OTP (fixed code in dev) | WhatsApp OTP via provider |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Sports-First UX — PASS

- Football-inspired palette (deep greens, white, dark accents) — defined in design system
- Bold typography: Outfit font family
- Card-based, dashboard-style layout — formation visualizations, player cards
- Skeleton loading states, no spinners
- Data-dense but scannable tables for stats/leaderboards
- No "AI slop" aesthetics

### II. Security First — PASS

- `.env` with placeholders only; real secrets in Vercel env vars
- `.gitignore` covers `*.pem`, `*.key`, `*.p12`, `.env`
- Mercado Pago sandbox credentials in development
- Phone numbers never logged in plain text
- All secret patterns (`sk-`, `ghp_`, `AKIA`, `-----BEGIN`) excluded from commits

### III. Spec-Driven Development — PASS

- This plan follows the spec-kit phase order: constitution → specify → plan → tasks → implement
- All work items originate from the generated task list
- Specs in `docs/` and `specs/` are source of truth

### IV. Hackathon Pragmatism — PASS

- All external APIs (stats, WhatsApp, Mercado Pago) abstracted behind TypeScript interfaces
- Mock data layer mandatory and included
- Deployable to Vercel at all times
- No over-engineering: no head-to-head betting, no mobile native, no recurring subscriptions
- YAGNI enforced — only features in the spec

### V. Parallel-Safe Coordination — PASS

- All work on feature branches via worktrees
- Frequent commits with clear messages
- `--no-ff` merges to preserve history
- Tasks will be marked `[P]` for parallel-safe work
- Board/hack/hackdone/sync coordination commands used

### Gate Result: ALL PASS — proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-bilardeando-mvp/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: Prisma schema + entity relationships
├── quickstart.md        # Phase 1: developer setup guide
├── contracts/           # Phase 1: API endpoint definitions
│   └── api.md           # REST API contract
└── tasks.md             # Phase 2: implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/              # Authenticated route group
│   │   ├── squad/page.tsx        # Squad Builder
│   │   ├── matchday/page.tsx     # Matchday View
│   │   ├── leaderboard/page.tsx  # Leaderboard
│   │   ├── transfers/page.tsx    # Transfers & Swaps
│   │   ├── leagues/              # Private Leagues
│   │   │   ├── page.tsx          # List/Create
│   │   │   └── [id]/page.tsx     # League detail
│   │   ├── wallet/page.tsx       # Wallet & Balance
│   │   └── profile/page.tsx      # Profile
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── squad/route.ts
│   │   ├── matchday/route.ts
│   │   ├── leaderboard/route.ts
│   │   ├── transfers/route.ts
│   │   ├── leagues/route.ts
│   │   ├── wallet/route.ts
│   │   ├── payments/webhook/route.ts
│   │   └── whatsapp/webhook/route.ts
│   ├── layout.tsx
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── squad/                    # Squad-specific components
│   │   ├── formation-view.tsx    # Pitch/formation visualization
│   │   ├── player-card.tsx       # Player card with stats
│   │   └── player-catalog.tsx    # Searchable player list
│   ├── matchday/                 # Matchday components
│   ├── leaderboard/              # Leaderboard components
│   └── shared/                   # Shared layout components
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   └── utils.ts                  # Shared utilities
├── services/                     # Business logic layer
│   ├── squad.service.ts
│   ├── matchday.service.ts
│   ├── scoring.service.ts
│   ├── leaderboard.service.ts
│   ├── transfer.service.ts
│   ├── league.service.ts
│   └── wallet.service.ts
├── providers/                    # External API abstractions
│   ├── stats/
│   │   ├── stats-provider.interface.ts    # Interface
│   │   ├── mock-stats.provider.ts         # Mock implementation
│   │   └── api-football.provider.ts       # Real implementation (post-MVP)
│   ├── whatsapp/
│   │   ├── whatsapp-provider.interface.ts
│   │   ├── mock-whatsapp.provider.ts
│   │   └── gupshup.provider.ts            # Real implementation
│   └── payments/
│       ├── payment-provider.interface.ts
│       ├── mock-payment.provider.ts
│       └── mercadopago.provider.ts
├── types/                        # Shared TypeScript types
│   ├── player.ts
│   ├── squad.ts
│   ├── matchday.ts
│   ├── league.ts
│   └── transaction.ts
└── mock-data/                    # Hackathon demo fixtures
    ├── players.json              # ~80 players across 4 teams
    ├── matches.json              # 2 matchdays of fixtures
    └── stats.json                # Player performance per match

prisma/
├── schema.prisma                 # Database schema
├── seed.ts                       # Seed script (loads mock data)
└── migrations/                   # Migration files

tests/
├── unit/
│   ├── services/
│   └── providers/
└── integration/
    └── api/

public/
├── fonts/                        # Outfit font files
└── images/                       # Player photos, logos
```

**Structure Decision**: Single Next.js project (App Router full-stack). No separate backend — API routes colocated in `app/api/`. Business logic in `services/`, external integrations in `providers/` with interface+mock+real pattern. This keeps things simple for a hackathon while maintaining clean separation.

## Complexity Tracking

> No constitution violations detected. All decisions align with mandated stack and principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Constitution Re-Check (Post Phase 1 Design)

*Re-evaluated after data model and API contracts were designed.*

- **I. Sports-First UX**: PASS — Formation layout, player cards with photos/stats, card-based dashboard all specified in components structure. Skeleton loading mandated.
- **II. Security First**: PASS — All secrets via env vars, Mercado Pago webhook signature validation with HMAC-SHA256, phone numbers stored but never logged, `.env.example` with placeholders only.
- **III. Spec-Driven Development**: PASS — All entities, API endpoints, and validation rules trace directly to spec requirements (FR-001 through FR-034).
- **IV. Hackathon Pragmatism**: PASS — All three external APIs (Stats, WhatsApp, Mercado Pago) abstracted behind `providers/` interfaces. Mock implementations for stats and WhatsApp. Mercado Pago uses real sandbox. No over-engineering — no patterns beyond what's needed.
- **V. Parallel-Safe Coordination**: PASS — Project structure supports parallel work: providers, services, components, and pages are independent modules. Tasks can be parallelized across agents.

**Post-design gate: ALL PASS**

---

## Generated Artifacts

| Artifact | Path | Description |
|---|---|---|
| Implementation Plan | `specs/001-bilardeando-mvp/plan.md` | This file |
| Research | `specs/001-bilardeando-mvp/research.md` | Technology decisions and rationale |
| Data Model | `specs/001-bilardeando-mvp/data-model.md` | Prisma schema, entities, validations, state transitions |
| API Contract | `specs/001-bilardeando-mvp/contracts/api.md` | REST endpoints, Server Actions, webhook handlers |
| Quickstart | `specs/001-bilardeando-mvp/quickstart.md` | Developer setup guide |
