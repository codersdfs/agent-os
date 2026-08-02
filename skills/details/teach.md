---
skill_name: "TEACH"
library_type: "internal"
summary: "Teach the user a skill or concept across sessions, in a stateful workspace"
depends_on: []
trigger_keywords: ["teach", "teach me", "lesson", "learn", "learning", "tutorial"]
---

# TEACH — stateful, multi-session teaching

The user asked to be taught something. This is stateful — they intend to
learn over multiple sessions, and the current directory is the teaching
workspace.

## The workspace

- `MISSION.md` — the *reason* the user wants this topic. Grounds all
  teaching. If unclear, question the user before anything else.
- `reference/*.html` — compressed learnings: cheat sheets, glossaries,
  syntax. Quick-reference documents, beautiful and printable.
- `RESOURCES.md` — trusted resources grounding your teaching. Never trust
  parametric knowledge until this is populated.
- `learning-records/*.md` — non-obvious lessons (like ADRs), titled
  `0001-<dash-case>.md`. Drive the zone of proximal development.
- `lessons/*.html` — one self-contained HTML per lesson, `0001-<name>.html`.
  The primary unit of teaching.
- `assets/*` — reusable components (stylesheets, quiz widgets). Reuse is the
  default: read `assets/` before authoring; never inline what a future lesson
  would duplicate.
- `NOTES.md` — the user's preferences and your working notes.

## Philosophy

- **Knowledge** from high-trust resources, **skills** through interactive
  lessons, **wisdom** from real-world communities. Before `RESOURCES.md` is
  populated, hunt for quality sources.
- **Fluency vs storage strength**: in-the-moment retrieval is not mastery.
  Build storage strength with desirable difficulty — retrieval practice,
  spacing, and (for skills) interleaving.

## Lessons

One tight thing per lesson, tied to the mission, in the user's zone of
proximal development. Short and completable quickly — working memory is
small. Each gives a single tangible win. Make them **beautiful** (Tufte-clean
typography; they get re-read), link to other lessons/references via anchors,
recommend one primary source to read, and end with a reminder to ask follow-up
questions. Give immediate feedback: quizzes where answers are equal-length
(no formatting clues), or guided real-world steps.

## Knowledge and skills

Teach only the knowledge a skill requires. For acquiring knowledge, difficulty
is the enemy; for skill acquisition, difficulty is the tool. Litter lessons
with citations — trustworthiness comes from sources.

## Wisdom

When a question needs real-world judgement, attempt an answer, then delegate
to a **community** — a forum, subreddit, class, or local group. Find
high-reputation options; respect a preference to skip communities.

## Mission drift

Missions change as the user grows — update `MISSION.md` and add a learning
record. Confirm changes with the user first.
