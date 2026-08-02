---
kind: ticket
parent: map.md
labels: wayfinder:research
closed: true
---
Status: CLOSED

# Research: existing Node review/lint tools

## Question

### Resolution

Research complete — report at [wayfinder/research/report-006-existing-tools.md](research/report-006-existing-tools.md).

**Key findings:**

| Tool | Verdict | Reason |
|---|---|---|
| **danger-js** (`danger`) | ✅ USE | Mature, MIT, plugin system — best code-review framework |
| **parse-diff** | ✅ USE | Zero-deps diff parser, structured output, actively maintained |
| **dependency-cruiser** | ✅ USE | Dep validation, circular deps, MIT, mature |
| **eslint-plugin-security** | ✅ USE | Security hotspots via ESLint, no new dependency |
| **socket** (`@socketsecurity/sdk`) | ✅ USE | Better than npm audit for supply-chain, free tier |
| **trufflehog** | ⚠️ WRAP | Go binary — call as subprocess; best secrets scanner |
| **detect-secrets** | ⚠️ WRAP | Node wrapper around Python — fragile for pure-Node pipeline |
| **ESLint complexity rule** | ✅ USE | Built-in, no extra dep |
| **plato** | ❌ SKIP | Abandoned 10+ years |
| **Vercel AI SDK** | ❌ SKIP | App-building, no code analysis primitives |
| **reviewdog** | ⚠️ WRAP | Go binary, useful for PR posting but not core pipeline |
| **snyk** | ⚠️ WRAP | CLI-only, requires auth token, closed to contributions |

**No pure-Node secrets scanner found.** Gaps for future tickets: secrets scanning needs either a Go binary wrapper or a regex-based build.

What quality/review/lint Node libraries already exist that can be leveraged so we don't build from scratch? The investigation should surface:

- **Code review**: Are there existing Node packages that do code review against configurable standards? (e.g., `reviewdog`, `danger-js`)
- **Secret scanning**: Is there a good Node secret scanner beyond a regex scan? Could integrate `detect-secrets` or `trufflehog`?
- **Complexity**: ESLint's complexity rule? A dedicated package?
- **Security audit**: `npm audit` vs. something deeper like `snyk`?
- **Diff analysis**: Is there a good Node diff parser that can produce structured data from `git diff`?
- **What the AI SDK can do**: Does the Vercel AI SDK or any popular tool provide any integration points or code analysis utilities that could be wired into this?

Report back with finding names, version stability, licensing, and a recommendation: use, wrap, or build.