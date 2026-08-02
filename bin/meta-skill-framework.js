#!/usr/bin/env node
/**
 * meta-skill-framework CLI
 *
 * Node wrapper around the template's skill scripts (build_index.js,
 * skill_loader.js, assemble_prompt.js). Operates on the current working
 * directory as the workspace — the same contract the template's own
 * `npm run skill-*` commands provide, available from anywhere.
 *
 * Usage:
 *   meta-skill-framework list
 *   meta-skill-framework match "<query>"
 *   meta-skill-framework load NAME [NAME...]
 *   meta-skill-framework auto "<query>"
 *   meta-skill-framework build
 *   meta-skill-framework assemble
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PKG_ROOT = path.dirname(__dirname);
const SCRIPTS = path.join(PKG_ROOT, 'src', 'template', 'scripts');

function run(script, args = []) {
  const scriptPath = path.join(SCRIPTS, script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf-8',
    stdio: 'inherit',
  });
  process.exit(result.status === null ? 1 : result.status);
}

function main() {
  const [, , command, ...args] = process.argv;
  if (!command) {
    console.log(`
meta-skill-framework - skill management (runs the template's Node scripts in the current workspace)

Usage:
  meta-skill-framework <command> [options]

Commands:
  list                    List available skills
  build                   Rebuild skill index from skills/details/
  assemble                Build index + compress into system prompt
  match <query>           Match user input against trigger keywords
  load <skill...>         Load one or more skills by name
  auto <query>            Full auto mode: match + load top skills
`);
    process.exit(0);
  }

  // Operate on the workspace's skills/details if present, else fall back to
  // the template's shipped skill set (so the package is usable pre-scaffold).
  const dirArgs = ['--details-dir', fs.existsSync(path.join(process.cwd(), 'skills', 'details'))
    ? path.join(process.cwd(), 'skills', 'details')
    : path.join(PKG_ROOT, 'src', 'template', 'skills', 'details')];

  switch (command) {
    case 'list':
      run('skill_loader.js', ['--list', ...dirArgs]);
      break;
    case 'build':
      run('build_index.js', args);
      break;
    case 'assemble':
      run('assemble_prompt.js', args);
      break;
    case 'match':
      if (!args.length) {
        console.error('Error: match requires a query argument');
        process.exit(1);
      }
      run('skill_loader.js', ['--match', args[0], ...dirArgs]);
      break;
    case 'load':
      run('skill_loader.js', ['--load', ...args, ...dirArgs]);
      break;
    case 'auto':
      run('skill_loader.js', ['--auto', ...args, ...dirArgs]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "meta-skill-framework" for usage');
      process.exit(1);
  }
}

main();
