#!/usr/bin/env node
/* wiki_query.js — search the wiki by keyword or tag.
   Usage:
     node scripts/wiki_query.js <keyword>          # fuzzy match on tags/body/summary
     node scripts/wiki_query.js --tag <tag>        # exact frontmatter tag match
     node scripts/wiki_query.js --json             # emit JSON instead of markdown
     node scripts/wiki_query.js --limit N          # cap results (default 10)
   Exit 0 = matched; exit 1 = no results. */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const scriptPath = require.main && require.main.filename
  ? require.main.filename
  : (process.argv[1] || __filename);
const ROOT = path.resolve(path.dirname(scriptPath), '..');
const WIKI_DIR = path.join(ROOT, 'wiki');

function die(msg) { console.error(`Error: ${msg}`); process.exit(1); }

function parsePage(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { filepath, slug: path.basename(filepath, '.md'), body: content, fm: {} };
  return { filepath, slug: path.basename(filepath, '.md'), fm: yaml.load(m[1]) || {}, body: content.slice(m[0].length) };
}

function main() {
  if (!fs.existsSync(WIKI_DIR)) die(`wiki/ directory not found at ${WIKI_DIR}`);
  const args = process.argv.slice(2);
  let mode = 'keyword'; // 'keyword' | 'tag'
  let term = null;
  let asJson = false;
  let limit = 10;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tag') term = args[++i];
    else if (args[i] === '--json') asJson = true;
    else if (args[i] === '--limit') limit = parseInt(args[++i], 10) || 10;
    else if (!term && mode === 'keyword') term = args[i];
  }
  if (!term) die('Usage: wiki_query.js <keyword> | --tag <tag>');

  // Collect all wiki pages except index/log
  const files = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith('.md') && !['index.md', 'log.md'].includes(f));
  const pages = files.map(f => parsePage(path.join(WIKI_DIR, f)));

  // Search
  const matches = [];
  for (const p of pages) {
    const score = [];
    if (mode === 'tag') {
      const tags = Array.isArray(p.fm.tags) ? p.fm.tags : [];
      if (tags.includes(term)) score.push(100);
    } else {
      const needle = term.toLowerCase();
      const tags = (Array.isArray(p.fm.tags) ? p.fm.tags.join(' ') : '').toLowerCase();
      const summary = (Array.isArray(p.fm.summary) ? p.fm.summary[0] : (p.fm.summary || '')).toLowerCase();
      const body = p.body.toLowerCase();
      if (tags.includes(needle)) score.push(50);
      if (summary.includes(needle)) score.push(30);
      // Body count (cap at 20 to avoid huge scores)
      let hits = 0;
      for (let j = 0; j <= body.length - needle.length; j++) {
        if (body.slice(j, j + needle.length) === needle) hits++;
        if (hits >= 20) break;
      }
      if (hits > 0) score.push(Math.min(hits * 2, 20));
    }
    if (score.length) matches.push({ page: p, score: Math.max(...score) });
  }

  matches.sort((a, b) => b.score - a.score);
  const out = matches.slice(0, limit).map(m => ({
    slug: m.page.slug,
    summary: (Array.isArray(m.page.fm.summary) ? m.page.fm.summary[0] : (m.page.fm.summary || '(no summary)')),
    tags: m.page.fm.tags || [],
    score: m.score,
  }));

  if (out.length === 0) {
    console.error(`No wiki pages matched "${term}"`);
    process.exit(1);
  }
  if (asJson) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    console.log(`# Wiki results for "${term}" (${out.length} page(s))\n`);
    for (const r of out) {
      console.log(`## [[${r.slug}]]  [score:${r.score}]`);
      console.log(`**Summary:** ${r.summary}\n**Tags:** ${r.tags.join(', ')}\n`);
    }
  }
}

main();
