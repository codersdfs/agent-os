# Research: Existing Node.js-based Code Review/Lint/Quality Tools for `agent-os review` Pipeline

## Summary
Multiple viable tools exist for the pipeline. **danger-js** is the strongest code-review framework (MIT, mature, plugin system). For secrets, **detect-secrets** (npm wrapper) or **trufflehog CLI** (Go binary) are options. **ESLint** covers complexity + security rules natively. **parse-diff** is a zero-dependency diff parser. **dependency-cruiser** and **Socket** handle supply-chain/dependency quality. The Vercel AI SDK has no code analysis primitives — it's for app-building.

## Findings

1. **danger-js** (`danger`) — MIT license, mature, actively maintained. Runs after CI, automates PR conventions (enforce CHANGELOGs, anti-patterns, file-change warnings). Provides a DSL + plugin system. Works with GitHub, BitBucket, and most CI platforms. **Recommendation: USE** — it's the closest to a configurable code-review framework. Can be wrapped to read `.standards.md` and translate rules into Danger DSL. [Source](https://github.com/danger/danger-js)

2. **reviewdog** — Not an npm package. Go binary that wraps existing linters (eslint, eslint_d, etc.) and posts results to PRs. GPL-2.0 license. **Recommendation: WRAP** — can be called as a subprocess, but not Node-native. Useful if the pipeline needs to post to GitHub/BitBucket comments. [Source](https://github.com/reviewdog/reviewdog)

3. **eslint-plugin-review** — Does not exist on npm. **Recommendation: BUILD** if a custom ESLint plugin is needed for domain-specific rules. [Source](https://www.npmjs.com/package/eslint-plugin-review)

4. **detect-secrets** (npm) — Apache-2.0, stable wrapper around Yelp's Python tool. Falls back to Docker if Python not available. Exposes `detect-secrets-launcher` CLI. **Recommendation: WRAP** — works but depends on Python/Docker backend. For a pure Node pipeline, consider building a light wrapper or using a native alternative. [Source](https://github.com/lirantal/detect-secrets)

5. **trufflehog** (npm) — The npm package is a Reddit scraper, NOT the secret scanner. The real TruffleHog is a Go binary (`trufflesecurity/trufflehog`, AGPL-3.0). **Recommendation: WRAP** — call as CLI subprocess. Excellent secret detection (300+ detectors), but requires Go binary installation. [Source](https://github.com/trufflesecurity/trufflehog)

6. **ggshield** — Not on npm. Python/Go CLI by GitGuardian. **Recommendation: WRAP** — similar to trufflehog, call as subprocess if needed. [Source](https://github.com/ggshield/ggshield)

7. **ESLint `complexity` rule** — Built into ESLint (v0.0.9+), MIT license. Enforces max cyclomatic complexity per function. **Recommendation: USE** — already available via ESLint, no extra dependency. [Source](https://eslint.org/docs/latest/rules/complexity)

8. **plato** — MIT license, but "Needs active maintainer" — effectively abandoned (last release 1.7.0, 10+ years ago). **Recommendation: BUILD** or skip — use ESLint + escomplex instead. [Source](https://www.npmjs.com/package/plato)

9. **escomplex** — MIT license, v2.0.0-alpha. Calculates cyclomatic complexity, maintainability index, Halstead effort. **Recommendation: WRAP** — alpha state is a risk, but metrics are solid. Consider for complex projects if ESLint's complexity rule isn't enough. [Source](https://github.com/jared-stilwell/escomplex)

10. **dependency-cruiser** — MIT license, mature, actively maintained (v15+). Validates dependencies against configurable rules (circular deps, orphan modules, missing package.json entries). **Recommendation: USE** — excellent for dependency quality gates. Can output JSON for pipeline integration. [Source](https://github.com/sverweij/dependency-cruiser)

11. **parse-diff** — MIT license (inferred), v0.12.0, published 3 months ago, 0 dependencies, 161 dependents. Simple unified diff parser. Returns structured objects with `files[]`, `chunks[]`, `changes[]`, `additions`, `deletions`. **Recommendation: USE** — exactly what's needed for diff parsing. [Source](https://github.com/sergeyt/parse-diff)

12. **snyk** — CLI tool (not npm package). Open source (Apache-2.0), but closed to contributions since July 2024. `snyk test` for dependencies, `snyk code test` for source code. **Recommendation: WRAP** — can be called as CLI, but requires auth token and has usage limits. [Source](https://github.com/snyk/cli)

13. **socket** — npm package `socket`, v1.1.147, MIT license. Provides reachability analysis (Tier 1/2/3), package scoring, CVE patching. Also has `@socketsecurity/sdk` for programmatic access. **Recommendation: USE** — better than `npm audit` for supply-chain security. Free tier available. [Source](https://github.com/SocketDev/socket-cli)

14. **eslint-plugin-security** — MIT license, mature. ESLint rules for security hotspots (eval, non-literal require, buffer attacks, etc.). **Recommendation: USE** — complements ESLint complexity rule for security linting. [Source](https://github.com/eslint-community/eslint-plugin-security)

15. **Vercel AI SDK** (`ai`) — MIT license, actively maintained. For building AI applications, NOT for code analysis. No code analysis primitives. **Recommendation: SKIP** — not relevant for this pipeline. [Source](https://github.com/vercel/ai)

## Sources

### Kept
- **danger-js** (github.com/danger/danger-js) — primary code-review framework, MIT, mature
- **parse-diff** (github.com/sergeyt/parse-diff) — diff parsing, zero deps, actively maintained
- **dependency-cruiser** (github.com/sverweij/dependency-cruiser) — dependency validation, MIT, mature
- **socket** (github.com/SocketDev/socket-cli) — supply-chain security, MIT, actively maintained
- **eslint-plugin-security** (github.com/eslint-community/eslint-plugin-security) — security linting rules
- **detect-secrets** (github.com/lirantal/detect-secrets) — npm wrapper for secrets scanning
- **trufflehog** (github.com/trufflesecurity/trufflehog) — Go binary for secret detection
- **ESLint complexity rule** (eslint.org/docs/latest/rules/complexity) — built-in complexity checking
- **snyk** (github.com/snyk/cli) — security scanner CLI (closed contributions)
- **escomplex** (github.com/jared-stilwell/escomplex) — complexity metrics (alpha)

### Dropped
- **reviewdog** — Go binary, not Node-native; kept as WRAP reference only
- **plato** — abandoned, no active maintenance
- **Vercel AI SDK** — no code analysis capabilities
- **ggshield** — not on npm, similar to trufflehog
- **eslint-plugin-review** — doesn't exist

## Gaps
- No pure-Node secrets scanner found (detect-secrets wraps Python, trufflehog is Go)
- No AI-specific code analysis SDKs identified (Vercel AI SDK is for app-building)
- Danger-js is PR-focused; may need adaptation for standalone CLI diff analysis
- `npm audit` still the baseline for supply-chain; Socket is a stronger alternative but requires API token

## Supervisor coordination
No supervisor coordination needed — research complete.
