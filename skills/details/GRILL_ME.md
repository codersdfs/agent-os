---
skill_name: "GRILL_ME"
library_type: "internal"
summary: "Relentless interview skill that asks every frontier question in rounds for collaborative planning"
depends_on: ["PLANNING"]
trigger_keywords: ["grill", "interview", "ask questions", "frontier question", "expand plan"]
disable-model-invocation: true
force_read_detail: false
token_estimate: 500
---

# Grill Skill

The Grill skill is an interactive interviewing tool designed to work in conjunction with the Planning skill. It collects detailed information from the user through structured questioning, enabling progressive expansion of plan graphs and more comprehensive project planning.

## Purpose & Integration

The Grill skill specifically supports the Planning skill by:

1. **Answering Expansion Questions**: When the Planning skill identifies a decision node (DEC-###) or unexpanded area in its graph, it passes these to the Grill skill via subprocess calls. The Grill skill asks the user targeted questions to gather needed details.

2. **Round-Based Interaction**: Work occurs in rounds where all frontier questions are asked simultaneously. The Planning skill can then process answers and identify new frontier nodes for subsequent rounds.

3. **Fact Discovery**: When the Planning skill's questions require environmental facts (file existence, API availability, etc.), the Grill skill should dispatch sub-agents to find this information rather than asking the user.

4. **Feedback Loop**: After each round of questioning, the Planning skill processes responses, updates its internal graph, and determines whether additional rounds are needed or if plan breakdown into tickets can begin.

## Usage Pattern

### With Planning Skill

The typical workflow when both skills are used together:

```
Planning Skill → [asks grill] → Grill Skill → [answers user] → Planning Skill
     ↓                                           ↑
  expands graph                             processes answers
```

**Step-by-step interaction:**
1. Planning skill initializes with high-level context
2. Planning skill queries Grill skill for questions related to its frontier nodes
3. Grill skill returns structured questions to Planning skill
4. Planning skill presents questions to user (directly or via another interface)
5. User answers are returned to Planning skill
6. Planning skill feeds answers back to Grill skill for processing/validation
7. Planning skill updates its graph based on confirmed information
8. Repeat until sufficient detail is gathered or user stops

### Direct Invocation

While primarily designed as a collaborator with the Planning skill, the Grill skill can also be used standalone:

```bash
# Start an interview session directly
python scripts/grill-skill.py --init "Project planning context"

# Continue with previous session state
python scripts/grill-skill.py --continue <session-id>

# Ask specific frontier questions
python scripts/grill-skill --frontier DEC-001 DEC-002
```

## Protocol for Inter-Skill Communication

### Input Format (from Planning to Grill)

```json
{
  "plan_graph": { ... },
  "current_round": 3,
  "frontier_nodes": ["DEC-005", "DEC-007"],
  "required_context": ["project_type", "timeline_constraints"],
  "questions": [
    {
      "id": "DEC-005",
      "type": "decision",
      "prompt": "What timeline constraints apply to this project?"
    }
  ]
}
```

### Output Format (Grill back to Planning)

```json
{
  "answers": {
    "DEC-005": "Timeline: 3 months with bi-weekly milestones"
  },
  "new_nodes": [
    {
      "id": "TASK-008",
      "type": "task",
      "description": "Detailed implementation plan by milestone",
      "status": "partial",
      "parent": "DEC-005"
    }
  ],
  "questions_to_ask": ["DEC-010", "DEC-011"],
  "facts_discovered": {
    "environment": {
      "node_version": "18.17.0",
      "python_available": true
    }
  }
}
```

### File-Based Communication

When invoked as a subprocess, the Grill skill reads input from a temporary JSON file and writes output to a corresponding output file:

```
Input:  /tmp/grill-input-123456.json
Output: /tmp/grill-output-123456.json
```

## Relationship with Planning Skill

The Grill skill depends on the Planning skill because:

1. **Context Understanding**: The Planning skill provides context about which parts of the plan need elaboration, allowing the Grill skill to ask focused rather than generic questions.

2. **Dependency Tracking**: As the Planning skill tracks dependencies between plan items, the Grill skill can understand which questions must precede others and schedule accordingly.

3. **Progressive Refinement**: Both skills share the concept of iterative refinement - the Plan expands through repeated interactions, with each round potentially uncovering new areas needing attention.

4. **Common Terminology**: Both use consistent node naming conventions (AREA-###, TASK-###, DEC-###) ensuring seamless communication between them.

Together, they form a powerful planning pipeline where the Grill skill gathers human knowledge and the Planning skill structures it into actionable, dependency-aware plans with ticket breakdowns.
