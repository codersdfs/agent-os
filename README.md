# Meta-Skill Framework

A self-referential skill framework for AI coding agents. The meta-skill-framework skill teaches the agent how to use the framework itself, while Python tooling handles index building, prompt assembly, compression, and runtime skill activation.

## Architecture — The 7 Defenses

| ID | Name | Rule |
|:---|:---|:---|
| **D-1** | Translation Protection | Self-check for orphan skill names, empty placeholders, >400 tokens |
| **D-2** | Public-Lib Lockdown | Public lib skills void pre-training — force-read the detail file |
| **D-3** | Worker Amnesia Prevention | Read skill detail files raw — no interpretation |
| **D-4** | Prompt Size Defense | Compressor enforces ≤400 token system prompts |
| **D-5** | Version Sync | Index auto-built from `/skills/details/` |
| **D-6** | Dependency Deadlock | 4-item self-review checklist before code output |
| **D-7** | Dynamic Overrides | `SESSION_OVERRIDES` JSON block for user exceptions |

## File Structure

```
/
├── skills/
│   ├── details/                      # One .md per skill with YAML frontmatter
│   │   ├── meta-skill-framework.md   # The core skill — teaches the framework
│   │   ├── SKILL.md                  # batch-grill-me interview skill
│   │   └── sample_requests_post.md   # Example public-lib skill
│   └── generated/
│       └── SKILL_INDEX.generated.md  # Auto-built from details/ (never hand-edit)
├── scripts/
│   ├── build_index.py                # Scan details/ → generate index
│   ├── compress_prompt.py            # Compress prompts to ≤400 tokens
│   ├── assemble_prompt.py            # Assemble system prompt (build-time)
│   └── skill_loader.py               # Match triggers → load skill details (run-time)
├── package.json
└── README.md
```

## How It Works

### Single-Agent Protocol

The coding agent plays all roles:

1. **Index Keeper** — Holds the assembled system prompt with embedded skill index
2. **Detail Reader** — When a skill triggers, reads the detail file raw via `read_file()`
3. **Self-Reviewer** — Runs the 4-item checklist before outputting code

### Trigger → Load → Respond

```
User says something
  → skill_loader.py --auto "query"
  → matched skill name(s) with scores
  → read skills/details/SKILL_NAME.md
  → inject raw detail text into context
  → respond using the loaded detail
```

### Build Pipeline

```
build_index.py     → SKILL_INDEX.generated.md
assemble_prompt.py → ASSEMBLED_SYSTEM_PROMPT.txt (with compression)
```

## Adding a New Skill

Create a `.md` file in `skills/details/` with this frontmatter:

```yaml
---
skill_name: "YOUR_SKILL"
library_type: "internal"          # or "public"
library_name: "lib-name"          # required if public
locked_version: "x.x.x"           # required if public
summary: "One-line description"   # ≤15 words, appears in index
depends_on: []
trigger_keywords: ["keyword"]
force_read_detail: false
token_estimate: 200
---
```

Then run `python scripts/build_index.py` to regenerate the index.

## Quick Start

```bash
# Install dependencies
pip install pyyaml

# List all available skills
make list

# Rebuild the index (auto-generated from skills/details/)
make build

# Assemble a compressed system prompt
make assemble

# Match skills by user query
make match Q="how does this system work"

# Auto-mode: match + load top skill details
make auto Q="http post request"
```

## CI

A GitHub Actions workflow (`.github/workflows/build-index.yml`) automatically rebuilds the index whenever a skill detail file changes in `skills/details/`. The updated `SKILL_INDEX.generated.md` is committed back to the repo on push.

## License

MIT
