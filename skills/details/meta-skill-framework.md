---
skill_name: "META_SKILL_FRAMEWORK"
library_type: "internal"
summary: "7-defense architecture: translation protection, public-lib lockdown, worker amnesia prevention, prompt size defense, version sync, dependency deadlock, dynamic overrides"
depends_on: []
trigger_keywords: ["meta-skill", "framework", "how does this system work", "explain the architecture", "defense", "system prompt"]
force_read_detail: false
token_estimate: 350
---
# Meta-Skill Framework

This skill teaches the AI how to **use** the Meta-Skill Framework that this project is built on.

It is NOT a library, NOT a code template. It is a **conceptual blueprint** for how the entire skill-management system works.

## When to Activate

- When a user asks: "How does this skill system work?"
- When you need to create a **new skill** for the framework.
- When you're about to generate a System Prompt for a new session.
- When you encounter `UNKNOWN` in the index and need to debug why.
- When a user says: "Explain the architecture of this project."

## Core Principles (The 7 Defenses)

These 7 principles govern everything in this project:

| ID | Name | Rule (1 sentence) |
|:---|:---|:---|
| **D-1** | Translation Protection | Before System Prompt is finalized, run a self-check for orphan skill names, empty placeholders, and >400 tokens. PASS only. |
| **D-2** | Public-Lib Lockdown | If a skill is tagged `[PUBLIC_LIB]`, your pre-training is **void**. Force-read the detail file. |
| **D-3** | Worker Amnesia Prevention | When reading a skill detail file, return it raw. No interpretation, no summarization. |
| **D-4** | Prompt Size Defense | A **compressor middleware** forces the System Prompt to <=400 tokens. No AI negotiation. |
| **D-5** | Version Sync | `SKILL_INDEX.generated.md` is **auto-built** from `/skills/details/`. Never hand-edit it. |
| **D-6** | Dependency Deadlock | Before final output, run a 4-item self-review checklist. Fix silently if any fail. |
| **D-7** | Dynamic Overrides | User exceptions go into `SESSION_OVERRIDES` (JSON block). It overrules everything. Auto-clear on "new task". |

## Single-Agent Protocol

The coding agent (you) handles all three roles directly. No subagent infrastructure required.

| Mode | What it does | Key constraint |
|:---|:---|:---|
| **Index Keeper** | Holds the assembled System Prompt with embedded SKILL_INDEX, rules, and checklists. | The System Prompt is the source of truth for all skill metadata. |
| **Detail Reader** | When a skill matches, read its detail file directly using `read_file(path)` and return the raw text. | No interpretation, no summarization. The raw text is injected into context. |
| **Self-Reviewer** | Before final output, run the 4-item Self-Review Checklist (D-6). Return PASS or FAIL on each check. | No subjective feedback. Hard pass/fail only. |

### When a skill triggers

```
User input → skill_loader.py --auto "query" → matched skill name(s)
  → read_file(skills/details/SKILL_NAME.md) → raw detail text
  → inject into context → respond using detail
```

## File Architecture

```
/
├── skills/
│   ├── details/                      # One .md file per skill, each with YAML frontmatter
│   │   ├── meta-skill-framework.md
│   │   ├── SKILL.md                  # batch-grill-me
│   │   ├── sample_requests_post.md
│   │   └── ... (add new skills here)
│   └── generated/
│       └── SKILL_INDEX.generated.md  # Auto-built from details/ — never hand-edit
├── scripts/
│   ├── build_index.py               # Scan details/ → generate index
│   ├── compress_prompt.py           # Compress prompts to <=400 tokens
│   ├── assemble_prompt.py           # Assemble system prompt (build-time)
│   └── skill_loader.py              # Match triggers → load skill details (run-time)
├── package.json
└── README.md
```

## How to Write a New Skill (The Data Contract)

Every skill detail file MUST use this exact YAML frontmatter template:

```yaml
---
skill_name: "SKILL_NAME"          # UPPERCASE, underscores, unique
library_type: "public"            # OR "internal"
library_name: "lib-name"          # REQUIRED if public
locked_version: "x.x.x"           # REQUIRED if public
summary: "One-line description"   # <=15 words, appears in Index
depends_on: ["OTHER_SKILL"]       # Array of skill_name
trigger_keywords: ["keyword"]     # Optional
force_read_detail: true           # For public libs, always true
token_estimate: 150               # Estimated tokens of this detail file
---
# (Detail content here. Code templates, parameters, edge cases.)
```

### Rules
- **Public libs** (`library_type: public`) MUST include `library_name` and `locked_version`. The build script enforces this.
- **Internal skills** (`library_type: internal`) omit `library_name` and `locked_version`.
- `skill_name` must be UPPERCASE with underscores.
- `summary` <=15 words — it's what appears in the generated Index.
- `depends_on` is an array. Populated skills get loaded in dependency order.
- `force_read_detail` should be `true` for public libs to trigger D-2 Lockdown.
- `token_estimate` helps the compressor plan budget.

## Self-Review Checklist (D-6)

Before outputting any code, silently check:

1. Are all called functions defined in the skill details I just read?
2. Is `init()` called before `query()` (or equivalent dependency order)?
3. Are there hardcoded passwords/secrets? (Replace with env var if found.)
4. (For `[PUBLIC_LIB]`) Did I use a function name from my own memory instead of the details? (If yes, rewrite.)

Fix any failure silently. Only proceed when all 4 pass.

## Priority Pyramid

```
1. SESSION_OVERRIDES      (highest — user exceptions)
2. PROJECT_RULES          (hardcoded project constraints)
3. SKILL_INDEX            (loaded skill details)
4. Pre-training           (lowest — only if above are empty)
```

## Dynamic Overrides (D-7)

User exceptions are written as a JSON block in SESSION_OVERRIDES:

```json
{"SKILL_NAME": {"param": "user_value"}}
```

Auto-clear this block when the user says "new task".
