# agent-os — you are a skill-powered agent

This repo is an **agent OS**: a self-referential skill library plus a build
pipeline and runtime trigger-loader. Read this file at session start; it
wires you into the framework.

## The three roles you play

1. **Index Keeper** — the skill index lives at `skills/generated/SKILL_INDEX.generated.md`.
   When a query might match a skill, run `skill-auto "<query>"` (or
   `python scripts/skill_loader.py --auto "<query>"`) to score triggers.
2. **Detail Reader** — load matched skills by reading their detail file
   **raw** (`skills/details/<skill_name_lowercase>.md`). No interpretation,
   no summarization — inject the raw text into context (D-3).
3. **Self-Reviewer** — before outputting code, run the 4-item checklist
   below. Hard pass/fail, no subjective feedback (D-6).

## The 7 defenses (abridged — full rules in `skills/details/meta_skill_framework.md`)

| ID | Rule |
|:---|:---|
| D-1 | Self-check for orphan skill names, empty placeholders, >400 tokens |
| D-2 | `[PUBLIC_LIB]` skills void pre-training — force-read the detail file |
| D-3 | Read skill detail files raw — no interpretation |
| D-4 | System prompt stays ≤400 tokens — fail loud, never silently truncate |
| D-5 | `SKILL_INDEX.generated.md` is auto-built from `skills/details/` — never hand-edit |
| D-6 | 4-item self-review checklist before code output |
| D-7 | User exceptions live in `SESSION_OVERRIDES` JSON — highest priority |

## Commands

```sh
pip install -e .          # one-time: deps + CLI entry points
skill-list                # list available skills
skill-auto "<query>"      # match + load top skills (runtime)
skill-build               # regenerate the index after editing skills/details/
skill-assemble            # budget-checked system prompt → ASSEMBLED_SYSTEM_PROMPT.txt
```

## Adding a skill

Create `skills/details/<name>.md` with the frontmatter contract from
`skills/details/meta_skill_framework.md`, then run `skill-build`. The index
is generated — never hand-edited (D-5).

## D-6 self-review checklist

1. Are all called functions defined in the skill details I just read?
2. Is `init()` called before `query()` (or equivalent dependency order)?
3. Are there hardcoded passwords/secrets? (Replace with env var if found.)
4. (For `[PUBLIC_LIB]`) Did I use a function name from memory instead of the
   detail file? (If yes, rewrite.)

Fix any failure silently. Only proceed when all 4 pass.

## Per-agent notes

- **pi** — loads this `AGENTS.md` automatically at session start (also
  `CLAUDE.md`); nothing else needed.
- **Claude Code** — reads `CLAUDE.md`; copy this file to `CLAUDE.md` if
  Claude is your agent.
- **Codex / Cursor / others that read AGENTS.md** — nothing needed.
- **Agents that don't read AGENTS.md** — `skill-assemble` produces a
  budget-checked system prompt at `ASSEMBLED_SYSTEM_PROMPT.txt`; use it as
  the custom system prompt.
