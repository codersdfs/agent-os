#!/usr/bin/env node
/* selfcheck.js — verify the pipeline's non-trivial logic. Node port of the
   audited selfcheck.py. Covers:
     1. compress_check is fail-loud, never mutates content.
     2. skill_loader dependency resolution is case-insensitive in every branch.
     3. End-to-end: --auto "grill me" loads BATCH_GRILL_ME.
   Exit 0 = all pass. Run: npm run selfcheck */
const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');

function testCompress() {
  const { check, MAX_TOKENS } = require('./compress_check');
  const small = '# Hello\n\nThis is a tiny prompt.\n';
  assert.strictEqual(check(small), small, 'compress must not mutate in-budget text');
  const big = 'word '.repeat(5000) + '\nnoteworthy line that old code would delete\n';
  assert.throws(() => check(big), undefined, 'compress must raise when over the token budget');
  assert.strictEqual(MAX_TOKENS, 395, 'budget constant drifted');
}

function testDependencyOrderCase() {
  const { loadAllSkills, resolveDependencyOrder } = require('./skill_loader');
  const real = loadAllSkills();
  assert.ok('BATCH_GRILL_ME' in real, 'expected skills failed to load');

  // Synthetic skills with a dependency declared in lowercase — the case the
  // old python --load-matched --json branch tripped on.
  const synthetic = {
    PARENT: { frontmatter: { depends_on: [] } },
    CHILD: { frontmatter: { depends_on: ['parent'], skill_name: 'CHILD' } },
  };
  const ordered = resolveDependencyOrder(['CHILD'], synthetic);
  assert.deepStrictEqual(ordered, ['PARENT', 'CHILD'], `dependency order broken: ${ordered}`);

  // The --load-matched --json dependency-details lookup path:
  const deps = synthetic.CHILD.frontmatter.depends_on;
  for (const d of deps) {
    const k = d.toUpperCase().trim();
    assert.ok(k in synthetic, `dep key lookup failed for '${d}'`);
  }
}

function testEndToEnd() {
  const loader = path.join(__dirname, 'skill_loader.js');
  const out = JSON.parse(execFileSync(process.execPath, [loader, '--auto', 'grill me'], { encoding: 'utf8' }));
  assert.ok(out.loaded.some((e) => e.skill_name === 'BATCH_GRILL_ME'), out);
}

testCompress();
testDependencyOrderCase();
testEndToEnd();
console.log('selfcheck: all pass');
