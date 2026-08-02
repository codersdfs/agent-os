# Responsible AI-Coding Framework

CLI tool for enforcing responsible AI-assisted development practices. Implements the framework defined in `framework-vibe-coding.md`.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt 2>/dev/null || true

# Make executable
chmod +x scripts/vibe.js
```

## Commands

### Classify code risk
```bash
node bin/vibe.js classify path/to/file.py
node bin/vibe.js classify path/to/directory/
```

**Output:**
```
Risk level: HIGH
```

Risk levels:
- **HIGH**: Auth, payments, security, user data — requires full review
- **MEDIUM**: APIs, databases, business logic — test-first required
- **LOW**: Internal tools, throwaway scripts — basic checks only

---

### Run safety checks
```bash
node bin/vibe.js check path/to/file.py
node bin/vibe.js check path/to/file.py --risk-level high
```

**Checks performed (by risk level):**

| Check | LOW | MEDIUM | HIGH |
|-------|-----|--------|------|
| Secret scanning | ✓ | ✓ | ✓ |
| TODO/FIXME markers | — | — | ⚠️ |
| Debug output (print) | — | — | ⚠️ |
| Test indicators | — | ⚠️ | ⚠️ |

**Exit codes:**
- `0`: All checks passed
- `1`: Checks failed — fix before committing

---

### Log audit trail
```bash
node bin/vibe.js audit "Create login endpoint" auth.py
# Or pipe from stdin:
echo "def login(): pass" | node bin/vibe.js audit "Auth helper"
```

**Output:**
```
Audit logged: high risk, hash a1b2c3d4e5f6
```

Audit entries saved to `.vibe_audit/` (gitignored).

---

### View audit log
```bash
node bin/vibe.js view
node bin/vibe.js view --limit 5
```

---

### Interactive certification
```bash
node bin/vibe.js signoff
```

Prompts through checklist:
1. Reviewed module-by-module
2. Understand logic/intent
3. Verified security implications
4. Accept responsibility
5. Prompt history preserved

Certification saved to `.vibe_cert` (gitignored).

---

## Pre-commit Integration

Add to `.husky/pre-commit` or equivalent:

```bash
#!/bin/sh
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$')

for FILE in $CHANGED_FILES; do
    RISK_LEVEL=$(node bin/vibe.js classify "$FILE" 2>/dev/null | grep -oE '(HIGH|MEDIUM|LOW)' | tr '[:lower:]' '[:upper:]')
    [ -n "$RISK_LEVEL" ] && node bin/vibe.js check "$FILE" --risk-level "$RISK_LEVEL" || exit 1
done
```

Or with npm scripts:
```json
{
  "scripts": {
    "precommit": "node bin/vibe.js check"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run vibe:check"
    }
  }
}
```

---

## Package Scripts

```bash
npm run vibe:classify -- path/to/file.py
npm run vibe:check -- path/to/file.py
npm run vibe:audit -- "prompt" code.py
npm run vibe:signoff
npm run vibe:view -- --limit 5
```

---

## Configuration

No config file needed. To customize patterns, edit `scripts/vibe.js`:

```python
HIGH_RISK_PATTERNS = [
    r'(your-pattern-here)',
    # ...
]

MEDIUM_RISK_PATTERNS = [
    r'(your-pattern-here)',
    # ...
]
```

---

## Requirements

- Python 3.7+
- No external dependencies (stdlib only)

---

## Framework Documentation

Full framework specification: [`framework-vibe-coding.md`](../framework-vibe-coding.md)

Wayfinder map: [`.scratch/wayfinder/vibe-coding-framework/`](../.scratch/wayfinder/vibe-coding-framework/)
