# Distilling skills into the agent-os contract

How an external `SKILL.md` becomes `skills/details/<name>.md` — a single,
self-contained skill file the pipeline can index and load.

## The contract (frontmatter)

| Key | Rule |
|---|---|
| `skill_name` | UPPERCASE with underscores, unique |
| `library_type` | `internal` — unless the skill pins a specific library, in which case `public` + `library_name` + `locked_version` (hard gate) |
| `summary` | ≤15 words — this is what appears in the index and the assembled prompt |
| `depends_on` | `[]` unless it genuinely needs another skill loaded first |
| `trigger_keywords` | 4–8 terms. Phrase triggers score +10, single words +3, substrings +1 — choose the phrases a user would actually say |

## Distillation rules

1. **Keep the playbook.** When to activate, the steps, the rules, the exit
   conditions. If the source has a "when to use" section, it becomes trigger
   guidance + the body's opening line.
2. **Cut ruthlessly.** Marketing framing ("world-class", "elite"), meta
   commentary about the skill itself, the source repo's own machinery
   (install commands, plugin references, `/commands`), environment-specific
   paths and personal names, and examples that don't carry a rule.
3. **Self-contained.** No asset dependencies. If the source needs scripts,
   inline the minimal logic or drop the feature and note the drop.
4. **Size: target ≤250 lines.** A 500+ line source becomes its skeleton —
   the distilled skill is a seed the user co-evolves, not a book. Deep detail
   is re-added by the user when they need it.
5. **Naming.** File = `skill_name` lowercased with underscores.
6. **Attribution lives outside the body** — in `THIRD_PARTY_NOTICES`, not in
   the skill file.

## The reference conversion

`skills/details/wayfinder.md` is the measured example. Every future
conversion is judged against it: same structure, same discipline, no fluff
survives. If a conversion is longer or softer than wayfinder's, re-cut.
