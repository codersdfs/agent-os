---
skill_name: "SKILL"
library_type: "internal"
summary: "How to use the meta-skill framework for agent skill management"
depends_on: ["META_SKILL_FRAMEWORK"]
trigger_keywords: ["skill", "how to use", "framework", "load skill", "activate skill"]
force_read_detail: false
token_estimate: 300
---
# How to Use the Meta-Skill Framework

This skill teaches you how to integrate and use the meta-skill-framework in your agent harness.

## Quick Start

### 1. List Available Skills
```bash
python scripts/skill_loader.py --list
# or
npx meta-skill-framework list
```

### 2. Match Skills by Query
```bash
python scripts/skill_loader.py --match "http post request"
# or
npx meta-skill-framework match "http post request"
```

### 3. Auto-Mode (Match + Load)
```bash
python scripts/skill_loader.py --auto "how does this system work" --max 3 --json
# or
npx meta-skill-framework auto "how does this system work"
```

## Integration Patterns

### Option A: CLI Wrapper (Recommended)
Call the framework as a subprocess from your agent:

```python
import subprocess, json

def load_skills(query, max_skills=3):
    result = subprocess.run(
        ['python', 'scripts/skill_loader.py', '--auto', query,
         '--max', str(max_skills), '--json'],
        capture_output=True, text=True, cwd='/path/to/meta-skill-framework'
    )
    return json.loads(result.stdout)

# Usage
skills = load_skills("http post request")
for skill in skills['loaded']:
    print(skill['skill_name'])
    print(skill['body'])  # Raw skill detail
```

### Option B: Direct Python Import
Import modules directly for tighter integration:

```python
import sys
sys.path.insert(0, '/path/to/meta-skill-framework/scripts')
from skill_loader import load_all_skills, match_input, resolve_dependency_order

# Load all skills
skills = load_all_skills()

# Match and load
ranked = match_input("http post request", skills)
top_names = [sn for sn, _ in ranked[:3]]
ordered = resolve_dependency_order(top_names, skills)

# Get raw detail text
for name in ordered:
    detail = skills[name]['full_text']  # Complete file
    body = skills[name]['body']         # Just the content (no frontmatter)
```

## The 3-Agent Protocol

When using this framework, your agent acts as all three roles:

1. **Index Keeper** — Maintain the assembled system prompt with SKILL_INDEX
2. **Detail Reader** — When a skill triggers, read `skills/details/SKILL_NAME.md` raw
3. **Self-Reviewer** — Run the 4-item checklist before outputting code

## Token-Saving Workflow

1. Use `--auto` to match + load in one call
2. Use `--max N` to limit loaded skills (default: 3)
3. Use `--json` for machine-readable output
4. Use `compress_prompt.py` to enforce ≤400 token system prompts

## Adding New Skills

1. Create a `.md` file in `skills/details/` with YAML frontmatter
2. Run `python scripts/build_index.py` to regenerate the index
3. The new skill is immediately available via `--auto`

## Self-Review Checklist (D-6)

Before outputting code, verify:
1. All called functions are defined in loaded skill details
2. Dependencies are loaded in correct order
3. No hardcoded passwords/secrets
4. For PUBLIC_LIB skills, used detail file functions (not memory)