---
skill_name: "IMPROVE_CODEBASE_ARCHITECTURE"
library_type: "internal"
summary: "Scan a codebase for deepening opportunities, report them, then grill through the pick"
depends_on: []
trigger_keywords: ["improve architecture", "codebase architecture", "deepening", "deep modules", "architecture review", "refactor opportunity"]
---

# IMPROVE_CODEBASE_ARCHITECTURE

Surface architectural friction and propose **deepening opportunities** —
refactors that turn shallow modules into deep ones. Aim: testability and
AI-navigability.

## Shared vocabulary (use exactly, don't drift)

**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**,
**locality**. Principles: the **deletion test**, "the interface is the test
surface", "one adapter = hypothetical seam, two = real". Read the project's
domain language (`CONTEXT.md`) and ADRs (`docs/adr/`) first — don't re-litigate
recorded decisions.

## 1. Explore — scope before you scan (YAGNI)

Deepening pays off where change happens, so weight recently-changed areas:

- If the user named a direction, take it and skip the inference.
- Otherwise walk `git log --oneline` for hot spots — the files that keep
  coming up — and let them pull your attention.
- Read the domain glossary and relevant ADRs first.

Then explore organically, noting friction:

- Where does understanding one concept require bouncing between many small
  modules?
- Where are modules **shallow** — interface nearly as complex as the
  implementation?
- Where were pure functions extracted just for testability, while the real
  bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- What's untested, or hard to test through its current interface?

Apply the **deletion test** to anything suspect: would deleting it
concentrate complexity, or just move it? "Concentrates" is the signal.

## 2. Present candidates as an HTML report

Write a self-contained HTML file to the OS temp directory (resolve from
`$TMPDIR`, fall back to `/tmp`, or `%TEMP%` on Windows), named
`architecture-review-<timestamp>.html` so each run is fresh. Open it for the
user (`start <path>` on Windows, `open` on macOS, `xdg-open` on Linux) and
tell them the absolute path.

## 3. Grill through the pick

Let the user pick an opportunity, then interrogate it — scope, seam, test
surface, deletion test — before any refactor proceeds. Do not start coding
until the pick is grilled.
