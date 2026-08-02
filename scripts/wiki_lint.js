#!/usr/bin/env node
/* wiki_lint.js — audit the wiki for orphans, stale links, missing frontmatter.
   Usage:
     node scripts/wiki_lint.js            # report, exit 1 if issues found
     node scripts/wiki_lint.js --fix      # auto-fix (adds missing tags)
   Exit 0 = clean; exit 1 = issues found. */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const scriptPath = require.main && require.main.filename
  ? require.main.filename
  : (process.argv[1] || __filename);
const ROOT = path.resolve(path.dirname(scriptPath), '..');
const WIKI_DIR = path.join(ROOT, 'wiki');
const INDEX_PATH = path.join(WIKI_DIR, 'index.md');

function die(msg) { console.error('Error: ' + msg); process.exit(1); }
function ok(msg) { console.log('OK: ' + msg); }

function parsePage(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { filepath: filepath, slug: path.basename(filepath, '.md'), fm: null, body: content };
  try {
    const fm = yaml.load(m[1]) || {};
    return { filepath: filepath, slug: path.basename(filepath, '.md'), fm: fm, body: content.slice(m[0].length) };
  } catch (e) {
    return { filepath: filepath, slug: path.basename(filepath, '.md'), fm: null, body: content, parseError: e.message };
  }
}

function extractLinks(text) {
  if (!text) return [];
  const m = text.match(/\[\[([^\]]+)\]\]/g) || [];
  return m.map(function(s) { return s.slice(2, -2); });
}

function main() {
  if (!fs.existsSync(WIKI_DIR)) die('wiki/ directory not found at ' + WIKI_DIR);
  const fix = process.argv.includes('--fix');
  const files = fs.readdirSync(WIKI_DIR).filter(function(f) {
    return f.endsWith('.md') && f !== 'index.md' && f !== 'log.md';
  });
  if (!files.length) { ok('no content pages'); return; }
  const pages = files.map(function(f) { return parsePage(path.join(WIKI_DIR, f)); });
  const issues = [];

  // Frontmatter checks
  for (const p of pages) {
    if (!p.fm || p.parseError) {
      issues.push({ page: p.slug, kind: p.parseError || 'missing-frontmatter', severity: 'high' });
      continue;
    }
    const tags = Array.isArray(p.fm.tags) ? p.fm.tags.flat() : (typeof p.fm.tags === 'string' ? [p.fm.tags] : []);
    if (!tags.length) issues.push({ page: p.slug, kind: 'no-tags', severity: 'medium' });
    if (!p.fm.date) issues.push({ page: p.slug, kind: 'no-date', severity: 'low' });
    if (!p.fm.status) issues.push({ page: p.slug, kind: 'no-status', severity: 'low' });
  }

  // Orphan pages (not linked from index.md)
  let indexBody = '';
  try { indexBody = fs.readFileSync(INDEX_PATH, 'utf8'); } catch (e) { /* no index */ }
  const linkedSlugs = new Set(extractLinks(indexBody));
  for (const p of pages) {
    if (!linkedSlugs.has(p.slug)) issues.push({ page: p.slug, kind: 'orphan', severity: 'medium' });
  }

  // Broken wikilinks inside pages
  for (const p of pages) {
    if (!p.fm) continue;
    const links = extractLinks(p.body);
    for (const link of links) {
      if (p.slug === link) continue;  // self-link
      if (!files.includes(link + '.md') && !['index', 'log'].includes(link)) {
        issues.push({ page: p.slug, kind: 'broken-link', detail: link, severity: 'high' });
      }
    }
  }

  if (!issues.length) { ok('wiki clean'); return; }

  const bySeverity = { high: [], medium: [], low: [] };
  for (const i of issues) (bySeverity[i.severity] || bySeverity.low).push(i);

  process.stdout.write('\n');
  for (const sev of ['high', 'medium', 'low']) {
    if (!bySeverity[sev].length) continue;
    console.log(sev.toUpperCase() + ' issues:');
    for (const i of bySeverity[sev]) {
      const d = i.detail ? ' (' + i.detail + ')' : '';
      console.log('  - [' + i.page + '] ' + i.kind + d);
      if (fix && i.kind === 'no-tags' && i.severity === 'medium') {
        const filepath = path.join(WIKI_DIR, i.page + '.md');
        const p = pages.find(function(x) { return x.slug === i.page; });
        if (p && p.fm) {
          p.fm.tags = [...new Set([...(Array.isArray(p.fm.tags) ? p.fm.tags.flat() : []), 'wiki-page'])];
          const lines = ['---', 'tags:'];
          p.fm.tags.forEach(function(t) { lines.push('  - ' + t); });
          lines.push('date:', '  - "' + (p.fm.date || new Date().toISOString().slice(0, 10)) + '"');
          lines.push('status:', '  - "' + (p.fm.status || 'seed') + '"');
          if (p.fm.summary) lines.push('summary:', '  - "' + p.fm.summary + '"');
          lines.push('---');
          fs.writeFileSync(filepath, lines.join('\n') + '\n\n' + p.body);
          ok('added tag to ' + i.page);
        }
      }
    }
  }
  process.stdout.write('\n');

  process.exitCode = issues.some(function(i) { return i.severity === 'high'; }) ? 1 : 0;
}

main();
