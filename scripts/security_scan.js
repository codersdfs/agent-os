const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SCAN_PATHS = ['skills/details', 'AGENTS.md', 'raw'];
const PATTERNS = [
  /password\s*[:=]\s*["'][^"']+["']/i,
  /api[_-]?key\s*[:=]\s*["'][A-Za-z0-9]{16,}["']/i,
  /secret\s*[:=]\s*["'][^"']+["']/i,
  /token\s*[:=]\s*["'][A-Za-z0-9+/={20,}]+["']/i,
  /(?:sk|pk)(?:prod|test)[A-Za-z0-9]{20,}/,
];
function scanFile(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const results = [];
    for (const re of PATTERNS) {
      const m = content.match(re);
      if (m) results.push({ file: path.relative(ROOT, file), pattern: m[0].slice(0, 40) });
    }
    return results;
  } catch {
    return [];
  }
}
function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}
function scanWithRipgrep() {
  const results = [];
  for (const rel of SCAN_PATHS) {
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isFile()) {
      const f = scanFile(full);
      results.push(...f);
    } else {
      for (const file of walk(full)) {
        results.push(...scanFile(file));
      }
    }
  }
  return results;
}
function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const findings = scanWithRipgrep();
  if (findings.length) {
    console.error('security_scan found potential secrets:');
    for (const f of findings) console.error('  ' + f.file + ': ...' + f.pattern);
    process.exit(1);
  }
  console.log(strict ? 'security_scan: clean (strict mode)' : 'security_scan: clean (informational)');
}
if (require.main === module) main();
module.exports = { PATTERNS, scanWithRipgrep };
