#!/usr/bin/env python3
"""
Responsible AI-Coding Framework CLI

Usage:
    vibe classify <path>          # Classify risk level of code
    vibe check <path>             # Run safety checks based on risk tier
    vibe audit <prompt> [code]    # Log prompt-response pair to audit trail
    vibe signoff                  # Interactive sign-off wizard
    vibe view [--limit 10]        # View audit log
"""

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path


HIGH_RISK_PATTERNS = [
    r'auth', r'login', r'password', r'token', r'session',
    r'payment', r'billing', r'credit', r'card',
    r'api[_-]?key', r'secret', r'private[_-]?key',
    r'encrypt', r'decrypt', r'hash', r"crypto",
    r'sql', r'query', r'injection',
    r'permission', r'acc[es]s[_-]?control', r'role',
    r'user[_-]?data', r'pii',
]

MEDIUM_RISK_PATTERNS = [
    r'api', r'endpoint', r'route', r'handler',
    r'database', r'db_', r'mongo', r'postgres', r'mysql',
    r'cache', r'redis',
    r'email', r'notification',
    r'upload', r'download', r'file', r'storage',
]


def classify_risk(code: str, file_path: str = "") -> str:
    score = 0
    
    for pattern in HIGH_RISK_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            score += 2
            break
    
    for pattern in MEDIUM_RISK_PATTERNS:
        if re.search(pattern, code, re.IGNORECASE):
            score += 1
            break
    
    filename = Path(file_path).name.lower()
    if any(x in filename for x in ['auth', 'payment', 'security', 'admin', 'config']):
        score += 2
    
    if score >= 2:
        return "high"
    elif score >= 1:
        return "medium"
    return "low"


def run_checks(risk_level: str, code_path: str) -> dict:
    results = {
        "risk_level": risk_level,
        "checks": [],
        "passed": True,
        "errors": []
    }
    
    try:
        with open(code_path, 'r', encoding='utf-8', errors='replace') as f:
            code = f.read()
    except Exception as e:
        return {
            "risk_level": risk_level,
            "checks": [{"name": "file_read", "status": "fail", "details": str(e)}],
            "passed": False,
            "errors": [str(e)]
        }
    
    secret_indicators = ['sk-', 'aws_', 'AKIA', '-----BEGIN', 'password=', 'secret_key=', 'api_key=']
    secrets_found = [line.strip() for line in code.split('\n') if any(ind in line.lower() for ind in secret_indicators) and len(line) > 10]
    
    results["checks"].append({
        "name": "secret_scan",
        "status": "pass" if not secrets_found else "fail",
        "details": f"Found {len(secrets_found)} potential secrets" if secrets_found else "No secrets detected"
    })
    if secrets_found:
        results["errors"].append(f"Potential secrets detected: {len(secrets_found)} found")
        results["passed"] = False
    
    if risk_level == "high":
        todos = len(re.findall(r'TODO|FIXME|HACK|XXX', code))
        results["checks"].append({
            "name": "incomplete_markers",
            "status": "pass" if todos == 0 else "warn",
            "details": f"Found {todos} TODO/FIXME markers"
        })
        
        prints = len(re.findall(r'\bprint\s*\(', code))
        if prints > 5:
            results["checks"].append({
                "name": "debug_output",
                "status": "warn",
                "details": f"Found {prints} print statements"
            })
    
    if risk_level in ["high", "medium"]:
        if not re.search(r'test|spec', code, re.IGNORECASE):
            results["checks"].append({
                "name": "test_indicator",
                "status": "warn",
                "details": "No test indicators found"
            })
    
    return results


AUDIT_DIR = ".vibe_audit"


def log_audit(prompt: str, code: str, risk_level: str, reviewer: str = "") -> dict:
    audit_path = Path(AUDIT_DIR)
    audit_path.mkdir(exist_ok=True)
    
    timestamp = datetime.now().isoformat()
    code_hash = hashlib.sha256(code.encode()).hexdigest()[:16]
    
    entry = {
        "timestamp": timestamp,
        "prompt_hash": hashlib.sha256(prompt.encode()).hexdigest()[:16],
        "code_hash": code_hash,
        "risk_level": risk_level,
        "reviewer": reviewer or "unreviewed",
        "prompt_preview": prompt[:200] + "..." if len(prompt) > 200 else prompt
    }
    
    (audit_path / f"{timestamp.replace(':', '-')}.json").write_text(json.dumps(entry, indent=2))
    
    index_file = audit_path / "index.jsonl"
    with open(index_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry) + "\n")
    
    return entry


