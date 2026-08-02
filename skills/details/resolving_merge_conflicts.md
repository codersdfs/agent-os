---
skill_name: "RESOLVING_MERGE_CONFLICTS"
library_type: "internal"
summary: "Resolve an in-progress git merge or rebase conflict, preserving intent"
depends_on: []
trigger_keywords: ["merge conflict", "rebase conflict", "merge/rebase", "conflicting files", "resolve the merge"]
---

# RESOLVING_MERGE_CONFLICTS

Use when a git merge or rebase is in progress and conflicts need resolving.

1. **See the current state** of the merge/rebase. Check git history and the
   conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each
   change was made and what the original intent was — read commit messages,
   PRs, original issues/tickets.

3. **Resolve each hunk.** Preserve both intents where possible. Where
   incompatible, pick the one matching the merge's stated goal and note the
   trade-off. Do **not** invent new behaviour. Always resolve; never
   `--abort`.

4. **Run the project's automated checks** — typically typecheck, then tests,
   then format. Fix anything the merge broke.

5. **Finish the merge/rebase.** Stage everything and commit. If rebasing,
   continue until all commits are rebased.
