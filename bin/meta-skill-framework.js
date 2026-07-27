#!/usr/bin/env node
/**
 * meta-skill-framework CLI
 *
 * JavaScript wrapper around the Python skill management scripts.
 * Provides npm-distributable CLI while keeping Python for core logic.
 *
 * Usage:
 *   npx meta-skill-framework list
 *   npx meta-skill-framework match "how does this work"
 *   npx meta-skill-framework load META_SKILL_FRAMEWORK
 *   npx meta-skill-framework auto "http post request"
 *   npx meta-skill-framework build
 *   npx meta-skill-framework assemble
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PACKAGE_ROOT = path.dirname(__dirname);
const SCRIPTS_DIR = path.join(PACKAGE_ROOT, 'scripts');

function findPython() {
  // Check for python3 first, then python
  const candidates = ['python3', 'python'];
  for (const cmd of candidates) {
    try {
      const result = spawnSync(cmd, ['--version'], { encoding: 'utf-8' });
      if (result.status === 0) {
        return cmd;
      }
    } catch (e) {
      // continue
    }
  }
  return null;
}

function ensurePyYaml(python) {
  // Check if pyyaml is installed
  const result = spawnSync(python, ['-c', 'import yaml'], { encoding: 'utf-8' });
  if (result.status !== 0) {
    console.error('Installing PyYAML dependency...');
    const installResult = spawnSync(python, ['-m', 'pip', 'install', 'pyyaml', '-q'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    if (installResult.status !== 0) {
      console.error('Failed to install PyYAML. Please run: pip install pyyaml');
      process.exit(1);
    }
  }
}

function runPython(script, args = [], options = {}) {
  const python = findPython();
  if (!python) {
    console.error('Python not found. Please install Python 3.x');
    process.exit(1);
  }

  // Ensure pyyaml is available for scripts that need it
  const needsYaml = ['build_index.py', 'assemble_prompt.py', 'skill_loader.py'].includes(script);
  if (needsYaml) {
    ensurePyYaml(python);
  }

  const scriptPath = path.join(SCRIPTS_DIR, script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    process.exit(1);
  }

  const result = spawnSync(python, [scriptPath, ...args], {
    encoding: 'utf-8',
    cwd: PACKAGE_ROOT,
    stdio: options.stdio || 'inherit'
  });

  if (result.status !== 0) {
    console.error(result.stderr || `Script ${script} failed`);
    process.exit(result.status || 1);
  }

  return result.stdout;
}

function printUsage() {
  console.log(`
meta-skill-framework - Self-referential skill management system

Usage:
  meta-skill-framework <command> [options]

Commands:
  list                    List all available skills
  build                   Rebuild skill index from skills/details/
  assemble                Build index + compress into system prompt
  match <query>           Match user input against trigger keywords
  load <skill...>         Load one or more skills by name
  auto <query>            Full auto mode: match + load top skills

Options:
  --json                  Output as JSON
  --max <n>               Max skills to load (default: 3)
  --with-frontmatter      Include YAML frontmatter in output
  --output <file>         Custom output file for assemble
  --stdout-only           Print assembled prompt to stdout only

Examples:
  meta-skill-framework list
  meta-skill-framework match "how does this system work"
  meta-skill-framework load META_SKILL_FRAMEWORK
  meta-skill-framework auto "http post request"
  meta-skill-framework build
  meta-skill-framework assemble --stdout-only
`);
}

function main() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    printUsage();
    process.exit(0);
  }

  switch (command) {
    case 'list':
      runPython('skill_loader.py', ['--list', ...args]);
      break;

    case 'build':
      runPython('build_index.py');
      break;

    case 'assemble':
      runPython('assemble_prompt.py', args);
      break;

    case 'match':
      if (!args.length) {
        console.error('Error: match requires a query argument');
        process.exit(1);
      }
      runPython('skill_loader.py', ['--match', args[0], ...args.slice(1)]);
      break;

    case 'load':
      if (!args.length) {
        console.error('Error: load requires skill name(s)');
        process.exit(1);
      }
      runPython('skill_loader.py', ['--load', ...args]);
      break;

    case 'auto':
      if (!args.length) {
        console.error('Error: auto requires a query argument');
        process.exit(1);
      }
      runPython('skill_loader.py', ['--auto', args[0], ...args.slice(1)]);
      break;

    case '--help':
    case '-h':
      printUsage();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "meta-skill-framework" for usage');
      process.exit(1);
  }
}

main();
