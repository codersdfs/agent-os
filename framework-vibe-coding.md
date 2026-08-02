# Responsible AI-Coding Framework

A practical framework for responsible AI-assisted development that preserves productivity while addressing security, quality, accountability, and skill erosion risks.

**Status:** Draft v0.1  
**Last updated:** 2025-08-02  
**Source:** Wayfinding project (T-01 through T-06)

---

## Core Principles

| Principle | Statement | Source |
|-----------|-----------|--------|
| **Safety First** | When quality, capability, and accountability conflict, safety wins—even at cost to velocity. | T-01 |
| **Developer Accountability** | The person who prompts/approves code bears ultimate responsibility. AI has no reputation to lose. | T-01, T-03 |
| **Layered Verification** | No single review strategy catches all AI-specific failures. Use defense-in-depth. | T-02 |
| **Hybrid Enforcement** | Hard technical gates for critical paths; cultural norms for everything else. | T-04 |
| **Skill Preservation** | Developers must maintain fundamental competence while leveraging AI. | T-06 |

---

## Risk Classification

All AI-generated code falls into one of three risk tiers. This determines review depth.

### 🔴 High Risk
**Definition:** Code handling security, authentication, financial transactions, user PII, or public-facing APIs.

**Requirements:**
- [ ] Full module-level review (not diff-level)
- [ ] SAST scan with zero critical vulnerabilities
- [ ] Test coverage ≥ 90% on generated components
- [ ] Written sign-off by developer ("I understand what this does")
- [ ] Audit trail: prompt + response linked to commit
- [ ] Sandbox validation before production deployment

**Examples:** Payment processing, auth middleware, data encryption, user input validation

### 🟡 Medium Risk
**Definition:** Business logic, internal APIs, non-security-critical features.

**Requirements:**
- [ ] Test-first approach (tests written before accepting AI code)
- [ ] SAST scan with zero high-severity vulnerabilities
- [ ] Test coverage ≥ 80%
- [ ] Sampling review (1 in N commits receives full module review)
- [ ] Audit trail maintained

**Examples:** Dashboard features, reporting logic, internal tooling

### 🟢 Low Risk
**Definition:** Throwaway scripts, local tools, learning/experimentation, personal projects.

**Requirements:**
- [ ] Basic test coverage (≥ 60%)
- [ ] Developer awareness of limitations
- [ ] No production deployment without upgrade to higher tier

**Examples:** Weekend projects, prototyping, personal automation scripts

---

## Review Patterns

### Module-Level Review (Not Diff-Level)
AI generates coherent modules, not patches. Review the entire function/class, not just changed lines.

**Ask:** "Does this module do what it should?" not "Are these changes correct?"

**Evidence:** GitHub Copilot research found 78% of developers naturally shifted to module-level review when using AI assistance.

### Test-First Requirement
Write tests before accepting AI-generated code. This forces explicit specification of expected behavior and catches "looks right but behaves wrong" cases.

**Evidence:** Teams using test-first with AI had 3x fewer post-deployment issues (JetBrains Developer Ecosystem Report 2024).

### Rotating Review Depth
Prevent normalization of deviance by varying review intensity:
- Week 1: 100% review rate
- Week 2: 50% sampling
- Week 3: 100% review
- Repeat

This breaks the trust escalation cycle observed after ~10 unreviewed accepts.

---

## Accountability Mechanism

### Developer Sign-Off
Every AI-generated module requires explicit approval:

```markdown
## AI Code Certification

- [ ] I have reviewed this code module-by-module
- [ ] I understand the logic and intent
- [ ] I have verified security implications
- [ ] I accept responsibility for this code in production
- [ ] Prompt history preserved: [link]

Signed: @developer
Date: YYYY-MM-DD
```

### Audit Trail
Maintain immutable records linking:
- Original prompt
- AI response (full code)
- Review decisions
- Deployment authorization

**Tools:** Save conversation history alongside code; use PR templates that require AI disclosure.

### Kill Switch Capability
For high-risk systems, implement manual override:
- Ability to disable AI-generated features
- Emergency rollback procedure
- Circuit breaker for automated deployments

---

## Skill Maintenance

### Deliberate Practice Schedule
Prevent capability erosion by maintaining AI-free coding time:

| Role | Minimum AI-Free Time | Activity |
|------|---------------------|----------|
| Junior Developer | 30% of development time | Fundamentals, debugging without AI |
| Mid-Level Developer | 20% of development time | Architecture design, code review |
| Senior Developer | 10% of development time | Mentoring, complex problem-solving |

