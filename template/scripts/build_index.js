#!/usr/bin/env node
/* build_index.js — build the skill index from YAML frontmatter in
   skills/details/*.md. Node port of the audited build_index.py. */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills', 'details');
const OUTPUT_DIR = path.join(ROOT, 'skills', 'generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'SKILL_INDEX.generated.md');

function parseFrontmatter(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  if (!content.startsWith('---')) return null;
  const parts = content.split('---');
  if (parts.length < 3) return null;
  try { return yaml.load(parts[1]); } catch { return null; }
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const mdFiles = walk(SKILLS_DIR).sort();
  if (!mdFiles.length) { console.log('No .md files found in skills/details/'); return; }

  const bullets = [];
  for (const filepath of mdFiles) {
    const fm = parseFrontmatter(filepath);
    if (!fm) continue;
    const skillName = fm.skill_name || 'UNKNOWN';
    const libraryType = fm.library_type || 'unknown';
    const summary = fm.summary || '';
    const dependsOn = fm.depends_on || [];

    // Hard rule: public skills must declare locked_version.
    if (libraryType === 'public' && !('locked_version' in fm)) {
      console.error(`ERROR: missing locked_version for ${skillName}`);
      process.exit(1);
    }

    const tag = libraryType === 'public' ? '[PUBLIC_LIB]' : '[INTERNAL]';
    const deps = dependsOn.length ? dependsOn.join(', ') : 'None';
    bullets.push(`- ${tag} ${skillName} | ${summary} | Depends: ${deps}`);
  }

  fs.writeFileSync(OUTPUT_FILE, bullets.join('\n') + '\n');
  return bullets;
}

if (require.main === module) run();
module.exports = { run };
