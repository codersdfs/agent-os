# @franklinww/create-agent-os

> ⚠️ **BETA** — actively developed, not fully production-tested. APIs, scripts,
> and the scaffolded template can change between releases. Use it, report what
> breaks, but don't build mission-critical processes on it yet.

Scaffold an **agent OS workspace** — one repo that bundles two things:

1. **AI workflows** — a skill system (the Meta-Skill Framework): trigger-matched skills, auto-built index, budget-checked system prompt, runtime skill loading.
2. **A template** — an LLM Wiki (Karpathy's pattern): `raw/` sources → agent-maintained `wiki/` pages, so your agent stops having amnesia.

Pure **Node** — no python, no pip. `npm install` is the whole setup.

> "Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase." — Andrej Karpathy

## Install

```sh
npm create @franklinww/agent-os my-brain
```

## What you get

```
my-brain/
├── AGENTS.md          ← wires any agent session: skill roles + wiki maintainer
├── raw/               ← your sources (immutable; attachments → raw/assets/)
├── wiki/
│   ├── index.md       ← page catalog (LLM Wiki)
│   └── log.md         ← append-only history
├── skills/
│   ├── details/       ← one .md per skill (YAML frontmatter, triggers)
│   │   ├── batch_grill_me.md       # signature interview skill
│   │   ├── meta_skill_framework.md # the framework itself
│   │   └── requests_post.md        # example public-lib skill
│   └── generated/     ← SKILL_INDEX.generated.md (auto-built, never hand-edit)
├── scripts/           ← pure-Node pipeline (js-yaml is the only dependency)
└── package.json       ← npm scripts: skill-*
```

## Quick start

```sh
npm create @franklinww/agent-os my-brain
cd my-brain
npm run skill-auto -- "grill me"     # skills work
npm run skill-build                  # rebuild index after editing skills/details/
npm run skill-assemble               # budget-checked system prompt → ASSEMBLED_SYSTEM_PROMPT.txt
```

For the wiki: drop a source into `raw/`, then tell any agent session in the
workspace: `ingest raw/<file>`.

## The Wiki Map (localhost)

The wiki doubles as a **cartography of agent activity** — a browsable map of
what agents are learning, linked to what they already know. Start it with:

```bash
npm run wiki-map      # http://localhost:3000
```

Browse pages, see backlinks, spot broken references. The map updates in real
time as agents ingest, query, and link new knowledge.

**Agent handoff**: when switching agents, point the new one at `AGENTS.md` and
`wiki/log.md`. The log shows what happened last; the wiki holds the knowledge.
New agents read the wiki before starting work — context survives across sessions.

See `HOW_TO_WIKI.md` in your workspace for the full how-to (it's scaffolded
in with the rest of the template).

## The skills pipeline

| Command | What it does |
|---|---|
| `npm run skill-list` | list available skills |
| `npm run skill-auto -- "<query>"` | trigger-match + load top skills (runtime) |
| `npm run skill-match -- "<query>"` | score-only matching |
| `npm run skill-load -- NAME` | load a skill by name |
| `npm run skill-build` | regenerate the index from `skills/details/` (D-5) |
| `npm run skill-assemble` | assemble + budget-check the system prompt (D-4, fail-loud) |
| `npm run selfcheck` | verify the pipeline's non-trivial logic |

## Shipped skills (v2.1)

A curated starter set, distilled to the contract (full provenance in
[THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES)):

- **BATCH_GRILL_ME** — frontier-interview skill (signature)
- **META_SKILL_FRAMEWORK** — the 7-defenses architecture itself
- **WAYFINDER** — chart a large foggy effort as decision tickets, then work them
- **HANDOFF** — compact the conversation into a handoff doc for a fresh agent
- **TEACH** — stateful, multi-session teaching workspace
- **SETUP_MATT_POCOCK_SKILLS** — configure tracker / triage labels / domain docs
- **RESOLVING_MERGE_CONFLICTS** — resolve in-progress merges, preserving intent
- **IMPROVE_CODEBASE_ARCHITECTURE** — deepening opportunities + grilling
- **DEFUDDLE** — clean markdown from web pages (MIT tool, kepano)
- **OBSIDIAN_VAULT** — search/create/manage vault notes with wikilinks
- **REQUESTS_POST** — example public-lib skill

The UI/design and video/creative clusters are deliberately not shipped; the
user's personal workspace carries the full stack instead.

## Adding a skill

Create `skills/details/<name>.md` with the frontmatter contract in
`skills/details/meta_skill_framework.md`, then `npm run skill-build`.
The index is generated — never hand-edited.

## License

MIT
