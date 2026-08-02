#!/usr/bin/env node
/* assemble_prompt.js — assemble a system prompt from the skill index.
   Node port of the audited assemble_prompt.py. Pipeline:
     1. Build the index (fresh, via build_index.run()).
     2. Read the base template (default or --template).
     3. Inject the index at {INSERT_GENERATED_INDEX_HERE}.
     4. Budget-check (fail-loud, never truncate).
     5. Write ASSEMBLED_SYSTEM_PROMPT.txt (or --stdout-only). */
const fs = require('fs');
const path = require('path');
const { check } = require('./compress_check');
const buildIndex = require('./build_index');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'skills', 'generated', 'SKILL_INDEX.generated.md');
const DEFAULT_OUTPUT = path.join(ROOT, 'ASSEMBLED_SYSTEM_PROMPT.txt');
const PLACEHOLDER = '{INSERT_GENERATED_INDEX_HERE}';
const DEFAULT_TEMPLATE = `[SKILL_INDEX]\n{INSERT_GENERATED_INDEX_HERE}\n`;

function readIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`Error: SKILL_INDEX not found at ${INDEX_PATH}. Run skill-build first.`);
    process.exit(1);
  }
  return fs.readFileSync(INDEX_PATH, 'utf8');
}

function readTemplate(p) {
  if (p && fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  if (p) console.warn(`Warning: template not found at ${p}, using default.`);
  return DEFAULT_TEMPLATE;
}

function injectIndex(template, indexText) {
  if (!template.includes(PLACEHOLDER)) {
    console.warn(`Warning: placeholder '${PLACEHOLDER}' not found in template.`);
    return template.replace('[SKILL_INDEX]\n', `[SKILL_INDEX]\n${indexText}\n`);
  }
  return template.replace(PLACEHOLDER, indexText.trimEnd());
}

function assemble(templatePath) {
  buildIndex.run();
  const base = readTemplate(templatePath);
  const withIndex = injectIndex(base, readIndex());
  return check(withIndex); // throws if over budget
}

function main() {
  const argv = process.argv.slice(2);
  let output = null, stdoutOnly = false, template = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--output' || argv[i] === '-o') output = argv[++i];
    else if (argv[i] === '--stdout-only') stdoutOnly = true;
    else if (argv[i] === '--template' || argv[i] === '-t') template = argv[++i];
    else { console.error(`Unknown argument: ${argv[i]}`); process.exit(1); }
  }

  let final;
  try { final = assemble(template); }
  catch (e) { console.error(`Error: ${e.message}`); process.exit(1); }

  if (stdoutOnly) { console.log(final); return; }

  const outPath = output || DEFAULT_OUTPUT;
  fs.writeFileSync(outPath, final.trimEnd() + '\n');
  console.error(`Assembled system prompt written to: ${outPath}`);
  console.error(`Final prompt: ${final.length} chars (~${Math.round(final.length / 4)} tokens)`);
}

if (require.main === module) main();
module.exports = { assemble };