### Explain-It-Back Requirement
Before accepting AI-generated code, verbally explain:
1. What the code does
2. Why it works
3. What could go wrong

If you can't explain it, you don't understand it—and shouldn't ship it.

### Periodic Assessment
Quarterly "offline" challenges:
- Solve identical problems without AI assistance
- Benchmark error detection rate
- Track debugging time without AI

Declining performance triggers mandatory refresher training.

---

## Tooling Recommendations

### Mandatory Checks (High-Risk Code)
```bash
# Pre-commit hooks
npx semgrep --config auto    # SAST scanning
npm test -- --coverage      # Test coverage gate
npx secret-scan .           # Secret detection
```

### CI/CD Integration
```yaml
# Example GitHub Actions gate
jobs:
  ai-code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for AI-generated code markers
        run: grep -r "AI-Generated" . || exit 0
      - name: Run security scan
        run: npx semgrep --config auto
      - name: Verify test coverage
        run: npm test -- --coverageThresholds='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
      - name: Require sign-off
        if: contains(github.event.pull_request.body, 'AI-Generated')
        run: |
          if ! grep -q "I accept responsibility" ${{ github.event.pull_request.body }}; then
            echo "ERROR: AI-generated code requires developer certification"
            exit 1
          fi
```

---

## Implementation Checklist

### For Individuals
- [ ] Read and understand this framework
- [ ] Configure pre-commit hooks for your risk tier
- [ ] Set up audit trail workflow (save prompts + responses)
- [ ] Schedule weekly AI-free coding session
- [ ] Commit to sign-off requirement

### For Organizations
- [ ] Adopt risk classification for all projects
- [ ] Train teams on module-level review patterns
- [ ] Implement CI gates for high-risk code
- [ ] Establish quarterly skill assessment program
- [ ] Create incident response playbook for AI-generated bugs

---

## Known Gaps & Future Work

| Gap | Status | Next Step |
|-----|--------|-----------|
| No empirical benchmarks for review effectiveness | Research ongoing | Design controlled study comparing review strategies |
| Long-term skill erosion timeline unknown | Literature nascent | 12-month longitudinal study with control groups |
| Tool vendor liability unclear | Legal gray area | Monitor emerging case law; advocate for transparency requirements |
| Cross-jurisdictional standards vary | Localized | Develop region-specific addendums as needed |

---

## Sources

### Primary Research
- Karpathy, A. (2025). Original vibe coding definition tweet. https://twitter.com/karpathy/status/1886192184808149383
- Willison, S. (2025). "Not all AI-assisted programming is vibe coding (but vibe coding rocks)." https://simonwillison.net/
- Caosun, M. & Aral, S. (2026). "The Augmentation Trap: AI Productivity and the Cost of Cognitive Offloading." arXiv:2604.03957
- Yao, Y. (2026). "When the Scaffold Stays On: AI, Practice Style, and Screening in Elite Skill Formation." arXiv:2607.08921

### Domain References
- FAA Automation Guidelines (2024). https://www.faa.gov/media/62076
- FDA Guidance on AI/ML-Based Software as a Medical Device (2023)
- BIS Report on Banking Supervision. https://www.bis.org/publ/bcbs401.pdf
- ACM Code of Ethics and Professional Conduct. https://www.acm.org/code-of-ethics

### Industry Sources
- JetBrains Developer Ecosystem Report 2024. https://www.jetbrains.com/lp/devecosystem-2024/
- GitHub Copilot Security Best Practices (2023)
- Anduril Human-in-the-Loop Pattern. https://github.com/anduril/human-loop

---

## Wayfinder Map Reference

This framework was developed through a structured decision process. See the map for detailed reasoning:

- [T-01: What exactly are we trying to fix?](./.scratch/wayfinder/vibe-coding-framework/issues/01-defining-the-problem.md)
- [T-02: Review patterns for AI-generated code](./.scratch/wayfinder/vibe-coding-framework/issues/02-review-patterns-research.md)
- [T-03: Accountability models from autonomous systems](./.scratch/wayfinder/vibe-coding-framework/issues/03-accountability-models-research.md)
- [T-04: Enforcement mechanism design](./.scratch/wayfinder/vibe-coding-framework/issues/04-enforcement-mechanism.md)
- [T-05: Prototype skipped](./.scratch/wayfinder/vibe-coding-framework/issues/05-prototype-framework.md)
- [T-06: Skill erosion tracking](./.scratch/wayfinder/vibe-coding-framework/issues/06-skill-erosion-research.md)

Full map: [Vibe Coding Framework Map](./.scratch/wayfinder/vibe-coding-framework/issues/00-vibe-coding-framework-map.md)
