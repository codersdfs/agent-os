# Difficulties of AI Vibe Coding — Summary

Based on research from Simon Willison, Andrej Karpathy's original definition, and community discussions.

---

## What Is Vibe Coding?

Coined by **Andrej Karpathy** (Feb 2025): A style of coding where you **"fully give in to the vibes, embrace exponentials, and forget that the code even exists."** You prompt LLMs (e.g., Cursor Composer with Sonnet), accept all suggestions without reading diffs, copy-paste error messages back into the model, and work around bugs rather than fix them.

Simon Willison's concise definition: **Building software with an LLM without reviewing the code it writes.**

---

## Core Difficulties & Risks

### 1. 🚨 Lack of Code Review = Hidden Bugs
- You don't know if the generated code is correct, secure, or performant
- Errors are patched by prompting rather than understood and fixed
- **"The code grows beyond my usual comprehension"** — Karpathy admits he'd need to spend significant time understanding his own vibe-coded projects

### 2. 🔐 Security Vulnerabilities
- No one reviewed the code for security flaws
- Risk of exposing API keys, mishandling user data, or introducing injection vulnerabilities
- Particularly dangerous when code handles real user information or financial transactions

### 3. 🧠 Over-Reliance & Skill Erosion
- Developers stop learning how things actually work
- Normalization of deviance: each successful unreviewed deploy makes you trust the next one more
- **You lose the ability to debug when the AI can't help**

### 4. 📊 Hard to Evaluate Quality
- LLMs can generate clean-looking code with comprehensive tests that appear thorough but are superficial
- "A GitHub repo with 100 commits, beautiful readme, and automated tests" can now be generated in 30 minutes
- Even the author can't tell if their own vibe-coded project is actually good

### 5. 🔄 Accountability Gap
- Human developers have professional reputations; AI agents do not
- No one is accountable when vibe-coded production software fails
- **"Claude Code does not have a professional reputation! It can't take accountability for what it's done."** — Simon Willison

### 6. 🛠️ Production-Readiness Concerns
- Vibe coding is fine for throwaway weekend projects
- **Grossly irresponsible** for software used by others — other people get hurt by your stupid bugs
- Maintenance becomes a nightmare when the original author doesn't understand the codebase

### 7. 🌊 Ephemeral & Untrackable
- Apps become personal, situated, and frequent — hard to discover, share, or maintain over time
- No ecosystem for tracking version updates, security patches, or tool improvements
- Apps may disappear or become insecure as platforms evolve

---

## When Is It OK?

| ✅ Appropriate | ❌ Not Appropriate |
|----------------|-------------------|
| Personal throwaway projects | Production systems serving other people |
| Learning/experimentation | Code handling sensitive user data |
| Prototypes and MVPs | Security-critical applications |
| Local tools that only affect you | Shared APIs or public-facing services |
| Low-stakes internal tools | Anything with billing/usage costs (unexpected charges) |

---

## Better Alternatives

### Agentic Engineering
Professional software engineers using AI tools responsibly:
- Review all generated code
- Write meaningful tests
- Understand security implications
- Maintain documentation
- Consider performance, accessibility, cost

### Sandbox-First Approach
Use platforms like Claude Artifacts that restrict:
- Code execution to locked-down `<iframe>` environments
- Network access to approved domains only
- Library imports to vetted packages

### Prompt Sharing & Reproducibility
Simon Willison shares prompts and chat history alongside his tools — this helps others:
- Understand what was attempted
- Reproduce results
- Fork and improve

---

## Key Takeaways

1. **Vibe coding ≠ AI-assisted programming.** Responsible use of LLMs for code (with review, testing, and understanding) is still software engineering.

2. **The bottleneck has shifted.** We no longer struggle with writing code fast enough; we struggle with evaluating whether generated code is correct and safe.

3. **Trust but verify.** Even experienced developers find themselves trusting agents too much after repeated success — this is the normalization of deviance.

4. **Know your stakes.** Ask: "Who gets hurt if this breaks?" If the answer is anyone other than you, don't vibe code it.

---

## Additional Difficulties Found

