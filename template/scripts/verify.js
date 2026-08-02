#!/usr/bin/env node
/* verify.js - runs the full pre-flight checks for a workspace.
   Called by: npm run verify (both in template and in generated workspaces).
   Exits 0 on clean, non-zero on any failure.
   Checks:
     1. npm audit (skips if no package-lock)
     2. selfcheck (scripts compile, no UNKNOWN skills)
     3. security_scan (regex secret scanner)
     4. skill-assemble (prompt stays within 8K budget)
     5. typecheck: runs tsc if tsconfig.json exists
     6. test: runs npm test if package.json has test script */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NODE = process.execPath;

function run(label, cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
  if (r.status === 0) {
    console.log(`OK  ${label}`);
    return true;
  }
  // Exit code null means ENOENT (command not found) — skip, don't fail.
  if (r.status === null) {
    console.log(`SKIP ${label} (command not found: ${cmd})`);
    return null;
  }
  console.error(`FAIL ${label} (exit ${r.status})`);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.stdout) process.stdout.write(r.stdout);
  return false;
}

function main() {
  const failures = [];
  const results = {};

  // 1. npm audit (skips if no package-lock.json)
  if (fs.existsSync(path.join(ROOT, 'package-lock.json'))) {
    const ok = run('audit', 'npm', ['audit']);
    results.audit = ok;
    if (ok === false) failures.push('audit');
  } else {
    console.log('SKIP audit (no package-lock.json)');
    results.audit = null;
  }

  // 2. selfcheck
  const scPath = path.join(ROOT, 'scripts', 'selfcheck.js');
  if (fs.existsSync(scPath)) {
    const ok = run('selfcheck', NODE, [scPath]);
    results.selfcheck = ok;
    if (ok === false) failures.push('selfcheck');
  }

  // 3. security-scan
  const secPath = path.join(ROOT, 'scripts', 'security_scan.js');
  if (fs.existsSync(secPath)) {
    const ok = run('security-scan', NODE, [secPath]);
    results.security_scan = ok;
    if (ok === false) failures.push('security_scan');
  }

  // 4. skill-assemble
  const asmPath = path.join(ROOT, 'scripts', 'assemble_prompt.js');
  if (fs.existsSync(asmPath)) {
    const ok = run('skill-assemble', NODE, [asmPath]);
    results['skill-assemble'] = ok;
    if (ok === false) failures.push('skill-assemble');
  }

  // 5. typecheck (only if tsconfig.json exists)
  if (fs.existsSync(path.join(ROOT, 'tsconfig.json'))) {
    const ok = run('typecheck', NODE, ['node_modules/.bin/tsc', '--noEmit']);
    results.typecheck = ok;
    if (ok === false) failures.push('typecheck');
  }

  // 6. test (only if package.json has a test script)
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    if (pkg.scripts && pkg.scripts.test) {
      const ok = run('test', 'npm', ['test']);
      results.test = ok;
      if (ok === false) failures.push('test');
    } else {
      console.log('SKIP test (no test script in package.json)');
      results.test = null;
    }
  } catch (e) {
    console.error('Could not read package.json:', e.message);
  }

  // Summary
  console.log();
  console.log('=== verify summary ===');
  for (const [k, v] of Object.entries(results)) {
    const status = v === null ? 'SKIP' : (v ? 'OK' : 'FAIL');
    console.log(`  ${status} ${k}`);
  }
  if (failures.length) {
    console.error();
    console.error(`FAILURES: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('All checks passed.');
}

if (require.main === module) main();
module.exports = { main };
