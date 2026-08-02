---
skill_name: "OBSIDIAN_VAULT"
library_type: "internal"
summary: "Search, create, and manage notes in an Obsidian vault with wikilinks"
depends_on: []
trigger_keywords: ["obsidian", "vault", "wikilink", "note", "index note", "find notes"]
---

# OBSIDIAN_VAULT

Search, create, and manage notes in the Obsidian vault. Use when the user
wants to find, create, or organize notes. The vault lives wherever the user
points you — confirm the path before assuming; it is mostly flat at root.

## Naming conventions

- **Index notes** aggregate related topics (e.g. `Skills Index.md`).
- **Title case** for all note names.
- No folders for organization — use links and index notes instead.

## Linking

- Use Obsidian `[[wikilinks]]` syntax: `[[Note Title]]`.
- Notes link to dependencies/related notes at the bottom.
- Index notes are just lists of `[[wikilinks]]`.

## Workflows

### Search for notes

```bash
# By filename
find "<vault path>" -name "*.md" | grep -i "keyword"

# By content
grep -rl "keyword" "<vault path>" --include="*.md"
```

Or use Grep/Glob tools directly on the vault path.

### Create a new note

1. Title Case filename.
2. Write content as a unit of learning.
3. Add `[[wikilinks]]` to related notes at the bottom.
4. If part of a numbered sequence, use the hierarchical numbering scheme.

### Find related notes (backlinks)

```bash
grep -rl "\[\[Note Title\]\]" "<vault path>"
```

### Find index notes

```bash
find "<vault path>" -name "*Index*"
```
