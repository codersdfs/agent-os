---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# Skill .js pairing contract

## Resolution

- **Filesystem**: `skills/executables/<skill_name_lowercase>.js` — paired sibling to `skills/details/<skill_name_lowercase>.md`
- **Frontmatter**: new field `executable: <relative_path>` (e.g., `executable: skills/executables/handoff.js`)
- **Discovery**: `skill_loader.js` gains `--exec <name>` flag — looks up frontmatter, returns script path
- **Runner**: new `skill_runner.js` executes scripts by skill name, loads script from `skills/executables/`
- **Execution contract**: each script receives structured input via CLI args (or stdin), outputs results to stdout, exits 0 on clean / non-zero on issues
- **Error handling**: report and continue — failures are visible but don't block the pipeline
- **Output format**: each skill outputs either markdown (human-readable) or `--json` flag for machine-readable

## Script discovery chain
1. `skill_runner.js <skill_name> <args...>` — reads frontmatter from `skills/details/<skill_name>.md`
2. If `executable` field exists → runs `skills/executables/<skill_name_lowercase>.js` with args
3. If not → prints error: `Skill <name> has no executable attached`

## I/O contract for executable skills

Input (CLI): positional args or `--stdin` with JSON config
```json
{
  "target": "/path/to/repo",
  "diff": "git diff --unified\n...",
  "standards": "/path/to/.standards.md"
}
```

Output: structured report to stdout (markdown by default, `--json` for machine)

Exit codes: 0 = clean, 1 = issues found, 2 = runtime error

## Question

What is the exact mechanism that pairs a skill markdown file with its executable JavaScript counterpart?

Specifically:
- **Filesystem convention**: Does `skills/details/improve_codebase_architecture.md` get a companion at `skills/details/improve_codebase_architecture.js`? Or at `skills/executables/`? Or somewhere else?
- **Frontmatter field**: Does the `.md` frontmatter get a `executable` or `script` field pointing to the `.js` file? Or is the pairing purely by naming convention?
- **Discovery**: Does `skill_loader.js` gain the ability to find and run executables? Or does a new `skill_runner.js` handle execution while `skill_loader.js` stays trigger-only?
- **Signature**: What does an executable skill script export/return? A function? A CLI command? Does it receive input via stdin, args, or a structured object?
- **Error boundary**: If an executable fails, what happens? Does it block the pipeline or report and continue?