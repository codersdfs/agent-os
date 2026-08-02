---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# Installable agent sidecar plugin?

## Question

### Resolution

**No sidecar plugin, no MCP server.** `npx agent-os` is the interface. Every agent can shell out.

- Pi → `bash` tool runs `npx agent-os review`
- Claude Code → same, reads CLAUDE.md for context
- Codex → same, reads AGENTS.md for context

**When the user says "review", the agent runs the command.** That's it. The agent doesn't need a plugin — it needs a command it can trust to work anywhere.

Future: if agents standardize on MCP tools, an MCP server wrapper for agent-os could be added. But that's beyond this destination.

Should agent-os ship as an installable sidecar plugin for coding agents, or is `npx` from anywhere enough?

Specifically:
- Pi: extensions API — a Pi extension that registers `review`, `scan` as tools?
- Claude Code: a hook or CLAUDE.md convention that wires agent-os into Claude's toolset?
- Common: is a shared MCP layer possible, or is that over-engineering when `npx` already works?

What's the minimum that makes it feel like an integrated tool, not a shell command from a separate package?