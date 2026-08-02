---
labels: wayfinder:map
---

# Agent OS — executable skills + quality pipeline

## Destination

Evolve `create-agent-os` into a single monorepo package where the primary interface is `npx agent-os review <branch/commit>`. Skills are paired with executable `.js` files — the markdown defines intent, the JS executes it. The quality pipeline deepens existing verify/selfcheck tooling and adds a code review against a repo's `.standards.md`. Skills are no longer passive guidance; they're runnable commands. `npx` primary, optional global install.

## Notes

- **Domain**: Node.js, npm packaging, AI coding agents, quality pipelines
- **Skills to consult:** code-review (to be built), improve_codebase_architecture (deepening), wayfinder (this map), handoff (clean handoffs between sessions)
- **All work goes in this monorepo** — `create-agent-os` evolves in place, not a separate package
- **The challenger:** `vibe-coding-difficulties-summary.md` and `vibe-coding-fixes-potential.md` are source documents for what this tool must address — skimming them before building is useful
- **Design taste:** Keep the pipeline simple — each skill's executable is a single script; no framework, no build step beyond what `npm` gives you

## Decisions so far

- [Research: existing Node review/lint tools](ticket-006-research-lint-tools.md) — USE: danger-js (code review framework), parse-diff (diff parsing), dependency-cruiser (dep validation), eslint-plugin-security (security linting), socket (supply-chain); WRAP: trufflehog (secrets, Go binary); skip: Plato (abandoned), Vercel AI SDK (irrelevant); ⚠ no pure-Node secrets scanner found
- [Package architecture — monolithic design decision](ticket-001-package-architecture.md) — two bins (`create-agent-os` + `agent-os`) in one package, `agent-os` runs standalone anywhere, `create-agent-os` unchanged
- [Skill .js pairing contract](ticket-002-skill-js-pairing.md) — skills paired with `skills/executables/<name>.js`, frontmatter gets `executable` field, new `skill_runner.js` for discovery + execution, report-and-continue on errors
- [.standards.md format for code review](ticket-003-standards-format.md) — YAML frontmatter with 5 rule categories (naming, security, complexity, tests, custom), git diff as review source, references ESLint configs rather than duplicating
- [CLI surface design](ticket-004-cli-surface.md) — `npx agent-os review [target]` with flexible target spec, `--json`/`--fix`/`--output`/`--fail-fast` flags, 0/1/2 exit codes, additional commands: `scan`, `verify`, `handoff`
- [verify.js deepening](ticket-005-verify-deepening.md) — new gates: complexity check + code review (final gate). Socket replaces npm audit. `verify` includes review as one gate; `review` is also a standalone command. 8 gates total.
- [Which skills get executables first?](ticket-007-executable-priority.md) — only code-review + improve_codebase_architecture get `.js` pairs. Other 9 stay behavioral.

## Not yet specified

- How executable skills interact with the 7-defense framework (do executables need their own barriers?)
- How `agent-os review` composes with existing tool ecosystems (husky, lint-staged, CI) — partly depends on [package architecture](ticket-001-package-architecture.md) and [CLI surface](ticket-004-cli-surface.md)
- Whether MCP is the right tool-registration layer for multi-agent compatibility, and whether Pi extensions or Claude hooks should also ship with agent-os (resolved: npx is enough — see [ticket 008](ticket-008-agent-invoke-layer.md), [ticket 009](ticket-009-sidecar-plugin.md))

## Blocking relationships

<!-- no native tracker — documented here until tickets have stable ids -->

- [Package architecture — monolithic design decision](ticket-001-package-architecture.md) blocks: ~~002, 003, 004, 005~~ (all unblocked)
- [Skill .js pairing contract](ticket-002-skill-js-pairing.md) blocks: 005
- [.standards.md format for code review](ticket-003-standards-format.md) blocks: nothing directly (implementation detail)
- [CLI surface design](ticket-004-cli-surface.md) blocks: 005
- [verify.js deepening](ticket-005-verify-deepening.md) blocks: nothing (terminal)
- [Research: existing Node review/lint tools](ticket-006-research-lint-tools.md) blocks: nothing (unblocks 003/004 with facts)

- [How does an agent invoke agent-os?](ticket-008-agent-invoke-layer.md) — `npx` is the interface. Every agent already shells out. AGENTS.md documents the commands.
- [Installable agent sidecar plugin?](ticket-009-sidecar-plugin.md) — no sidecar, no MCP. `npx` is the universal plugin.

## Out of scope

<!-- ruled out: work beyond 'npx agent-os review' -->