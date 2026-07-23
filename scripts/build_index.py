#!/usr/bin/env python3
"""Build skill index from YAML frontmatter in /skills/details/*.md files."""

import os
import sys
import glob

try:
    import yaml
except ImportError:
    print("pip install pyyaml")
    sys.exit(1)


SKILLS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills", "details")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills", "generated")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "SKILL_INDEX.generated.md")


def parse_frontmatter(filepath):
    """Parse YAML frontmatter from a markdown file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if not content.startswith("---"):
        return None

    # Split on --- to extract frontmatter
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None

    frontmatter = yaml.safe_load(parts[1])
    return frontmatter


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    md_files = glob.glob(os.path.join(SKILLS_DIR, "**", "*.md"), recursive=True)

    if not md_files:
        print("No .md files found in skills/details/")
        sys.exit(0)

    bullets = []

    for filepath in sorted(md_files):
        fm = parse_frontmatter(filepath)
        if fm is None:
            continue

        skill_name = fm.get("skill_name", "UNKNOWN")
        library_type = fm.get("library_type", "unknown")
        summary = fm.get("summary", "")
        depends_on = fm.get("depends_on", [])

        # Hard rule: public skills must have locked_version
        if library_type == "public" and "locked_version" not in fm:
            print(f"ERROR: missing locked_version for {skill_name}")
            sys.exit(1)

        tag = "[PUBLIC_LIB]" if library_type == "public" else "[INTERNAL]"
        depends_str = ", ".join(depends_on) if depends_on else "None"
        line = f"- {tag} {skill_name} | {summary} | Depends: {depends_str}"
        bullets.append(line)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(bullets) + "\n")


if __name__ == "__main__":
    main()
