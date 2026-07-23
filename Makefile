.PHONY: build assemble list load clean install

# Build: regenerate SKILL_INDEX.generated.md from skills/details/
build:
	python scripts/build_index.py

# Assemble: build + compress into ASSEMBLED_SYSTEM_PROMPT.txt
assemble:
	python scripts/build_index.py
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

# Install Python dependencies
install:
	pip install pyyaml

# Clean generated files
clean:
	rm -f ASSEMBLED_SYSTEM_PROMPT.txt
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
