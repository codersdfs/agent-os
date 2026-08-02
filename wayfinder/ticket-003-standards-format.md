---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# .standards.md format for code review

## Resolution

- **Format**: YAML frontmatter with rule categories as key-value pairs
- **Rule types**: naming conventions, file structure, security, complexity, test coverage minimums
- **Diff source**: git diff from the current repo state — agent reads `.standards.md`, runs `git diff`, feeds both to review skill
- **File location**: `.standards.md` at repo root, optional: `--standards <path>` flag to override
- **Relationship to existing configs**: `.standards.md` references ESLint config rather than duplicating; ESLint configs handle linting, `.standards.md` expresses project-specific conventions

### Example `.standards.md`

```yaml
---
naming:
  files: snake_case\nfunctions: camelCase\nconstants: UPPER_SNAKE_CASE\n  classes: PascalCase\nsecurity:
  no_eval: true
  no_require_with_variable: true
  no_innerHTML: true
complexity:
  max_cyclomatic: 15
  max_nesting: 4
tests:
  min_coverage: 80%
custom_rules:
  - "All TODOs must have an issue number"
  - "Public APIs must have JSDoc"
---

# Project Standards

Additional conventions and notes for the codebase.
```

## Question

What does `.standards.md` look like? The code review skill reads it to know what to check, so its format shapes how the review skill works.

Specifically:
- **Schema**: Is it a formal YAML frontmatter document with rule categories? A simple markdown checklist? A table?
- **Rule types**: What kinds of rules can it express? Naming conventions, file structure, security requirements, complexity limits, test coverage thresholds?
- **Machine-readable vs human-readable**: Should `.standards.md` be parseable by code (JSON Schema input), or is it a prompt recipe for the AI to interpret?
- **Example content**: What does a minimal `.standards.md` for a typical Node project contain?
- **Relationship to existing configs**: `.eslintrc`, `tsconfig.json`, `.prettierrc` — does `.standards.md` reference these or duplicate/subset them?