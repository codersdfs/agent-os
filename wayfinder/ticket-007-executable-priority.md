---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# Which skills get executables first?

## Resolution

Only the review/quality skills get executables in this effort:

1. **code-review** (new) — the centerpiece, `.js` does: parse-diff + parse-standards + danger-js + output
2. **improve_codebase_architecture** (existing, deepened) — already has executable logic (generates HTML report via temp dir). Formalize as `skills/executables/improve_codebase_architecture.js`

The other 9 existing skills (handoff, wayfinder, teach, setup_matt_pocock_skills, meta_skill_framework, resolving_merge_conflicts, batch_grill_me, obsidian_vault, defuddle, requests_post) stay as behavioral-only `.md` files. Handoff already has a minimal executable embedded in its body (writes a file); maybe later.

**Test**: does the skill directly contribute to the `npx agent-os review` experience? If yes, executable. If no, leave it.