### 8. 🧪 Inability to Verify Output Correctness
- **Willison's SwiftUI apps example**: Built "Bandwidther" (network monitor) and "Gpuer" (GPU monitor) but admitted he was "completely unqualified to evaluate if the numbers and charts being spat out by these tools are credible or accurate!"
- AI can report plausible-looking but wrong data — and even experienced developers lack the domain expertise to verify
- Added warnings to his GitHub repos: "You shouldn't trust these apps"

### 9. 🤖 Hallucinated Data & Content
- **Kevin Roose (NYT)**: When building a tire shop website, AI "made up fake reviews from the shop's Yelp page and added them to a testimonials page"
- When turning a story into an interactive website, AI "included about half the text and left out the other half"
- Factual hallucinations in generated content are hard to catch without careful review

### 10. 🛡️ Safety Rails Are Limited
- **Claude Artifacts**: Code restricted to locked-down `<iframe>`, can only load approved libraries, can't make network requests to other sites
- **Cursor**: Far less safety rails — originally intended for professional developers
- Other vibe coding platforms have minimal restrictions, making it easy to cause harm
- **Willison's warning**: "Be very careful about using vibe coding against anything that's charged based on usage" — seen horror stories of people racking up thousands in API charges

### 11. 📉 The Expertise Amplifier Problem
- LLMs are **amplifiers of existing expertise** — if you don't know what you're doing, you'll produce bad results faster
- **Willison**: "The best way to learn the capabilities of LLMs is to throw tasks at them that may be beyond their abilities and see what happens"
- Beginners who vibe code without understanding gain false confidence
- **Guardian's John Naughton**: "AI will not replace programmers, but it will transform their jobs" — the end of programming as we knew it

### 12. 🔄 Bottleneck Has Shifted Upstream & Downstream
- **Upstream**: Design processes designed for 3-month builds are now overkill when AI can build in hours
- **Downstream**: Testing, deployment, maintenance — the entire SDLC was designed around producing a few hundred lines/day, not 2,000+
- **Willison**: "If you can go from producing 200 lines of code a day to 2,000 lines of code a day, what else breaks?"

### 13. 🎯 The "Software-Shaped Problem" Blindness
- Programmers are trained to see everything as a software problem: "if you do a task three times, you should probably automate it with a script"
- Most people's problems are not software-shaped — they don't notice when they are
- **Jasmine Sun**: "We are blind to the solutions we were never taught to see, asking for faster horses and never dreaming of cars"

### 14. 🔒 Malicious Code & Autonomous Cyberattacks
- **NYT's Roose**: "It's possible that an AI that automates building useful software could also automate the creation of malicious code, or even lead to autonomous cyberattacks"
- Lower barrier for bad actors to generate functional malware
- No way to verify intent vs. accidental harm in generated code

### 15. 📊 New Evaluation Challenge: Usage Over Documentation
- **Willison**: "What I value more than the quality of the tests and documentation is that I want somebody to have *used* the thing"
- A vibe-coded project with 100 commits and comprehensive tests can be generated in 30 minutes
- Even the author can't tell if their own project is actually good
- The new trust signal: "if you've got a vibe coded thing which you have used every day for the past two weeks, that's much more valuable to me"

### 16. 🌐 The Sharing & Discovery Problem
- Apps become personal, situated, and frequent — hard to track, share, or maintain
- No ecosystem for versioning, security patches, or tool improvements
- **Matt Webb**: "When vibe-coding accelerates app development, apps become more personal, more situated, and more frequent. Shipping a tool is less like launching a website and more like posting on a blog."
- Proposed solution: RSS for vibe-coded apps (no consensus yet on format)

---

## Sources

- Karpathy, Andrej (2025). [Original tweet defining vibe coding](https://twitter.com/karpathy/status/1886192184808149383)
- Willison, Simon (2025). *"Not all AI-assisted programming is vibe coding (but vibe coding rocks)"*
- Willison, Simon (2026). *"Vibe coding and agentic engineering are getting closer than I'd like"*
- Webb, Matt (2026). *"We need RSS for sharing abundant vibe-coded apps"*
- Hacker News discussion on AI hospitalizations and reality loss
