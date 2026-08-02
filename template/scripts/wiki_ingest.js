#!/usr/bin/env node
/* wiki_ingest.js — ingest one or more raw sources into the wiki.
   Usage:
     node scripts/wiki_ingest.js <path-or-glob ...>
     cat raw/doc.md | node scripts/wiki_ingest.js --stdin "doc title"
   Writes source/entity/concept pages to wiki/, updates index.md,
   appends a log entry to wiki/log.md. Prints nothing on success;
   exit 0 = good, 1 = failure. */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const scriptPath = require.main && require.main.filename
  ? require.main.filename
  : (process.argv[1] || __filename);
const ROOT = path.resolve(path.dirname(scriptPath), '..');
const RAW_DIR = path.join(ROOT, 'raw');
const WIKI_DIR = path.join(ROOT, 'wiki');
const INDEX_PATH = path.join(WIKI_DIR, 'index.md');
const LOG_PATH = path.join(WIKI_DIR, 'log.md');

function die(msg) { console.error('Error: ' + msg); process.exit(1); }
function today() { return new Date().toISOString().slice(0, 10); }

function readInput(args) {
  const isStdin = args.length === 2 && args[0] === '--stdin';
  if (isStdin) {
    const buffer = fs.readFileSync(0, 'utf8');
    if (!buffer.trim()) die('stdin is empty — pass --stdin with content');
    return [{ content: buffer, name: args[1] || 'unnamed-source', sourceFile: null }];
  }
  const entries = [];
  for (const arg of args) {
    if (arg.startsWith('--')) continue;
    const prefixMatch = arg.match(/^raw[\\/]/i);
    const rel = prefixMatch ? arg.slice(prefixMatch[0].length) : arg;
    const resolved = path.resolve(RAW_DIR, rel);
    if (!fs.existsSync(resolved)) die('raw source not found: ' + resolved);
    if (!fs.statSync(resolved).isFile()) die('not a file: ' + resolved);
    const content = fs.readFileSync(resolved, 'utf8');
    const name = path.basename(resolved, path.extname(resolved));
    entries.push({ content, name, sourceFile: resolved });
  }
  return entries;
}

function slugify(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase() || 'UNTITLED';
}

function stripFrontmatter(body) {
  const m = body.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { fm: {}, body };
  try { return { fm: yaml.load(m[1]) || {}, body: body.slice(m[0].length) }; }
  catch (e) { return { fm: {}, body }; }
}

function pageType(fm) {
  const tags = Array.isArray(fm.tags) ? fm.tags : [];
  if (tags.includes('source')) return 'source';
  if (tags.includes('concept')) return 'concept';
  if (tags.includes('entity')) return 'entity';
  const s = (fm.summary || '').length;
  if (s > 200) return 'concept';
  if (/\bof\b\s+\w/.test(fm.summary || '')) return 'source';
  return 'entity';
}

function writePage(filepath, fm, body) {
  const lines = ['---', 'tags:'];
  (fm.tags || []).forEach(function(t) { lines.push('  - ' + t); });
  lines.push('date:', '  - "' + (fm.date || today()) + '"');
  lines.push('sources:');
  (fm.sources || []).forEach(function(s) { lines.push('  - "' + s + '"'); });
  lines.push('status:', '  - "' + (fm.status || 'seed') + '"');
  if (fm.summary) lines.push('summary:', '  - "' + fm.summary + '"');
  lines.push('---');
  fs.writeFileSync(filepath, lines.join('\n') + '\n\n' + body, 'utf8');
}

function appendLog(action, title, extra) {
  extra = extra || '';
  let entry = '\n## [' + today() + '] ' + action + ' | ' + title + '\n';
  if (extra) entry += '- ' + extra + '\n';
  let log = '';
  try { log = fs.readFileSync(LOG_PATH, 'utf8'); } catch (e) { /* new */ }
  fs.writeFileSync(LOG_PATH, log + entry);
}

function updateIndex(written) {
  let idx = '';
  try { idx = fs.readFileSync(INDEX_PATH, 'utf8'); } catch (e) {
    idx = '---\ntags: [wiki-index]\n---\n# Wiki index\n\n';
  }
  const sections = { source: '## Sources', entity: '## Entities', concept: '## Concepts' };
  for (const w of written) {
    if (!idx.includes(sections[w.type])) {
      idx += '\n' + sections[w.type] + '\n\n';
    }
  }
  for (const w of written) {
    const section = sections[w.type] || '## Others';
    const line = '- [[' + w.slug + ']] — ' + (Array.isArray(w.fm.summary) ? (w.fm.summary[0] || '(no summary)') : (w.fm.summary || '(no summary)'));
    const parts = idx.split('\n');
    let inserted = false;
    const newLines = [];
    for (let i = 0; i < parts.length; i++) {
      newLines.push(parts[i]);
      if (!inserted && parts[i].trim() === section) {
        newLines.push(line);
        inserted = true;
      }
    }
    if (!inserted) {
      idx += '\n' + section + '\n' + line + '\n';
    } else {
      idx = newLines.join('\n');
    }
  }
  fs.writeFileSync(INDEX_PATH, idx);
}

function main() {
  if (!fs.existsSync(RAW_DIR)) die('raw/ directory not found at ' + RAW_DIR + ' — did you run create-agent-os?');
  if (!fs.existsSync(WIKI_DIR)) die('wiki/ directory not found at ' + WIKI_DIR);

  const inputs = readInput(process.argv.slice(2));
  const written = [];
  for (const { content, name, sourceFile } of inputs) {
    const { fm: originalFm, body } = stripFrontmatter(content);
    const slug = slugify(name);
    const summary = (originalFm.summary || (Array.isArray(originalFm.summary) ? originalFm.summary[0] : '') || body.split(/\n/).filter(function(l) { return l.trim() && !l.startsWith('#') && !l.startsWith('[['); })[0] || name).slice(0, 80);
    const type = pageType({ ...originalFm, summary: summary });
    const fm = {
      tags: ['wiki-page', 'source', ...(originalFm.tags || [])],
      date: today(),
      sources: sourceFile ? [path.relative(ROOT, sourceFile).replace(/\\/g, '/')] : [],
      status: originalFm.status || 'seed',
      summary: summary,
    };
    const bodyClean = body.split('\n').slice(0, 50).join('\n') +
      (body.split('\n').length > 50 ? '\n\n<!-- truncated -->' : '');
    const filepath = path.join(WIKI_DIR, slug + '.md');
    writePage(filepath, fm, bodyClean);
    written.push({ slug, type, fm });
    appendLog('ingest', slug, sourceFile ? 'from ' + path.basename(sourceFile) : 'via stdin');
  }
  updateIndex(written);
  console.error('Ingested ' + written.length + ' source(s) → wiki/');
}

main();
