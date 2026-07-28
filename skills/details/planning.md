---
skill_name: "PLANNING"
library_type: "internal"
summary: "AI agent planning skill for creating expanding plan graphs through interactive questioning"
depends_on: ["GRILL_ME", "TO_TICKETS"]
trigger_keywords: ["plan", "planning", "create plan", "plan graph", "expand plan"]
force_read_detail: false
token_estimate: 400
---

# Planning Skill

The Planning skill is an AI agent tool that helps developers create detailed project plans through progressive questioning and graph expansion. It works in conjunction with the Grill skill (which asks questions) and produces plan.md output with tracer-bullet ticket breakdowns.

## When to Activate

- When a user asks to create or expand a project plan
- When initiating a new planning session
- When needing to break down complex plans into actionable tickets
- When working alongside the grill skill for iterative planning

## Core Concepts

### Plan Graph Structure

The planning skill maintains a hierarchical tree structure where each node represents a decision, task, or plan component. Each node has:

- **Unique ID**: Follows pattern `TASK-001`, `DEC-001`, `AREA-001` (type + sequential number)
- **Type**: One of `area` (major category), `task` (actionable item), `decision` (requires user input), `milestone` (key checkpoint)
- **Description**: Text explaining what this node represents
- **Children**: Nested child nodes forming the hierarchy
- **Dependencies**: References to other nodes that must be completed before this can proceed
- **Status**: One of `unexpanded`, `partial`, `complete`
- **Question**: For decision nodes, the question asked to the grill skill to get more detail

### Expansion Strategy

The planning skill uses two modes for expanding the graph:

1. **Reactive Expansion**: Responds to answers from the grill skill by adding nodes or deepening existing branches based on new information
2. **Proactive Expansion**: Identifies areas of the graph that need more detail and automatically generates follow-up questions to ask the grill skill

Both modes ensure the plan becomes progressively more detailed until it reaches sufficient completeness or the user indicates stopping.

### Subprocess Communication with Grill Skill

The planning skill communicates with the grill skill via subprocess calls using JSON files as the interchange format:

**Input Format (sent to grill skill)**
```json
{
  "plan_graph": { ... },
  "current_round": 3,
  "frontier_nodes": ["DEC-005", "DEC-007"],
  "required_context": ["project_type", "timeline_constraints"]
}
```

**Output Format (received from grill skill)**
```json
{
  "answers": {
    "DEC-005": "User provided answer about timeline",
    "DEC-007": "User provided answer about constraints"
  },
  "new_nodes": [
    {
      "id": "TASK-008",
      "type": "task",
      "description": "Detailed implementation plan",
      "status": "partial",
      "parent": "DEC-005"
    }
  ],
  "questions_to_ask": ["DEC-010", "DEC-011"]
}
```

The planning skill parses these responses and updates the internal graph accordingly.

## Process Flow

### Step 1: Initialize Planning Session

When activated, the planning skill prompts the user for high-level context:
- Project name/type
- Overall scope and goals
- Any known constraints (time, budget, resources)
- Stakeholders involved

This information forms the root node (`AREA-001`) of the plan graph.

### Step 2: Initial Graph Construction

Based on the initial context, the skill constructs a preliminary tree structure:
- Top-level categories (areas, phases, workstreams)
- Major deliverables or milestones at each level
- Decision points where user input is needed for refinement

Each node receives a unique identifier appropriate to its type.

### Step 3: Grill Integration Loop

The planning skill enters an iterative loop with the grill skill:

1. Identify frontier nodes (nodes with type=decision or status=unexpanded that have all prerequisites resolved)
2. Generate questions for each frontier node
3. Pass questions to grill skill via subprocess call
4. Receive answers and identify potential expansions
5. Update the plan graph with new information and nodes
6. Determine if additional questions are needed for deeper expansion
7. Repeat until no more frontier nodes exist or user stops the process

During this loop, the skill also actively identifies areas that would benefit from additional detail even if they haven't been reached yet, generating proactive questions to drive thoroughness.

### Step 4: Ticket Breakdown

Once planning is complete (or when requested mid-process), the skill converts the plan graph into tracer-bullet tickets following the To Tickets skill patterns:

