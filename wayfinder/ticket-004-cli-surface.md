---
parent: map.md
labels: wayfinder:grilling
closed: true
---
Status: CLOSED

# CLI surface design — commands, flags, output

## Resolution

- **Primary command**: `npx agent-os review [target]` — flexible target (branch, commit sha, range `main..feature`, or default current uncommitted changes)
- **Other commands**: `npx agent-os scan` (security scan), `npx agent-os verify` (existing verify.js pipeline), `npx agent-os handoff` (write a handoff doc). Additional skills become commands as they ship.
- **Flags**:
  - `--json` — machine-readable JSON output
  - `--fix` — auto-fix minor issues (formatting, secret removal, etc.)
  - `--standards <path>` — override default `.standards.md`
  - `--output <path>` — write report to file
  - `--fail-fast` — stop on first failure
- **Output**: stdout (markdown) + optional file via `--output`
- **Exit codes**: 0 = clean, 1 = violations found, 2 = runtime error
- **No target**: defaults to `git diff` of current uncommitted changes

### CLI usage examples

```
npx agent-os review main..feature/my-branch --output report.md\nnpx agent-os review feature/my-branch --json\nnpx agent-os review --fix\n">npx agent-os scan\nnpx agent-os verify\nnpx agent-os handoff  # skill: write handoff doc
```

## Question

What exactly does the user type and what do they get back? The CLI surface for `npx agent-os`.

Specifically:
- **Primary command**: `npx agent-os review <target>` — what is `<target>`? A branch name? A commit sha? A range like `main..feature`? All of the above?
- **Other commands**: What else is on the CLI? `scan`? `verify`? `handoff`? `skill <name>`? Do all skills become commands automatically?
- **Output format**: Structured (JSON? Markdown report? Terminal-only?) — and where does it land? stdout? A file? Both?
- **Flags**: `--fix` for auto-fixing minor issues? `--json` for machine-readable output? `--standards <path>` to override the default `.standards.md` location?
- **Exit codes**: 0 for clean, 1 for violations, >1 for errors? Does the review fail loudly on violations or just report?