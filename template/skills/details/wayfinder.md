---
skill_name: "WAYFINDER"
library_type: "internal"
summary: "Chart a large, foggy effort as a map of decision tickets, then work them one at a time"
depends_on: []
trigger_keywords: ["wayfinder", "wayfinding", "chart the map", "decision tickets", "fog of war", "loose idea", "map this effort"]
---

# WAYFINDER — chart the way, then work the map

Use when a loose idea arrives — too big for one session, the route to the
destination not yet visible. Wayfinding finds the way; it doesn't charge at
the destination.

## The map

One artifact labelled `wayfinder:map`, the canonical index (not a store — a
decision lives in exactly one place, its ticket):

- **Destination** — 1–2 lines: what reaching the end looks like (the spec,
  decision, or change). Settled first; it fixes scope.
- **Notes** — domain, skills to consult, standing preferences.
- **Decisions so far** — one line per closed ticket: gist + link.
- **Not yet specified** — fog: in-scope dimness not sharp enough to ticket.
- **Out of scope** — work ruled beyond the destination; closed, never
  graduates (returns only if the destination is redrawn, as a fresh effort).

## Tickets

Each ticket is a child of the map; its body is the Question (the decision or
investigation). Types: `research` (AFK), `prototype` (HITL), `grilling`
(HITL), `task` (HITL or AFK).

- **Claim before work**: assign the ticket to yourself first, so concurrent
  sessions skip it. The assignee IS the claim.
- **Blocking**: a ticket is unblocked when every ticket blocking it is
  closed. The **frontier** = open + unblocked + unclaimed tickets — the edge
  of the known.
- **HITL rule**: grilling/prototype tickets resolve only through live
  exchange with the human. Never stand in for the human's side of it.

## Fog of war

Don't chart what you can't yet see. **Fog or ticket?** — the test is whether
you can state the question precisely *now*, not whether you can answer it:

- Can state it sharply → **ticket** it, even if blocked.
- Can't phrase it yet → **Not yet specified**; one fog patch may graduate
  into several tickets, or none.

Resolving a ticket clears the fog ahead of it, graduating what's now
specifiable into fresh tickets — one at a time, until the way is clear and
no tickets remain.

## Invocation

**Chart the map** (loose idea): name the destination (grilling) → map the
frontier breadth-first → if no fog surfaces, you don't need a map — stop and
ask how to proceed → create the map, create the specifiable tickets, wire
blocking in a second pass → fire research subagents → stop (charting
hand-resolves nothing).

**Work the map** (map URL/number): load the map (low-res) → pick the ticket
(user-named, else first frontier) → claim it → resolve it (zoom related
tickets on demand; invoke the skills the Notes name) → record the
resolution, close, append to Decisions so far → add newly-surfaced tickets,
graduate fog, rule out-of-scope discoveries out.

Never resolve more than one ticket per session — research tickets excepted.

## Refer by name

Refer to maps and tickets by title, never by bare id or number. A name wraps
its link; a wall of numbers is illegible.
