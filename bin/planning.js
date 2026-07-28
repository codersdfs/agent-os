#!/usr/bin/env node
/**
 * Planning Agent CLI - Interactive AI-driven planning tool
 * 
 * Usage: npx planning <command> [options]
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

// Resolve paths
const PACKAGE_ROOT = path.dirname(path.dirname(__filename));
const SRC_PATH = path.join(PACKAGE_ROOT, 'src');

// Check if planning agent exists
const planningAgentPath = path.join(SRC_PATH, 'planning-agent.js');
if (!fs.existsSync(planningAgentPath)) {
  console.error('Planning agent not found at:', planningAgentPath);
  process.exit(1);
}

// Import the PlanningAgent module
const { PlanningAgent } = require(planningAgentPath);

// Parse command line arguments
const args = process.argv.slice(2);
const action = args[0] || 'help';

// Create planning agent instance
const planner = new PlanningAgent();

// Handle different actions
async function handleAction() {
  switch (action) {
    case 'init':
      const projectName = args[1] || 'Untitled Project';
      planner.init({ project: projectName });
      planner._generateFinalOutputs();
      break;

    case 'run':
    case 'interactive':
      // Initialize with a default project first
      await planner.init({ project: 'AI Agent Development' });
      
      // Ask user if they want to continue
      const maxRounds = parseInt(args[1]) || 5;
      await planner.runInteractive(maxRounds);
      break;

    case 'help':
    case '-h':
    case '--help':
      printHelp();
      break;

    default:
      console.log(`Unknown command: ${action}`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
Planning Agent - Interactive AI-driven planning tool

Usage: npx planning <command> [options]

Commands:
  init <project-name>       Initialize planning session with project name
  run [max-rounds]          Run interactive planning session (default: 5 rounds)
  help, -h, --help          Show this help message

Examples:
  planning init "My Project"
  planning run 3
  planning help
`);
}

// Execute action
handleAction().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
