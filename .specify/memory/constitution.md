<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1 (PATCH — rename project from Gran DT to
  Bilardeando to avoid copyright issues)
- Modified: Project name in title, governance section
- No principle changes
- Templates requiring updates: none (no hardcoded project name)
- Follow-up TODOs: update docs/MVP.md header (manual)

Previous report (v1.0.0):
- Version change: 0.0.0 → 1.0.0 (MAJOR — initial constitution ratification)
- Added principles:
  - I. Sports-First UX
  - II. Security First (NON-NEGOTIABLE)
  - III. Spec-Driven Development
  - IV. Hackathon Pragmatism
  - V. Parallel-Safe Coordination
- Added sections:
  - Technology Constraints
  - Development Workflow
  - Governance
- Removed sections: none (initial version)
- Templates requiring updates:
  - .specify/templates/plan-template.md — no update needed, Constitution Check
    section already references constitution file dynamically
  - .specify/templates/spec-template.md — no update needed, structure is
    compatible with principles
  - .specify/templates/tasks-template.md — no update needed, parallel task
    markers already align with Principle V
- Follow-up TODOs: none
-->

# Bilardeando Constitution

## Core Principles

### I. Sports-First UX

Every interface MUST feel like a real sports app — clean, data-rich, and fast.

- Visual identity MUST use a football-inspired palette: deep greens
  (pitch), white, dark accents. Generic purple/blue AI gradients are
  prohibited.
- Typography MUST be bold and sporty (Outfit, Sora, or DM Sans). Generic
  Inter/Roboto is prohibited.
- Layout MUST be card-based, dashboard-style. Mobile-first responsive.
- Football conventions MUST be followed: formation layouts (4-3-3, 4-4-2),
  pitch visualizations, player cards with photos and stats.
- Loading states MUST use skeleton screens, never spinners.
- Data MUST be scannable — no tiny text on stats, tables must be readable.
- "AI slop" aesthetics (pastel gradients, rounded everything, no
  personality) are explicitly banned.

**Rationale**: This is a sports product. Users expect the energy and
information density of ESPN, FotMob, or Sofascore — not a generic SaaS
dashboard.

### II. Security First (NON-NEGOTIABLE)

No secrets, keys, or credentials MUST ever be committed to the repository.

- Every commit MUST be checked for API keys, tokens, passwords, `.env`
  files with real values, SSH private keys, and strings matching patterns
  like `sk-`, `ghp_`, `gho_`, `AKIA`, `-----BEGIN`.
- Files matching `*.pem`, `*.key`, `*.p12`, `.env` MUST be in `.gitignore`
  and MUST never be committed.
- Environment variables MUST be documented via `.env.example` with
  placeholder values only.
- Payment flows (Mercado Pago) MUST use sandbox credentials during
  development. Production keys MUST only exist in deployment environment
  variables.
- User phone numbers and personal data MUST be treated as sensitive and
  never logged in plain text.

**Rationale**: This app handles real money (Mercado Pago) and personal data
(phone numbers). A single leaked credential can compromise users and funds.

### III. Spec-Driven Development

All implementation work MUST originate from the spec-kit workflow. No agent
invents work outside the task list.

- The workflow MUST follow the phase order: constitution → specify → plan →
  tasks → implement.
- Specs in `docs/` and `.specify/` are the source of truth.
- Each Claude instance MUST pick tasks from the generated task list, not
  create ad-hoc work.
- Changes to specs MUST go through the spec-kit commands, not direct edits
  without re-running downstream phases.

**Rationale**: Multiple agents working simultaneously need a single source
of truth. Without spec discipline, agents produce conflicting or redundant
work.

### IV. Hackathon Pragmatism

Ship fast, but ship clean. Every external dependency MUST be abstracted
behind an interface.

- All external API calls (stats providers, WhatsApp, Mercado Pago) MUST be
  abstracted behind interfaces so mocks can be swapped seamlessly.
- A mock data layer is MANDATORY for the hackathon demo.
- Code MUST be deployable to Vercel at all times — broken builds on main
  are prohibited.
- Favor working features over perfect architecture. Do not over-engineer.
- YAGNI: do not build for hypothetical future requirements (head-to-head
  betting, mobile native, recurring subscriptions are explicitly out of
  scope).

**Rationale**: Hackathon time is limited. Abstractions enable fast demo
fallbacks while keeping the door open for real integrations post-hackathon.

### V. Parallel-Safe Coordination

Multiple Claude Code instances work simultaneously. All work MUST be
conflict-free and independently mergeable.

- No agent MUST ever work directly on the `main` branch. All work happens
  in git worktrees on feature branches (`feat/<name>`).
- Commits MUST be frequent with clear messages.
- Feature branches MUST be merged via `--no-ff` merges to preserve history.
- Tasks marked `[P]` in the task list can be worked on in parallel by
  different agents. Tasks without `[P]` MUST respect dependency order.
- Agents MUST use the `board`, `hack`, `hackdone`, and `sync` commands to
  coordinate.

**Rationale**: Without coordination discipline, parallel agents create
merge conflicts, duplicate work, and broken main branches.

## Technology Constraints

The following stack is mandated for this project:

| Layer | Technology | Non-negotiable |
|---|---|---|
| Framework | Next.js (App Router) | Yes |
| Language | TypeScript | Yes |
| Styling | Tailwind CSS + shadcn/ui | Yes |
| Icons | Lucide | Yes |
| Deployment | Vercel | Yes |
| Database | PostgreSQL (via Prisma) | Yes |
| Payments | Mercado Pago (Checkout Pro) | Yes |
| WhatsApp | Gupshup or 360dialog | To evaluate |
| AI | Claude API | Yes |
| Mocks | In-memory / JSON fixtures | Yes (for demo) |

- No additional frameworks or UI libraries MUST be introduced without
  explicit justification and team consensus.
- All dependencies MUST be compatible with Vercel deployment.
- TypeScript strict mode MUST be enabled.

## Development Workflow

- All features MUST start with `hack <feature-name> "description"`.
- Before starting work, agents MUST run `board` to check what others are
  doing.
- Before merging, agents MUST run `sync` to rebase on latest main.
- The merge sequence MUST be: checkout main → pull → merge --no-ff →
  push → hackdone.
- Commits MUST never include generated files, node_modules, or build
  artifacts.
- `.gitignore` MUST be kept up to date with all ignored patterns.

## Governance

This constitution is the highest-authority document for Bilardeando development
decisions. All other documents (specs, plans, tasks) MUST comply with the
principles defined here.

- **Amendments**: Any change to this constitution MUST be documented with a
  version bump, rationale, and sync impact report (HTML comment at top of
  file).
- **Versioning**: MAJOR for principle removals/redefinitions, MINOR for new
  principles or material expansions, PATCH for clarifications and typos.
- **Compliance**: Every PR and code review MUST verify adherence to these
  principles. Violations MUST be flagged and resolved before merge.
- **Conflict resolution**: When a spec or plan conflicts with this
  constitution, the constitution wins. Update the downstream document.

**Version**: 1.0.1 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-20
