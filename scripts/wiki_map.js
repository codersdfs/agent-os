#!/usr/bin/env node
/* wiki_map.js — serve the wiki as a browsable HTML map on localhost.
   Usage:
     node scripts/wiki_map.js [port]
   Opens a minimal HTTP server at http://localhost:<port> serving:
   - /       → wiki index (catalog of all pages)
   - /wiki/:slug → rendered wiki page with backlinks
   - /api/   → JSON summary of all pages + link graph
   Exit 0 on serve, 1 on failure. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const scriptPath = require.main && require.main.filename
  ? require.main.filename
  : (process.argv[1] || __filename);
const ROOT = path.resolve(path.dirname(scriptPath), '..');
const WIKI_DIR = path.join(ROOT, 'wiki');

function die(msg) { console.error('Error: ' + msg); process.exit(1); }
function json(res, data, code) {
  res.writeHead(200 || code || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}
function html(res, body, code) {
  res.writeHead(code || 200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(body);
}
function readPage(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const content = fs.readFileSync(filepath, 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { slug: path.basename(filepath, '.md'), fm: null, body: content };
  try {
    const fm = yaml.load(m[1]) || {};
    return { slug: path.basename(filepath, '.md'), fm: fm, body: content.slice(m[0].length) };
  } catch (e) { return { slug: path.basename(filepath, '.md'), fm: null, body: content }; }
}
function extractLinks(text) {
  if (!text) return [];
  return (text.match(/\[\[([^\]]+)\]\]/g) || []).map(function(s) { return s.slice(2, -2); });
}
function renderPage(pg, allPages) {
  if (!pg) return '<h2>404 — page not found</h2>';
  const tags = pg.fm && Array.isArray(pg.fm.tags) ? pg.fm.tags.flat() : [];
  const links = extractLinks(pg.body);
  const backlinks = allPages.filter(function(p) {
    if (!p.body || p.slug === pg.slug) return false;
    return extractLinks(p.body).includes(pg.slug);
  }).map(function(p) { return p.slug; });
  const tagsHtml = tags.map(function(t) { return '<span class="tag">' + t + '</span>'; }).join(' ');
  const linksHtml = links.map(function(l) {
    const exists = allPages.some(function(p) { return p.slug === l; });
    return '<a href="/wiki/' + l + '" class="' + (exists ? 'link' : 'broken-link') + '">' + l + '</a>';
  }).join(' ');
  const bodyHtml = pg.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[\[([^\]]+)\]\]/g, '<a href="/wiki/$1" class="link">[$1]</a>')
    .replace(/\n/g, '<br>');
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + pg.slug + ' — Wiki Map</title>'
    + '<style>'
    + 'body{font-family:monospace;background:#1a1a1a;color:#ddd;padding:20px}'
    + 'h1{color:#4fc3f7;border-bottom:1px solid #333;padding-bottom:10px}'
    + '.meta{color:#888;font-size:0.9em;margin-bottom:20px}'
    + '.tag{background:#333;padding:2px 6px;border-radius:3px;margin-right:4px;font-size:0.8em}'
    + '.link{color:#4fc3f7;text-decoration:none}'
    + '.broken-link{color:#f44336;text-decoration:line-through}'
    + '.backlinks{margin-top:30px;padding-top:15px;border-top:1px solid #333}'
    + '.body{white-space:pre-wrap;line-height:1.6}'
    + '</style></head><body>'
    + '<a href="/">← Wiki Index</a>'
    + '<h1>' + pg.slug + '</h1>'
    + '<div class="meta">' + tagsHtml + (pg.fm && pg.fm.date ? ' · ' + pg.fm.date : '') + '</div>'
    + '<div class="body">' + bodyHtml + '</div>'
    + (linksHtml ? '<div style="margin-top:20px">Links: ' + linksHtml + '</div>' : '')
    + (backlinks.length ? '<div class="backlinks">Backlinks from: '
      + backlinks.map(function(b) { return '<a href="/wiki/' + b + '" class="link">' + b + '</a>'; }).join(', ')
      + '</div>' : '')
    + '</body></html>';
}

function buildGraph(allPages) {
  const nodes = allPages.map(function(p) { return { id: p.slug, tags: p.fm && p.fm.tags || [], status: p.fm && p.fm.status || 'unknown' }; });
  const links = [];
  for (const pg of allPages) {
    const pageLinks = extractLinks(pg.body);
    for (const l of pageLinks) {
      if (l !== pg.slug) links.push({ from: pg.slug, to: l });
    }
  }
  return { nodes: nodes, links: links };
}

function renderIndex(allPages) {
  const byType = { source: [], entity: [], concept: [], other: [] };
  for (const pg of allPages) {
    const tags = pg.fm && Array.isArray(pg.fm.tags) ? pg.fm.tags.flat() : [];
    let type = 'other';
    if (tags.includes('source')) type = 'source';
    else if (tags.includes('concept')) type = 'concept';
    else if (tags.includes('entity')) type = 'entity';
    byType[type].push(pg);
  }
  const sections = ['entity', 'concept', 'source'];
  const summary = allPages.map(function(p) {
    const s = p.fm && p.fm.summary;
    return Array.isArray(s) ? (s[0] || '(no summary)') : (s || '(no summary)');
  });
  const sectionsHtml = sections.map(function(t) {
    const pages = byType[t];
    if (!pages.length) return '';
    const lines = pages.map(function(p) {
      const tags = p.fm && Array.isArray(p.fm.tags) ? p.fm.tags.flat() : [];
      const s = p.fm && p.fm.summary;
      const summary = Array.isArray(s) ? (s[0] || '(no summary)') : (s || '(no summary)');
      return '<tr><td><a href="/wiki/' + p.slug + '" class="link">' + p.slug + '</a></td><td>'
        + tags.map(function(tag) { return '<span class="tag">' + tag + '</span>'; }).join(' ')
        + '</td><td style="color:#aaa">' + summary + '</td></tr>';
    }).join('\n');
    return '<h3>' + t.charAt(0).toUpperCase() + t.slice(1) + 's (' + pages.length + ')</h3>'
      + '<table><tr><th>Page</th><th>Tags</th><th>Summary</th></tr>' + lines + '</table>';
  }).join('\n');
  return '<!doctype html><html><head><meta charset="utf-8"><title>Wiki Map</title>'
    + '<style>'
    + 'body{font-family:monospace;background:#1a1a1a;color:#ddd;padding:20px}'
    + 'h1{color:#4fc3f7}'
    + 'table{border-collapse:collapse;width:100%;margin-bottom:30px}'
    + 'th,td{text-align:left;padding:8px;border-bottom:1px solid #333}'
    + 'th{color:#888}'
    + '.tag{background:#333;padding:2px 6px;border-radius:3px;margin-right:4px;font-size:0.8em}'
    + '.link{color:#4fc3f7;text-decoration:none}'
    + '.stats{margin-bottom:20px;color:#888}'
    + '</style></head><body>'
    + '<h1>Wiki Map</h1>'
    + '<div class="stats">' + allPages.length + ' page(s) · '
    + allPages.length + ' unique tags · '
    + allPages.reduce(function(acc, p) { return acc + (p.body ? extractLinks(p.body).length : 0); }, 0) + ' links</div>'
    + '<h2><a href="/api/" class="link">JSON API</a></h2>'
    + sectionsHtml
    + '</body></html>';
}

function main() {
  if (!fs.existsSync(WIKI_DIR)) die('wiki/ directory not found');
  const port = process.argv[2] ? parseInt(process.argv[2], 10) : 3000;
  if (isNaN(port)) die('invalid port: ' + port);
  const allPages = fs.readdirSync(WIKI_DIR).filter(function(f) {
    return f.endsWith('.md') && f !== 'index.md' && f !== 'log.md';
  }).map(function(f) { return readPage(path.join(WIKI_DIR, f)); }).filter(Boolean);
  const graph = buildGraph(allPages);
  const server = http.createServer(function(req, res) {
    const url = new URL(req.url, 'http://localhost:' + port);
    if (url.pathname === '/' || url.pathname === '/index') {
      html(res, renderIndex(allPages));
    } else if (url.pathname.startsWith('/wiki/')) {
      const slug = path.basename(url.pathname);
      const pg = allPages.find(function(p) { return p.slug === slug; });
      html(res, renderPage(pg, allPages));
    } else if (url.pathname === '/api/') {
      json(res, { pages: allPages.map(function(p) { return { slug: p.slug, tags: p.fm && p.fm.tags, status: p.fm && p.fm.status, summary: p.fm && p.fm.summary, links: extractLinks(p.body) }; }), graph: graph });
    } else {
      res.writeHead(404); res.end('Not found');
    }
  });
  server.listen(port, function() {
    console.log('Wiki Map running at http://localhost:' + port);
    console.log('Press Ctrl+C to stop');
  });
}

main();
