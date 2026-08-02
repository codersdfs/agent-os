#!/usr/bin/env node
/* build_index.js — build the skill index from YAML frontmatter in
   skills/details/*.md. Also auto-scans common skill directories:
   ~/.pi/agent/skills/ and ~/.agents/skills/ (following symlinks on Windows).
   Pass --include <path> to add additional directories.
   Frontmatter contracts:
     - Meta-skill: skill_name, summary, depends_on
     - Pi agent:   name, description (normalized to skill_name, summary) */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills', 'details');
const OUTPUT_DIR = path.join(ROOT, 'skills', 'generated');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'SKILL_INDEX.generated.md');

// Pi agent skills use name + description; normalize to meta-skill contract.
function normalizePiSkill(fm) {
  if (fm.skill_name) return fm;   // already in meta-skill format
  if (fm.name) {
    const name = fm.name.toUpperCase().replace(/-/g, '_');
    return {
      skill_name: name,
      library_type: 'internal',
      summary: (fm.description || '').slice(0, 80),
      depends_on: [],
      _source: 'external',
    };
  }
  return null;
}

function parseFrontmatter(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  if (!content.startsWith('---')) return { warn: 'no frontmatter' };
  const parts = content.split('---');
  if (parts.length < 3) return { warn: 'malformed frontmatter (missing closing ---)' };
  try {
    return yaml.load(parts[1]);
  } catch (e) {
    return { error: `YAML parse error: ${e.message}` };
  }
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// Scan a skill directory for SKILL.md files (one per skill, non-recursive).
// Follows symlinks to handle pip-installed skills.
function walkFlat(dir, out = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      let targetPath = fullPath;
      try { targetPath = fs.realpathSync(fullPath); } catch { continue; }
      if (fs.statSync(targetPath).isDirectory()) {
        const skillMd = path.join(fullPath, 'SKILL.md');
        if (fs.existsSync(skillMd)) out.push(skillMd);
      }
    }
  } catch (e) { /* dir not found / not a dir */ }
  return out;
}

function run() {
  const args = process.argv.slice(2);
  const includes = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--include' && args[i + 1]) includes.push(args[++i]);
  }

  // Auto-scan common skill directories if --include not provided
  if (includes.length === 0) {
    includes.push(path.join(process.env.HOME || process.env.USERPROFILE || '~', '.pi', 'agent', 'skills'));
    includes.push(path.join(process.env.HOME || process.env.USERPROFILE || '~', '.agents', 'skills'));
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const mdFiles = walk(SKILLS_DIR).sort();
  if (!mdFiles.length) console.log('No .md files found in skills/details/');

  const bullets = [];
  const allFiles = [...mdFiles, ...includes.flatMap(p => walkFlat(p))];

  for (const filepath of allFiles) {
    const fm = parseFrontmatter(filepath);

    // Warn on .md files that aren't skills (no frontmatter) — likely notes/readme.
    if (fm && fm.warn) {
      console.warn(`WARN: ${path.relative(ROOT, filepath)} — ${fm.warn}, skipping`);
      continue;
    }
    // Hard error on malformed YAML.
    if (fm && fm.error) {
      console.error(`ERROR: ${path.relative(ROOT, filepath)} — ${fm.error}`);
      process.exit(1);
    }
    if (!fm) continue;

    const normalized = normalizePiSkill(fm);
    if (!normalized) {
      console.warn(`WARN: ${path.relative(ROOT, filepath)} — no skill_name or name in frontmatter, skipping`);
      continue;
    }
    const skillName = normalized.skill_name;
    const libraryType = normalized.library_type || 'internal';
    const summary = normalized.summary || '';
    const dependsOn = normalized.depends_on || [];

    // Public skills must declare locked_version (only in internal dir, not external).
    if (libraryType === 'public' && !('locked_version' in normalized) && !normalized._source) {
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
