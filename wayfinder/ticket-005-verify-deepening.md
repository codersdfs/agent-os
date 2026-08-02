---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# verify.js deepening — what new gates?

## Resolution

- **New gates**: code review (reads `.standards.md`), complexity check (ESLint complexity rule), and Socket (replaces `npm audit`).
- **Gate order**: code review runs after all existing gates pass — review is the final, most important gate.
- **Composition**: `npx agent-os verify` runs ALL gates including review. `npx agent-os review` runs just the review skill. verify includes review as one of its gates.
- **Gates (new order)**:
  1. `npm audit` → Socket (swapped)
  2. selfcheck
  3. security-scan
  4. skill-assemble
  5. typecheck (if TypeScript)
  6. test (if npm test exists)
  7. complexity (ESLint complexity rule, max 15 cyclomatic)
  8. **code review** (final gate — reads `.standards.md`, runs diff analysis)
- **Configuration**: `.standards.md` drives review; other gates use their own configs
- **Exit**: verify uses the same 0/1/2 convention as review

## Question

The existing `verify.js` runs: audit, selfcheck, security-scan, skill-assemble, typecheck, test. What new quality gates should it add to become a genuinely useful AI-code-quality pipeline?

Specifically:
- **New gates**: AI code review (reading `.standards.md`), complexity analysis, duplicate detection, what else?
- **Ordering**: Do new gates run before or after the existing ones? Are any gated on the review step?
- **Parallelism**: Should quality gates be parallelizable (like `verify` spawns subprocesses for each check)?
- **Integration**: Should `verify` call into `agent-os review` as one of its gates, or does `review` replace `verify`?
- **Configuration**: Should `.standards.md` drive what verify checks, or does verify have its own configuration?