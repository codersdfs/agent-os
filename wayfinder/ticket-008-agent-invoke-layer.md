---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# How does an agent invoke agent-os?

## Question

### Resolution

**`npx` IS the agent interface.** Every coding agent (Pi, Claude Code, Codex) can already run shell commands. No MCP layer, no extension, no plugin needed.

- Pi: runs `npx agent-os review` via bash tool. That's it.
- Claude Code: same — CLAUDE.md tells it what the command does, it runs it.
- Codex: same — AGENTS.md. All ship with `npm run skill-*` already.

**What ships**: The `AGENTS.md` in scaffolded workspaces gets a section documenting `npx agent-os review / scan / verify` as available quality commands. That's the "registration layer" — a markdown file all agents already read.

**When to add MCP/plugins**: if an agent can't run shell commands (unlikely), or when a tighter integration (streaming results mid-session) is needed. Not now.

`npx agent-os review` is a CLI. But the destination says "agent-invokable tool" — what does that mean concretely across Pi, Claude Code, and Codex?

Specifically:
- **Is it just a shell command?** All agents can run `npx agent-os review`. Is that enough?
- **Or is it a tool registration?** Pi extensions register custom tools. Claude Code reads CLAUDE.md. Codex reads AGENTS.md. Does agent-os need a registration layer for each?
- **What's the lowest common denominator?** MCP server? Or the fact that every agent can shell out makes this unnecessary?
- **Where does the tool live?** In the project workspace (npm script)? At the system level (global install)? Or should it be callable via npx from anywhere?