---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# Package architecture — monolithic design decision

## Resolution

- **Two bins, one package**: `package.json` gets both `create-agent-os` (existing `index.js`) and `agent-os` (new CLI binary).
- **`agent-os` is standalone**: runs against any repo from anywhere, no scaffold required. It reads `.standards.md` from the target directory.
- **`create-agent-os` stays unchanged**: existing users unaffected.
- **Package structure**:
  ```
  package.json          # both bin entries
  index.js              # create-agent-os (unchanged)
  agent-os.js           # new CLI binary (agent-os)
  scripts/              # existing scripts (build_index.js, skill_loader.js, verify.js, etc.)
  template/             # scaffolder assets (unchanged)
  ```
- **Dependencies**: both binaries share the same `node_modules`. `js-yaml` is the only dependency; `agent-os.js` will need `parse-diff` (to USE).
- **Optional global install**: `npm install -g agent-os` makes both `create-agent-os` and `agent-os` available as shell commands.

## Question

What is the exact package structure for `agent-os`? We've decided "one monolithic package" — but what does that mean concretely for the npm entry points, the scaffold behavior, and the CLI surface?

Specifically:
- Does the package have **two bin entries** — `create-agent-os` (scaffolder) AND `agent-os` (CLI)?
- When the user runs `npx agent-os`, does it work from inside a scaffolded workspace or independently?
- Does the CLI require a workspace environment, or can it run standalone against any repo?
- How does `npm create agent-os@latest` relate to `npx agent-os review` — same package, different bin? Or does the scaffolder disappear and everything becomes one CLI?