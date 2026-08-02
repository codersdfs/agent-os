#!/usr/bin/env node
/* skill_loader.js — runtime skill activation. Node port of the audited
   skill_loader.py, with the dependency-case bug fixed (all dep lookups
   normalized to UPPERCASE in every branch).

   Usage:
     node scripts/skill_loader.js --list
     node scripts/skill_loader.js --match "<query>"
     node scripts/skill_loader.js --match "<query>" --load-matched [--max N]
     node scripts/skill_loader.js --load NAME [NAME...]
     node scripts/skill_loader.js --auto "<query>"
   All accept --json and --with-frontmatter. */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_DETAILS_DIR = path.join(ROOT, 'skills', 'details');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function parseFrontmatterAndBody(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  if (!content.startsWith('---')) return null;
  const parts = content.split('---');
  if (parts.length < 3) return null;
  let fm;
  try { fm = yaml.load(parts[1]); } catch { return null; }
  return { frontmatter: fm, body: parts.slice(2).join('---').trim(), fullText: content };
}

function loadAllSkills(detailsDir = DEFAULT_DETAILS_DIR) {
  if (!fs.existsSync(detailsDir)) {
    console.error(`Error: details directory not found: ${detailsDir}`);
    return {};
  }
  const skills = {};
  for (const f of walk(detailsDir).sort()) {
    const parsed = parseFrontmatterAndBody(f);
    if (!parsed) continue;
    const name = parsed.frontmatter.skill_name;
    if (!name) continue;
    skills[name] = { filepath: f, ...parsed };
  }
  return skills;
}

function buildTriggerIndex(skills) {
  const map = {};
  for (const [name, info] of Object.entries(skills)) {
    for (const kw of info.frontmatter.trigger_keywords || []) {
      const key = kw.toLowerCase().trim();
      (map[key] ||= []).push(name);
    }
  }
  return map;
}

function matchInput(input, skills) {
  const triggerMap = buildTriggerIndex(skills);
  if (!Object.keys(triggerMap).length) return [];
  const inputLower = input.toLowerCase();
  const inputWords = new Set(inputLower.split(/\s+/));
  const scores = {};

  for (const [trigger, names] of Object.entries(triggerMap)) {
    if (trigger.includes(' ') && inputLower.includes(trigger)) {
      // Exact multi-word phrase match: +10.
      for (const sn of names) scores[sn] = (scores[sn] || 0) + 10;
      continue;
    }
    for (const tw of trigger.split(/\s+/)) {
      if (inputWords.has(tw)) {
        for (const sn of names) scores[sn] = (scores[sn] || 0) + 3;
      } else if (tw.length > 2 && inputLower.includes(tw)) {
        for (const sn of names) scores[sn] = (scores[sn] || 0) + 1;
      }
    }
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1]);
}

/* Dependency ordering — case-insensitive in every branch (the audited fix):
   skills are keyed by UPPERCASE name, and every lookup normalizes the same way. */
function resolveDependencyOrder(names, skills) {
  const byKey = new Map(Object.entries(skills).map(([k, v]) => [k.toUpperCase().trim(), v]));
  const ordered = [];
  const visited = new Set();
  const inProgress = new Set();

  function visit(name) {
    const key = name.toUpperCase().trim();
    if (visited.has(key)) return;
    if (inProgress.has(key)) throw new Error(`Circular dependency detected involving '${name}'`);
    if (!byKey.has(key)) return;
    inProgress.add(key);
    for (const dep of byKey.get(key).frontmatter.depends_on || []) visit(dep);
    inProgress.delete(key);
    visited.add(key);
    ordered.push(byKey.get(key).frontmatter.skill_name || key);
  }

  for (const n of names) visit(n);
  return ordered;
}

function formatSkill(info, withFrontmatter) {
  return withFrontmatter ? info.fullText : info.body;
}

function listEntry(name, info) {
  const fm = info.frontmatter;
  const tag = fm.library_type === 'public' ? '[PUBLIC_LIB]' : '[INTERNAL]';
  return { name, tag, summary: fm.summary || 'No summary', dependsOn: fm.depends_on || [] };
}

