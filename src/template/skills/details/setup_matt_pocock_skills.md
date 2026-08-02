---
skill_name: "SETUP_MATT_POCOCK_SKILLS"
library_type: "internal"
summary: "Configure a repo for the engineering skills: tracker, labels, domain docs"
depends_on: []
trigger_keywords: ["setup skills", "issue tracker", "triage labels", "domain docs", "agent skills block", "configure repo"]
---

# SETUP_MATT_POCOCK_SKILLS

Configure a repo so the engineering skills (triage, to-tickets, to-spec, qa)
know where work lives. Run once before first use of those skills. This is a
prompt-driven process: explore, present, confirm with the user, then write.

## 1. Explore

Read the repo's starting state — don't assume:

- `git remote -v` — is this a GitHub repo?
- `AGENTS.md` / `CLAUDE.md` at root — exists? Already an `## Agent skills` section?
- `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, `docs/agents/`, `.scratch/`
- Is the `triage` skill installed? (decides whether triage labels run)
- Monorepo signals (`pnpm-workspace.yaml`, `workspaces` in package.json)

## 2. Present findings, then take sections in order

Lead each section with a recommended answer so the user can accept in a word.
Skip a section exploration already settled.

**A — Issue tracker.** GitHub (uses `gh` CLI), GitLab (`glab`), local
markdown (`.scratch/<feature>/`), or other (record as freeform prose). Record
in `docs/agents/issue-tracker.md`.

**B — Triage labels** (only if `triage` is installed). Ask one question: keep
the defaults? Defaults: `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. On no, collect overrides. Write to
`docs/agents/triage-labels.md`.

**C — Domain docs.** Default **single-context**: one `CONTEXT.md` +
`docs/adr/` at root — write without asking. Offer **multi-context**
(`CONTEXT-MAP.md` → per-context `CONTEXT.md`) only on monorepo signals.

## 3. Confirm, then write

Show drafts of the `## Agent skills` block and the `docs/agents/*.md`
contents; let the user edit before writing.

**Pick the file to edit**: `CLAUDE.md` if it exists, else `AGENTS.md`; if
neither, ask. Never create the one that doesn't exist when the other does.
Update an existing `## Agent skills` block in place — never append a
duplicate, never overwrite surrounding user edits.

The block:

```markdown
## Agent skills

### Issue tracker
[one-line summary]. See `docs/agents/issue-tracker.md`.

### Triage labels
[one-line summary]. See `docs/agents/triage-labels.md`.

### Domain docs
[one-line summary]. See `docs/agents/domain.md`.
```

Omit the `### Triage labels` sub-block and its file when `triage` isn't
installed.

## Done

Tell the user setup is complete and which skills read these files. They can
edit `docs/agents/*.md` directly later — re-run only to switch trackers or
restart.
