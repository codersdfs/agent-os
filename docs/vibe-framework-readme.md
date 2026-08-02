# Vibe Coding Framework

Practical tooling for responsible AI-assisted development.

## Quick Start

```bash
# Install (development)
pip install -e .

# Or run directly
python scripts/vibe_framework.py --help
```

## Commands

### Classify Risk

Tag code as high/medium/low risk based on patterns:

```bash
python scripts/vibe_framework.py classify src/auth.py
# Output: Risk level: HIGH
```

### Run Safety Checks

Enforce review gates appropriate to risk tier:

```bash
python scripts/vibe_framework.py check src/auth.py --risk-level high
# Runs secret scan, TODO checks, debug output warnings
```

### Log Audit Trail

Capture prompt-response pairs for accountability:

```bash
python scripts/vibe_framework.py audit "Create login endpoint" src/auth.py --reviewer alice
# Creates entry in .vibe_audit/ with timestamped hash
```

### View History

```bash
python scripts/vibe_framework.py view --limit 10
```

### Sign-Off Wizard

Interactive certification process:

```bash
python scripts/vibe_framework.py signoff
# Guides through checklist: module review, security verification, responsibility acceptance
```

## Risk Classification

| Level | Criteria | Requirements |
|-------|----------|--------------|
| 🔴 **High** | auth, payments, encryption, SQL | Full module review, SAST, 90%+ tests, explicit sign-off |
| 🟡 **Medium** | APIs, databases, storage | Test-first, sampling review, 80%+ tests |
| 🟢 **Low** | internal tools, scripts | Basic coverage, awareness of limitations |

## Pre-commit Hook (Optional)

Add to `.husky/pre-commit` for automated enforcement:

```bash
#!/bin/sh
echo "Running AI-Coding Framework checks..."
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$')

for FILE in $CHANGED_FILES; do
    RISK_LEVEL=$(python scripts/vibe_framework.py classify "$FILE" | grep -oE '(HIGH|MEDIUM|LOW)')
    python scripts/vibe_framework.py check "$FILE" --risk-level "$RISK_LEVEL" || exit 1
done
```

## Configuration

Environment variables:

- `VIBE_AUDIT_DIR` — Override default `.vibe_audit/` location
- `VIBE_MIN_TESTS` — Minimum test coverage threshold (default: 80%)

## Integration

### CI/CD Example (GitHub Actions)

```yaml
- name: AI Code Review
  run: |
    python scripts/vibe_framework.py check src/ --recursive
    python scripts/vibe_framework.py view --limit 5
```

### VS Code Extension

Add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.vibeCheck": "always"
  }
}
```

## Files

- `framework-vibe-coding.md` — Complete framework documentation
- `scripts/vibe_framework.py` — CLI implementation
- `example/auth.py` — Sample high-risk code for testing
- `.husky/pre-commit` — Pre-commit hook template

## Development

```bash
# Run tests
pytest tests/

# Lint
flake8 scripts/vibe_framework.py

# Type check (optional)
mypy scripts/vibe_framework.py
```

## Sources

- Karpathy, A. (2025). Vibe coding definition. Twitter.
- Willison, S. (2025). "Not all AI-assisted programming is vibe coding."
- Caosun & Aral (2026). "The Augmentation Trap." arXiv:2604.03957

---

**Status:** v0.1 — Initial release  
**License:** MIT
