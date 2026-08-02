#!/usr/bin/env node
/* create-agent-os — scaffold an agent OS workspace.
   One repo: skill-powered AI workflows + an LLM Wiki template. Pure Node. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const args = process.argv.slice(2);
let target = null, noGit = false, noInstall = false, yes = false;
for (const a of args) {
  if (a === '--no-git') noGit = true;
  else if (a === '--no-install') noInstall = true;
  else if (a === '--yes' || a === '-y') yes = true;
  else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
  else if (!target) target = a;
  else { console.error(`unexpected argument: ${a}`); usage(); process.exit(1); }
}

function usage() {
  console.log(`create-agent-os — scaffold an agent OS workspace
(template: skill-powered AI workflows + LLM Wiki, in one repo; pure Node, no python)

Usage: npm create agent-os@latest [dir] [options]

Options:
  -y, --yes        skip prompts (use defaults)
  --no-git         don't git init the workspace
  --no-install     don't run npm install in the workspace
  -h, --help       show this help

Examples:
  npm create agent-os@latest my-brain
  npm create agent-os@latest .`);
}

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
}

(async () => {
  const dir = target || (await ask('Workspace directory name: ')) || 'agent-os';
  const dest = path.resolve(dir);
  const name = path.basename(dest).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'agent-os';

  if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
    if (!yes) {
      const a = await ask(`${dest} is not empty. Continue and merge template files? [y/N] `);
      if (a.toLowerCase() !== 'y') { console.log('Aborted.'); process.exit(1); }
    }
  }

  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(__dirname, 'src', 'template'), dest, { recursive: true });

  // raw/ is where sources land — create it explicitly
  fs.mkdirSync(path.join(dest, 'raw'), { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  for (const f of ['package.json', 'AGENTS.md', 'wiki/index.md', 'wiki/log.md']) {
    const p = path.join(dest, f);
    if (fs.existsSync(p)) {
      let s = fs.readFileSync(p, 'utf8').split('{{name}}').join(name);
      s = s.split('{{today}}').join(today);
      fs.writeFileSync(p, s);
    }
  }

  if (!noInstall) {
    try {
      console.log('\nInstalling dependencies (js-yaml)...');
      execSync('npm install --no-audit --no-fund', { cwd: dest, stdio: 'inherit' });
    } catch {
      console.log('⚠ npm install failed — run it later in the workspace.');
    }
  }

  if (!noGit) {
    try {
      execSync('git init -b main && git add -A && git commit -m "init: agent OS workspace"', { cwd: dest, stdio: 'inherit' });
    } catch {
      console.log('⚠ git step failed (commonly: no git identity). Set git config user.name/user.email, or rerun with --no-git.');
    }
  }

  console.log(`\n✓ Agent OS workspace created in ${dest}
Open it in Obsidian ("Open folder as vault") and in any AI agent session.

  Skills (workflows):
    npm run skill-list                  # available skills
    npm run skill-auto -- "grill me"    # trigger-match + load skills
    npm run skill-build                 # rebuild the skill index after editing skills/details/
    npm run skill-assemble              # budget-checked system prompt

  Wiki (knowledge):
    drop a source into raw/, then say:  ingest raw/<file>
    ask questions;  run:  lint
`);
})().catch((e) => { console.error(e.message); process.exit(1); });
