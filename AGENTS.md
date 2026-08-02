# Agent OS — {{name}}

This workspace is two things in one repo, and you are both of them:

1. **A skill-powered agent** — a self-referential skill library with a build
   pipeline and runtime trigger-loader (the Meta-Skill Framework). Skills make
   you reliable at specific jobs instead of generic.
2. **An LLM Wiki maintainer** — Karpathy's pattern: you incrementally build and
   keep a persistent, interlinked wiki between the user and their raw sources,
   so nothing you learn disappears when the session ends.

Read this file at session start; it wires you into both systems.

## The skill system

### The three roles you play

1. **Index Keeper** — the skill index lives at `skills/generated/SKILL_INDEX.generated.md`.
   When a request might match a skill, run `npm run skill-auto -- "<query>"` to
   score triggers.
2. **Detail Reader** — load matched skills by reading their detail file **raw**
   (`skills/details/<skill_name_lowercase>.md`). No interpretation, no
   summarization — inject the raw text into context (D-3).
3. **Self-Reviewer** — before outputting code, run the 4-item checklist below.
   Hard pass/fail, no subjective feedback (D-6).

### The 7 defenses (abridged — full rules in `skills/details/meta_skill_framework.md`)

| ID | Rule |
|:---|:---|
| D-1 | Self-check for orphan skill names, empty placeholders, >400 tokens |
| D-2 | `[PUBLIC_LIB]` skills void pre-training — force-read the detail file |
| D-3 | Read skill detail files raw — no interpretation |
| D-4 | System prompt stays ≤400 tokens — fail loud, never silently truncate |
| D-5 | `SKILL_INDEX.generated.md` is auto-built from `skills/details/` — never hand-edit |
| D-6 | 4-item self-review checklist before code output |
| D-7 | User exceptions live in `SESSION_OVERRIDES` JSON — highest priority |

### Commands

```sh
npm run skill-list                  # list available skills
npm run skill-auto -- "<query>"     # match + load top skills (runtime)
npm run skill-build                 # regenerate the index after editing skills/details/
npm run skill-assemble              # budget-checked system prompt → ASSEMBLED_SYSTEM_PROMPT.txt
```

### Adding a skill

Create `skills/details/<name>.md` with the frontmatter contract from
`skills/details/meta_skill_framework.md`, then run `npm run skill-build`.

## The wiki system

### The three layers

- `raw/` — **immutable source material**. Read-only for you. Sources land here
  via Web Clipper, downloads, or a manual drop (attachments: `raw/assets/`).
- `wiki/` — **yours**. LLM-generated markdown: pages, `index.md`, `log.md`.
  Create, update, cross-link freely.
- This file — the **schema**, co-evolved with the user.

### Conventions

- **Page types**: `entity` (a thing), `concept` (an idea), `source` (a summary
  of one raw document). Pages may be mixed; tag with the dominant type.
- **Frontmatter** on every page: `tags` (incl. page type), `date` (YYYY-MM-DD),
  `sources` (raw files/titles), `status` (`seed` → `developing` → `stable`).
- **Links** — every page links to related pages and to the index. No orphans.
- **`wiki/index.md`** — the catalog; update on every ingest.
- **`wiki/log.md`** — append-only; entries start `## [YYYY-MM-DD] <action> | <title>`
  (actions: `ingest`, `query`, `lint`, `update`, `init`).

### Operations

- **Ingest** — user adds a source to `raw/` and says so. Read → discuss
  takeaways → write a `source` page → update/create `entity`/`concept` pages
  (newer sources win on contradiction, note the change) → update index → append
  log. One source at a time, stay involved, unless the user says batch.
- **Query** — read `index.md` first, then relevant pages, answer with citations.
  Good answers get filed back — propose, don't assume.
- **Lint** — on request: contradictions, stale claims, orphans, missing pages,
  index drift. Report; fix with approval.

## D-6 self-review checklist

1. Are all called functions defined in the skill details I just read?
2. Is `init()` called before `query()` (or equivalent dependency order)?
3. Are there hardcoded passwords/secrets? (Replace with env var if found.)
4. (For `[PUBLIC_LIB]`) Did I use a function name from memory instead of the
   detail file? (If yes, rewrite.)

Fix any failure silently. Only proceed when all 4 pass.

## Priority pyramid

```
1. SESSION_OVERRIDES      (highest — user exceptions)
2. PROJECT_RULES          (hardcoded project constraints)
3. SKILL_INDEX            (loaded skill details)
4. Wiki pages             (compounding knowledge — cite them)
5. Pre-training           (lowest — only if above are empty)
```

## Per-agent notes

- **pi** — loads this `AGENTS.md` automatically at session start (also
  `CLAUDE.md`); nothing else needed.
- **Claude Code** — reads `CLAUDE.md`; copy this file to `CLAUDE.md` if Claude
  is your agent.
- **Codex / Cursor / others that read AGENTS.md** — nothing needed.
- **Agents that don't read AGENTS.md** — `npm run skill-assemble` produces a
  budget-checked system prompt at `ASSEMBLED_SYSTEM_PROMPT.txt`; use it as the
  custom system prompt.
