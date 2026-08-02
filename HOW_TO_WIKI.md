# Wiki Map — How to Use

The wiki is your agent's second brain. This doc explains how to:
1. Build the wiki (ingest sources)
2. Read the wiki (query + map)
3. Hand off between agents via the wiki

## What is the wiki?

A local, browsable knowledge graph stored in `wiki/`. Every agent session in
this workspace reads and writes it — that's how context survives between sessions.

```
raw/              ← source material (read-only)
  project.md
  research.pdf
  notes.txt
wiki/             ← your knowledge (write freely)
  index.md        ← catalog of all pages
  log.md          ← append-only activity log
  AGENTS.md       ← AI agents
  MY-RESEARCH.md  ← source summary
  META-SKILL.md   ← entity/concept page
```

## 1. Build the wiki

### Ingest a source

```bash
# Drop a source into raw/
echo "# My Research Notes
LLMs are transforming agent architectures.
[[agent-arch]] patterns are emerging.
" > raw/my-notes.md

# Tell any agent session in the workspace to ingest it
npm run wiki-ingest -- raw/my-notes.md

# Or ingest via stdin (for pipe workflows)
cat raw/my-notes.md | npm run wiki-ingest:stdin -- "My Notes"
```

The script writes:
- `wiki/MY-NOTES.md` — source page with frontmatter (tags, date, sources, summary)
- Updates `wiki/index.md` — adds entry to the catalog
- Appends `wiki/log.md` — timestamped log entry

### What the agent does

When you say "ingest raw/my-notes.md", the agent:
1. Reads the source file
2. Extracts a summary (first non-heading line, max 80 chars)
3. Writes a page with YAML frontmatter
4. Updates the index
5. Logs the action

The agent can also create `entity` and `concept` pages from the source material.

## 2. Read the wiki

### Query (text search)

```bash
# Search by keyword
npm run wiki-query -- "llm agents"

# Get JSON output (for programmatic use)
npm run wiki-query -- "agent" --json
```

Output: ranked list of matching pages with scores and excerpts.

### Browse (localhost map)

```bash
# Start the wiki map server
npm run wiki-map          # opens http://localhost:3000
npm run wiki-map 8080     # custom port

# API endpoint
curl http://localhost:3000/api/
```

The map shows:
- All pages grouped by type (entity, concept, source)
- Backlinks for each page (who links to it)
- Direct links to broken references
- Full text of each page

### Lint (health check)

```bash
# Check for orphans, broken links, missing frontmatter
npm run wiki-lint
npm run wiki-lint -- --fix  # auto-add missing tags
```

## 3. Agent handoff

The wiki is how agents hand context between sessions.

### Before ending a session

```bash
# Let the wiki reflect what you've learned
npm run wiki-ingest -- raw/notes.md
npm run wiki-lint
```

### Starting a new session

Tell the new agent:
> "Read AGENTS.md, then run `npm run wiki-query -- \"<topic>\"` to get context."

Or:
> "Read the wiki index, focus on pages about <topic>."

### The log — timeline of what happened

```bash
cat wiki/log.md
```

Shows a timeline of all ingest/query/lint actions. New agents read this to
understand what previous agents did.

## Conventions

### Page types

| Type | Tag | Purpose |
|------|-----|---------|
| Source | `source` | Summary of one raw file |
| Entity | `entity` | A thing (person, tool, concept) |
| Concept | `concept` | An idea or pattern |

### Frontmatter

```yaml
---
tags: [wiki-page, source]
date: 2026-08-02
sources: [raw/my-notes.md]
status: seed           # seed | developing | stable
summary: "One-line summary"
---
```

### Wikilinks

```markdown
[[Page-Slug]] links to other wiki pages.
[[Page-Slug#section]] links to sections within a page.
```

The lint script checks for broken links. Fix them before considering the page stable.

## Troubleshooting

**Index not updating?**
```bash
npm run wiki-lint      # check for issues
npm run wiki-lint -- --fix
```

**Orphan page (not linked from index)?**
Add a link from the index or from another page:
```markdown
[[PAGE-SLUG]] — summary
```

**Query returns nothing?**
Check the page has content and proper frontmatter:
```bash
npm run wiki-query -- "<keyword>"
```

## Next steps

- Read `AGENTS.md` for wiki conventions your agents follow
- Run `npm run wiki-map` to browse the full knowledge graph
- Add agents to the `skills/details/` directory for specialized wiki operations
