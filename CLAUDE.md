# Hackathon — Multi-Claude Workspace

Multiple Claude Code instances work on this project simultaneously. Each instance uses its own git worktree to avoid conflicts.

## Getting Started

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

## Commands

| Command | Description |
|---|---|
| `board` | Show all active features and who's working on what |
| `hack <name> "desc"` | Create a new worktree + branch for a feature |
| `hackdone <name>` | Mark a feature as done on the board |
| `sync` | Rebase current branch on latest main |
| `main-log` | Show recent commits on main |

## Git Workflow

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

If you accidentally staged a secret:
```bash
git reset HEAD <file>
```

If you accidentally committed a secret:
```bash
git reset --soft HEAD~1
# remove the secret, then recommit
```

**Files that must NEVER be committed:**
- `*.pem`, `*.key`, `*.p12`
- `.env` (use `.env.example` with placeholders instead)
- Any file containing `PRIVATE KEY`

## Spec-Driven Development (Spec Kit)

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit).

### Phases (run in order)

1. `/speckit.constitution` — Project principles (once at the start)
2. `/speckit.specify` — Write the spec (what we're building)
3. `/speckit.plan` — Technical plan (how we build it)
4. `/speckit.tasks` — Break into small, testable tasks
5. `/speckit.implement` — Execute a task

### Optional

- `/speckit.clarify` — De-risk ambiguity (before plan)
- `/speckit.analyze` — Consistency check (before implement)
- `/speckit.checklist` — Quality validation (after plan)

### Important

- Specs live in `docs/` — these are the source of truth
- Always follow the phase order
- Each Claude instance should pick tasks from the task list, not invent work
