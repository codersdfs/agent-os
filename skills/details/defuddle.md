---
skill_name: "DEFUDDLE"
library_type: "internal"
summary: "Extract clean markdown from web pages with the Defuddle CLI"
depends_on: []
trigger_keywords: ["defuddle", "clean markdown", "strip clutter", "web page to markdown", "read this url", "save tokens"]
---

# DEFUDDLE

Extract clean, readable content from web pages with the Defuddle CLI — it
removes navigation, ads, and clutter, cutting token usage. Prefer it over
plain fetching for standard web pages. Do **not** use for URLs ending in
`.md` — those are already markdown.

If not installed: `npm install -g defuddle`.

## Usage

Always use `--md` for markdown output:

```bash
defuddle parse <url> --md
```

Save to a file:

```bash
defuddle parse <url> --md -o content.md
```

Extract a specific metadata property:

```bash
defuddle parse <url> -p title
defuddle parse <url> -p description
defuddle parse <url> -p domain
```

## Output formats

| Flag | Output |
|------|--------|
| `--md` | Markdown (default choice) |
| `--json` | JSON with both HTML and markdown |
| (none) | HTML |
| `-p <name>` | Specific metadata property |
