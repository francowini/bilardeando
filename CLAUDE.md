# Fantasy Football Hackathon

A fantasy football (soccer) app built during a hackathon. Multiple Claude Code instances work on this project simultaneously.

## Project Context

This is a **fantasy football (soccer)** application. Think of it like fantasy Premier League or Gran DT.
- Users build squads from real players
- Points based on real match performance
- Leagues, drafts, transfers, lineups
- The UX should feel like a sports app: clean, data-rich, fast

## Tech Stack (Vercel-ready)

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Deploy**: Vercel
- **Language**: TypeScript

## Design Guidelines

### Visual Identity
- **Theme**: Sports/football — clean, modern, data-driven
- **Colors**: Use a football-inspired palette — deep greens (pitch), white, dark accents. Avoid generic purple/blue AI gradients
- **Typography**: Bold, sporty — use a distinctive sans-serif (e.g., Outfit, Sora, DM Sans). Avoid generic Inter/Roboto
- **Layout**: Card-based, dashboard-style for stats and lineups. Mobile-first
- **Icons**: Use Lucide icons. Football-specific elements where needed (pitch diagrams, jersey icons, etc.)

### UX Principles
- Fast, responsive — no loading spinners where avoidable (use skeletons)
- Data-dense but readable — tables, stats, player cards
- Touch-friendly — big tap targets, swipe gestures for mobile
- Real-time feel — optimistic updates, live scores
- Football conventions — formation layouts (4-3-3, 4-4-2), pitch visualizations, player cards with photos and stats

### Avoid
- Generic "AI slop" aesthetics (pastel gradients, rounded everything, no personality)
- Overly decorative design — keep it functional and sporty
- Heavy animations that slow the experience
- Tiny text on stats — data should be scannable

## Multi-Claude Coordination

Multiple Claude Code instances work simultaneously. Each uses its own git worktree.

### Getting Started

1. Check the board:
   ```bash
   board
   ```

2. Create a worktree for your feature:
   ```bash
   hack <feature-name> "short description"
   ```

3. Work inside it:
   ```bash
   cd ~/worktrees/<feature-name>
   ```

### Commands

| Command | Description |
|---|---|
| `board` | Show all active features and who's working on what |
| `hack <name> "desc"` | Create a new worktree + branch for a feature |
| `hackdone <name>` | Mark a feature as done on the board |
| `sync` | Rebase current branch on latest main |
| `main-log` | Show recent commits on main |

### Git Workflow

1. **Never work directly on main** — always use `hack` to create a worktree
2. Commit frequently with clear messages
3. Push your branch: `git push origin feat/<your-feature>`
4. When ready to merge:
   ```bash
   git checkout main && git pull origin main
   git merge --no-ff feat/<your-feature>
   git push origin main
   hackdone <your-feature>
   ```

## Security — CRITICAL

**NEVER commit or push secrets, keys, or credentials.**

Before every commit, check for:
- API keys, tokens, passwords
- `.env` files with real values
- SSH private keys
- Any string that looks like `sk-`, `ghp_`, `gho_`, `AKIA`, `-----BEGIN`

**Files that must NEVER be committed:**
- `*.pem`, `*.key`, `*.p12`
- `.env` (use `.env.example` with placeholders instead)

## Spec-Driven Development (Spec Kit)

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit).

### Phases (run in order)

1. `/speckit.constitution` — Project principles (once at the start)
2. `/speckit.specify` — Write the spec (what we're building)
3. `/speckit.plan` — Technical plan (how we build it)
4. `/speckit.tasks` — Break into small, testable tasks
5. `/speckit.implement` — Execute a task

### Important

- Specs live in `docs/` — source of truth
- Always follow the phase order
- Each Claude instance picks tasks from the task list, not invents work