1. Traverse the plan graph in dependency order
2. Group related tasks into vertical slices that form complete end-to-end capabilities
3. Assign blocking dependencies between tickets
4. Ensure each ticket delivers demonstrable value
5. Size tickets appropriately for single context window processing
6. Present proposed breakdown to user for validation and adjustment

### Step 5: Output Generation

The planning skill produces two main outputs:

**plan.md** - Human-readable document containing:
- Executive summary of the overall plan
- Hierarchical representation of the plan graph
- Complete list of tickets with titles, descriptions, blocking dependencies, and acceptance criteria
- Visual indication of current progress/completion status

**plan.dot** - DOT-format graph file for visualization tools (Graphviz, etc.) showing:
- Node relationships and dependencies
- Color-coded status indicators
- Hierarchical structure clearly visible

## Usage Examples

### Basic Planning Session

```bash
# Start planning session and interact with grill skill
npx planning --init "AI agent development project"
# This triggers grill skill interaction and builds initial graph

# Continue expansion with more questions
npx planning --expand --max-rounds 5

# Finalize and generate tickets
npx planning --finalize --output plan.md
```

### Programmatic Use

```javascript
// Import the planning library
const { PlanningAgent } = require('./src/planning');

async function buildPlan() {
  const planner = new PlanningAgent();
  
  // Initialize with context
  await planner.init({
    project: 'AI agent suite',
    scope: 'Multiple interconnected agents',
    constraints: { time: '3 months', team: 'small' }
  });
  
  // Iteratively expand through grill interaction
  while (!planner.isComplete()) {
    const grillResponse = await planner.queryGrillSkill();
    await planner.processResponse(grillResponse);
  }
  
  // Generate final outputs
  await planner.generateMarkdown('plan.md');
  await planner.generateDOT('plan.dot');
}
```

## Implementation Details

The planning skill should implement the following core components:

1. **Graph Manager**: Handles creation, modification, and traversal of the plan graph tree; manages node IDs, relationships, and states
2. **Question Generator**: Creates natural language questions for grill skill based on unexpanded or partially expanded nodes; incorporates both reactive and proactive strategies
3. **Subprocess Handler**: Manages communication with external grill skill process; handles JSON serialization/deserialization; implements retry logic for failed calls
4. **Ticket Breakdown Engine**: Analyzes plan graph structure; identifies optimal vertical slice groupings; calculates dependency chains between tickets
5. **Output Formatters**: Convert internal graph representations to Markdown and DOT formats; handle styling, numbering, and formatting according to conventions

For production deployment, the planning skill should include:
- Type definitions (if TypeScript) for all data structures
- Validation logic for incoming grill skill responses
- Error handling for subprocess failures and invalid inputs
- Logging for tracking expansion rounds and decisions made
- Configuration options for controlling verbosity, output formats, and interaction limits

## Relationship with Other Skills

The Planning skill depends on:

**Grill Skill (GRILL_ME)**: Used iteratively to gather detailed information through questioning. The planning skill feeds questions to the grill skill and processes answers to expand the plan graph.

**To Tickets Skill (TO_TICKETS)**: Provides methodology and templates for breaking down the completed plan into action-oriented, dependency-aware tickets. The planning skill adopts the tracer-bullet approach and ticket publication mechanisms.

Together, these three skills form a cohesive workflow: Grill → Plan → Tickets, enabling users to move from vague ideas to structured, actionable work items through guided questioning and decomposition.

## Advanced Features

### Incremental Planning Support

The skill supports resuming interrupted sessions by:
- Saving intermediate graph state to persistent storage
- Detecting partial progress on subsequent activation
- Allowing targeted expansion of specific branches rather than full re-plan

### Multi-Agent Coordination Plans

Special handling for scenarios involving multiple AI agents:
- Auto-detection of agent-related decision points
- Generation of inter-agent dependency tickets
- Scheduling coordination between parallel agent workflows

### Risk Assessment Integration

Optional risk tagging and assessment within the plan graph:
- Identification of high-risk or uncertain nodes
- Buffer allocation for uncertain areas
- Contingency ticket generation for risk mitigation

These advanced features can be enabled through configuration flags and are designed to scale the planning process from simple projects to complex multi-agent systems.
