---
skill_name: "HANDOFF"
library_type: "internal"
summary: "Compact the conversation into a handoff document for a fresh agent"
depends_on: []
trigger_keywords: ["handoff", "hand off", "another agent", "fresh agent", "continue the work", "handover"]
---

# HANDOFF — write a handoff document

When the user wants another agent (or a later session) to continue the work,
write a handoff document summarising the conversation.

## The document

Save it to the **OS temp directory** — never the current workspace.

- **Mission** — what the next agent is to finish, tailored to the user's
  stated focus (if they passed arguments, they describe the next session's
  focus — tailor accordingly).
- **Entry points** — paths/URLs to read first (maps, tickets, specs, plans,
  commits). Do NOT duplicate content already captured in artifacts; reference
  them by path or URL instead.
- **Decisions already made** — one-liners with pointers to the artifact that
  holds the detail. Tell the next agent what NOT to reopen.
- **Execution order** — the steps, in order, with the acceptance criteria.
- **Constraints** — environment, conventions, redactions, how to verify.
- **Suggested skills** — the skills the next agent should invoke, with one
  line on why each.

## Rules

- **Redact sensitive information**: API keys, passwords, PII. Never print the
  user's git identity or credentials; reference configs instead.
- Refer to things by **name**, not bare ids.
- If the user passed arguments, treat them as a description of what the next
  session will focus on and tailor the doc accordingly.