function main() {
  const argv = process.argv.slice(2);
  const args = {
    list: false, match: null, load: [], loadMatched: false, max: 3,
    detailsDir: DEFAULT_DETAILS_DIR, json: false, withFrontmatter: false, auto: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') args.list = true;
    else if (a === '--match') args.match = argv[++i];
    else if (a === '--load-matched') args.loadMatched = true;
    else if (a === '--max') args.max = parseInt(argv[++i], 10) || 3;
    else if (a === '--details-dir') args.detailsDir = argv[++i];
    else if (a === '--json') args.json = true;
    else if (a === '--with-frontmatter') args.withFrontmatter = true;
    else if (a === '--auto') args.auto = argv[++i];
    else if (a === '--load') { while (argv[i + 1] && !argv[i + 1].startsWith('--')) args.load.push(argv[++i]); }
    else { console.error(`Unknown argument: ${a}`); process.exit(1); }
  }

  const skills = loadAllSkills(args.detailsDir);
  const out = (o) => console.log(args.json ? JSON.stringify(o, null, 2) : o);

  if (args.list || (!args.match && !args.auto && !args.load.length)) {
    if (args.json) {
      const o = {};
      for (const [n, i] of Object.entries(skills)) {
        const l = listEntry(n, i);
        o[n] = { summary: l.summary, library_type: l.tag, depends_on: l.dependsOn, triggers: i.frontmatter.trigger_keywords || [] };
      }
      out(o);
    } else {
      console.log('Available skills:');
      for (const [n, i] of Object.entries(skills)) console.log(`  ${n} — ${i.frontmatter.summary || ''}`);
    }
    return;
  }

  if (args.auto) {
    const ranked = matchInput(args.auto, skills).slice(0, args.max);
    const ordered = resolveDependencyOrder(ranked.map(([n]) => n), skills);
    const result = {
      matched: ranked.map(([n, s]) => ({ skill: n, score: s })),
      loaded: ordered.map((n) => ({
        skill_name: n,
        summary: skills[n].frontmatter.summary || '',
        library_type: skills[n].frontmatter.library_type || 'unknown',
        body: formatSkill(skills[n], args.withFrontmatter),
        depends_on: skills[n].frontmatter.depends_on || [],
      })),
    };
    // --auto always emits JSON (agents parse it), matching the python original.
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (args.match) {
    const ranked = matchInput(args.match, skills);
    if (args.json) {
      out(ranked.map(([n, s]) => ({ skill: n, score: s })));
    } else if (!ranked.length) {
      console.log('No matching skills found.');
    } else {
      console.log(`Matched skills for "${args.match}":`);
      for (const [n, s] of ranked) console.log(`  [${String(s).padStart(2)}] ${n} — ${skills[n].frontmatter.summary || ''}`);
    }

    if (args.loadMatched) {
      const top = ranked.slice(0, args.max).map(([n]) => n);
      const ordered = resolveDependencyOrder(top, skills);
      if (args.json) {
        const o = {};
        for (const n of ordered) {
          o[n] = formatSkill(skills[n], args.withFrontmatter);
          const deps = skills[n].frontmatter.depends_on || [];
          if (deps.length) {
            const depTexts = {};
            for (const d of deps) {
              const k = d.toUpperCase().trim();
              if (skills[k]) depTexts[k] = skills[k].body;
            }
            o[`${n}___dependency_details`] = depTexts;
          }
        }
        out(o);
      } else {
        console.log(`\n--- Loading ${ordered.length} skill(s) in dependency order ---\n`);
        for (const n of ordered) { console.log(`=== ${n} ===`); console.log(formatSkill(skills[n], args.withFrontmatter)); console.log(); }
      }
    }
    return;
  }

  if (args.load.length) {
    const ordered = resolveDependencyOrder(args.load, skills);
    if (args.json) {
      const o = {};
      for (const n of ordered) o[n] = formatSkill(skills[n], args.withFrontmatter);
      out(o);
    } else {
      for (const n of ordered) { console.log(`=== ${n} ===`); console.log(formatSkill(skills[n], args.withFrontmatter)); console.log(); }
    }
  }
}

if (require.main === module) main();
module.exports = { loadAllSkills, matchInput, resolveDependencyOrder };