def view_audit_log(limit: int = 10):
    index_file = Path(AUDIT_DIR) / "index.jsonl"
    
    if not index_file.exists():
        print("No audit trail found. Use `vibe audit` to create entries.")
        return
    
    entries = []
    with open(index_file) as f:
        for line in f:
            entries.append(json.loads(line.strip()))
    
    for entry in entries[-limit:]:
        print(f"\n[{entry['timestamp']}] Risk: {entry['risk_level']} | Reviewer: {entry['reviewer']}")
        print(f"  Prompt: {entry['prompt_preview']}...")


def signoff_wizard():
    print("\n=== AI Code Certification ===\n")
    
    developer = input("Your name/username: ")
    date = datetime.now().strftime("%Y-%m-%d")
    
    print("\nCertification checklist:")
    checks = [
        "I have reviewed this code module-by-module",
        "I understand the logic and intent",
        "I have verified security implications",
        "I accept responsibility for this code in production",
        "Prompt history preserved"
    ]
    
    signed = True
    for i, check in enumerate(checks, 1):
        answer = input(f"{i}. [{check}] (y/n): ").strip().lower()
        if answer != 'y':
            signed = False
            print(f"\n[WARN] Checklist incomplete - cannot certify.\n")
            break
    
    if signed:
        cert = {"developer": developer, "date": date, "certified": True, "checks_passed": len(checks)}
        Path(".vibe_cert").write_text(json.dumps(cert, indent=2))
        print(f"\n[OK] Certified by {developer} on {date}")
    else:
        print("\n[CERT FAILED] Certification failed")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Responsible AI-Coding Framework")
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    classify_parser = subparsers.add_parser('classify', help='Classify code risk')
    classify_parser.add_argument('path', help='Code file or directory')
    
    check_parser = subparsers.add_parser('check', help='Run safety checks')
    check_parser.add_argument('path', help='Code file')
    check_parser.add_argument('--risk-level', choices=['high', 'medium', 'low'], help='Override risk')
    
    audit_parser = subparsers.add_parser('audit', help='Log audit entry')
    audit_parser.add_argument('prompt', help='Original AI prompt')
    audit_parser.add_argument('code_file', nargs='?', help='Code file')
    audit_parser.add_argument('--reviewer', help='Reviewer name')
    
    view_parser = subparsers.add_parser('view', help='View audit log')
    view_parser.add_argument('--limit', type=int, default=10)
    
    subparsers.add_parser('signoff', help='Interactive certification')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == 'classify':
        path = Path(args.path)
        if path.is_dir():
            for py_file in sorted(path.rglob('*.py')):
                try:
                    risk = classify_risk(py_file.read_text(encoding='utf-8', errors='replace'), str(py_file))
                    print(f"[{risk.upper():6}] {py_file}")
                except Exception as e:
                    print(f"[ERROR  ] {py_file}: {e}")
        elif path.is_file():
            try:
                risk = classify_risk(path.read_text(encoding='utf-8', errors='replace'), str(path))
                print(f"Risk level: {risk.upper()}")
            except Exception as e:
                print(f"Error: {e}", file=sys.stderr)
                sys.exit(1)
        else:
            print(f"Error: {args.path} not found", file=sys.stderr)
            sys.exit(1)
    
    elif args.command == 'check':
        path = Path(args.path)
        if not path.exists():
            print(f"Error: {args.path} not found", file=sys.stderr)
            sys.exit(1)
        
        try:
            risk = args.risk_level or classify_risk(path.read_text(encoding='utf-8', errors='replace'), str(path))
            results = run_checks(risk, str(path))
            
            print(f"\nRisk Level: {results['risk_level'].upper()}")
            print("-" * 40)
            
            for check in results['checks']:
                icon = "[OK]" if check['status'] == 'pass' else "[WARN]" if check['status'] == 'warn' else "[FAIL]"
                print(f"  {icon} {check['name']}: {check['details']}")
            
            if not results['passed']:
                print("\nChecks FAILED:")
                for error in results['errors']:
                    print(f"  - {error}")
                sys.exit(1)
            else:
                print("\nAll checks passed [OK]")
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    
    elif args.command == 'audit':
        prompt = args.prompt
        if args.code_file:
            try:
                code = Path(args.code_file).read_text(encoding='utf-8', errors='replace')
            except Exception as e:
                print(f"Error reading code file: {e}", file=sys.stderr)
                sys.exit(1)
        else:
            print("Enter code (Ctrl+D to finish):")
            code = sys.stdin.read()
        
        risk = classify_risk(code, args.code_file or "")
        entry = log_audit(prompt, code, risk, args.reviewer or "")
        print(f"Audit logged: {entry['risk_level']} risk, hash {entry['code_hash']}")
    
    elif args.command == 'view':
        view_audit_log(args.limit)
    
    elif args.command == 'signoff':
        signoff_wizard()


if __name__ == '__main__':
    main()
