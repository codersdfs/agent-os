#!/usr/bin/env node
/**
 * Responsible AI-Coding Framework CLI
 * 
 * Usage:
 *   vibe classify <path>          # Classify risk level of code
 *   vibe check <path>             # Run safety checks based on risk tier
 *   vibe audit <prompt> [code]    # Log prompt-response pair to audit trail
 *   vibe signoff                  # Interactive sign-off wizard
 *   vibe view [--limit 10]        # View audit log
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

// ─────────────────────────────────────────────────────────────────────────────
// Risk Classification
// ─────────────────────────────────────────────────────────────────────────────

const HIGH_RISK_PATTERNS = [
  /auth/, /login/, /password/, /token/, /session/,
  /payment/, /billing/, /credit/, /card/,
  /api[_-]?key/, /secret/, /private[_-]?key/,
  /encrypt/, /decrypt/, /hash/, /crypto/,
  /sql/, /query/, /injection/,
  /permission/, /access[_-]?control/, /role/,
  /user[_-]?data/, /pii/,
];

const MEDIUM_RISK_PATTERNS = [
  /api/, /endpoint/, /route/, /handler/,
  /database/, /db_/, /mongo/, /postgres/, /mysql/,
  /cache/, /redis/,
  /email/, /notification/,
  /upload/, /download/, /file/, /storage/,
];

function classifyRISK(code, filePath = '') {
  let score = 0;
  
  for (const pattern of HIGH_RISK_PATTERNS) {
    if (pattern.test(code)) {
      score += 2;
      break;
    }
  }
  
  for (const pattern of MEDIUM_RISK_PATTERNS) {
    if (pattern.test(code)) {
      score += 1;
      break;
    }
  }
  
  const filename = path.basename(filePath).toLowerCase();
  if (['auth', 'payment', 'security', 'admin', 'config'].some(x => filename.includes(x))) {
    score += 2;
  }
  
  if (score >= 2) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// Safety Checks
// ─────────────────────────────────────────────────────────────────────────────

function runChecks(riskLevel, codePath) {
  const results = {
    risk_level: riskLevel,
    checks: [],
    passed: true,
    errors: []
  };
  
  let code;
  try {
    code = fs.readFileSync(codePath, 'utf8');
  } catch (e) {
    results.checks.push({ name: 'file_read', status: 'fail', details: e.message });
    results.passed = false;
    results.errors = [e.message];
    return results;
  }
  
  // Secret scanning
  const secretIndicators = ['sk-', 'aws_', 'AKIA', '-----BEGIN', 'password=', 'secret_key=', 'api_key='];
  const secretsFound = code.split('\n').filter(line => 
    secretIndicators.some(ind => line.toLowerCase().includes(ind)) && line.length > 10
  );
  
  results.checks.push({
    name: 'secret_scan',
    status: secretsFound.length === 0 ? 'pass' : 'fail',
    details: secretsFound.length > 0 
      ? `Found ${secretsFound.length} potential secrets`
      : 'No secrets detected'
  });
  
  if (secretsFound.length > 0) {
    results.errors.push(`Potential secrets detected: ${secretsFound.length} found`);
    results.passed = false;
  }
  
  // High risk additional checks
  if (riskLevel === 'high') {
    const todos = (code.match(/TODO|FIXME|HACK|XXX/g) || []).length;
    results.checks.push({
      name: 'incomplete_markers',
      status: todos === 0 ? 'pass' : 'warn',
      details: `Found ${todos} TODO/FIXME markers`
    });
    
    const prints = (code.match(/\bprint\s*\(/g) || []).length;
    if (prints > 5) {
      results.checks.push({
        name: 'debug_output',
        status: 'warn',
        details: `Found ${prints} print statements`
      });
    }
  }
  
  // Medium+ risk: test indicator
  if (['high', 'medium'].includes(riskLevel)) {
    if (!/(test|spec)/i.test(code)) {
      results.checks.push({
        name: 'test_indicator',
        status: 'warn',
        details: 'No test indicators found'
      });
    }
  }
  
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit Trail
// ─────────────────────────────────────────────────────────────────────────────

const AUDIT_DIR = '.vibe_audit';

function logAudit(prompt, code, riskLevel, reviewer = '') {
  const auditPath = path.resolve(AUDIT_DIR);
  
  if (!fs.existsSync(auditPath)) {
    fs.mkdirSync(auditPath, { recursive: true });
  }
  
  const timestamp = new Date().toISOString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 16);
  
  const entry = {
    timestamp,
    prompt_hash: crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16),
    code_hash: codeHash,
    risk_level: riskLevel,
    reviewer: reviewer || 'unreviewed',
    prompt_preview: prompt.length > 200 ? prompt.slice(0, 200) + '...' : prompt
  };
  
  // Save entry
  const entryFile = path.join(auditPath, `${timestamp.replace(/:/g, '-')}.json`);
  fs.writeFileSync(entryFile, JSON.stringify(entry, null, 2));
  
  // Append to index
  const indexFile = path.join(auditPath, 'index.jsonl');
  fs.appendFileSync(indexFile, JSON.stringify(entry) + '\n', 'utf8');
  
  return entry;
}

function viewAuditLog(limit = 10) {
  const indexFile = path.join(AUDIT_DIR, 'index.jsonl');
  
  if (!fs.existsSync(indexFile)) {
    console.log('No audit trail found. Use `vibe audit` to create entries.');
    return;
  }
  
  const lines = fs.readFileSync(indexFile, 'utf8').trim().split('\n');
  const entries = lines.map(l => JSON.parse(l));
  
  const recent = entries.slice(-limit);
  for (const entry of recent) {
    console.log(`\n[${entry.timestamp}] Risk: ${entry.risk_level} | Reviewer: ${entry.reviewer}`);
    console.log(`  Prompt: ${entry.prompt_preview}...`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sign-off Wizard
// ─────────────────────────────────────────────────────────────────────────────

function signoffWizard() {
  console.log('\n=== AI Code Certification ===\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const developer = askQuestion(rl, 'Your name/username: ');
  const date = new Date().toISOString().split('T')[0];
  
  console.log('\nCertification checklist:');
  const checks = [
    'I have reviewed this code module-by-module',
    'I understand the logic and intent',
    'I have verified security implications',
    'I accept responsibility for this code in production',
    'Prompt history preserved'
  ];
  
  let signed = true;
  for (let i = 0; i < checks.length; i++) {
    const answer = askQuestion(rl, `${i + 1}. [${checks[i]}] (y/n): `);
    if (answer.toLowerCase() !== 'y') {
      signed = false;
      console.log('\n[WARN] Checklist incomplete - cannot certify.\n');
      break;
    }
  }
  
  rl.close();
  
  if (signed) {
    const cert = {
      developer,
      date,
      certified: true,
      checks_passed: checks.length
    };
    
    fs.writeFileSync('.vibe_cert', JSON.stringify(cert, null, 2));
    console.log(`\n[OK] Certified by ${developer} on ${date}`);
    console.log('  Certificate saved to .vibe_cert');
  } else {
    console.log('\n[CERT FAILED] Certification failed');
    process.exit(1);
  }
}

function askQuestion(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Entry Point
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: vibe <command> [options]

Commands:
  classify <path>          Classify risk level of code
  check <path>             Run safety checks based on risk tier
  audit <prompt> [code]    Log prompt-response pair to audit trail
  signoff                  Interactive sign-off wizard
  view                     View audit log

Options:
  --risk-level <level>     Override risk classification (high/medium/low)
  --reviewer <name>        Set reviewer name
  --limit <n>              Number of audit entries to show (default: 10)
`);
    process.exit(0);
  }
  
  const command = args[0];
  const options = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--risk-level' && args[i + 1]) {
      options.riskLevel = args[++i];
    } else if (args[i] === '--reviewer' && args[i + 1]) {
      options.reviewer = args[++i];
    } else if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[++i], 10);
    }
  }
  
  const commandArgs = args.slice(1).filter(a => !a.startsWith('--'));
  
  switch (command) {
    case 'classify': {
      const targetPath = commandArgs[0];
      if (!targetPath) {
        console.error('Error: Path required');
        process.exit(1);
      }
      
      const resolvedPath = path.resolve(targetPath);
      
      if (fs.statSync(resolvedPath).isDirectory()) {
        // Scan directory recursively
        const scanDir = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              scanDir(fullPath);
            } else if (entry.name.endsWith('.py')) {
              const code = fs.readFileSync(fullPath, 'utf8');
              const risk = classifyRISK(code, fullPath);
              console.log(`[${risk.toUpperCase().padEnd(6)}] ${fullPath}`);
            }
          }
        };
        scanDir(resolvedPath);
      } else if (fs.statSync(resolvedPath).isFile()) {
        const code = fs.readFileSync(resolvedPath, 'utf8');
        const risk = classifyRISK(code, resolvedPath);
        console.log(`Risk level: ${risk.toUpperCase()}`);
      } else {
        console.error(`Error: ${targetPath} not found`);
        process.exit(1);
      }
      break;
    }
    
    case 'check': {
      const targetPath = commandArgs[0];
      if (!targetPath) {
        console.error('Error: Path required');
        process.exit(1);
      }
      
      const resolvedPath = path.resolve(targetPath);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: ${targetPath} not found`);
        process.exit(1);
      }
      
      try {
        const code = fs.readFileSync(resolvedPath, 'utf8');
        const risk = options.riskLevel || classifyRISK(code, resolvedPath);
        const results = runChecks(risk, resolvedPath);
        
        console.log(`\nRisk Level: ${results.risk_level.toUpperCase()}`);
        console.log('-'.repeat(40));
        
        for (const check of results.checks) {
          const icon = check.status === 'pass' ? '[OK]' : check.status === 'warn' ? '[WARN]' : '[FAIL]';
          console.log(`  ${icon} ${check.name}: ${check.details}`);
        }
        
        if (!results.passed) {
          console.log('\nChecks FAILED:');
          for (const error of results.errors) {
            console.log(`  - ${error}`);
          }
          process.exit(1);
        } else {
          console.log('\nAll checks passed [OK]');
        }
      } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }
      break;
    }
    
    case 'audit': {
      const prompt = commandArgs[0];
      if (!prompt) {
        console.error('Error: Prompt required');
        process.exit(1);
      }
      
      const codeFile = commandArgs[1];
      let code;
      
      if (codeFile) {
        const resolvedPath = path.resolve(codeFile);
        if (!fs.existsSync(resolvedPath)) {
          console.error(`Error: ${codeFile} not found`);
          process.exit(1);
        }
        code = fs.readFileSync(resolvedPath, 'utf8');
      } else {
        console.log('Enter code (end with Ctrl+D):');
        code = fs.readFileSync(0, 'utf8'); // Read from stdin
      }
      
      const risk = classifyRISK(code, codeFile || '');
      const entry = logAudit(prompt, code, risk, options.reviewer || '');
      console.log(`Audit logged: ${entry.risk_level} risk, hash ${entry.code_hash}`);
      break;
    }
    
    case 'view': {
      viewAuditLog(options.limit || 10);
      break;
    }
    
    case 'signoff': {
      signoffWizard().catch(e => {
        console.error('Error:', e.message);
        process.exit(1);
      });
      return; // Async, don't exit yet
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run `vibe` without arguments for help.');
      process.exit(1);
  }
}

// Export for programmatic use
module.exports = { classifyRISK, runChecks, logAudit, viewAuditLog };

// Run CLI if executed directly
if (require.main === module) {
  main();
}
