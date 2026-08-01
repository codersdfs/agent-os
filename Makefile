.PHONY: build assemble list load match auto install clean

# Note: on Windows (no make), the pip entry points are the primary CLI:
#   pip install -e .   →   skill-list / skill-auto "query" / skill-build / skill-assemble

# Build: regenerate SKILL_INDEX.generated.md from skills/details/
build:
	python scripts/build_index.py

# Assemble: build + budget-check into ASSEMBLED_SYSTEM_PROMPT.txt
# (assemble_prompt.py runs build_index itself; do not run it twice)
assemble:
	python scripts/assemble_prompt.py

# List all available skills
list:
	python scripts/skill_loader.py --list

# Load a specific skill: make load SKILL=META_SKILL_FRAMEWORK
load:
	python scripts/skill_loader.py --load $(SKILL)

# Match a query: make match Q="how does the system work"
match:
	python scripts/skill_loader.py --match "$(Q)"

# Auto-mode: match + load top skills
auto:
	python scripts/skill_loader.py --auto "$(Q)"

# Install as a package (dependencies + entry points)
install:
	pip install -e .

# Clean generated files
clean:
	rm -f ASSEMBLED_SYSTEM_PROMPT.txt
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
