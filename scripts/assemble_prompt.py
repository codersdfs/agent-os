#!/usr/bin/env python3
"""
Assemble a system prompt from the skill index.

Pipeline:
  1. Run build_index.py to ensure SKILL_INDEX.generated.md is fresh.
  2. Optionally read a base prompt template (BASE_SYSTEM_PROMPT.txt).
  3. Inject the index into the {INSERT_GENERATED_INDEX_HERE} placeholder (if template exists).
  4. Run compression to enforce <=400 token limit.
  5. Write the assembled prompt.

Usage:
  python scripts/assemble_prompt.py                    # write to file + stderr
  python scripts/assemble_prompt.py --stdout-only      # print only
  python scripts/assemble_prompt.py --output FILE.txt   # custom output path
  python scripts/assemble_prompt.py --template path/to/template.txt
"""

import os
import sys
import subprocess
import argparse

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPTS_DIR)
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)

SKILLS_GENERATED_DIR = os.path.join(PROJECT_DIR, "skills", "generated")
INDEX_PATH = os.path.join(SKILLS_GENERATED_DIR, "SKILL_INDEX.generated.md")
DEFAULT_OUTPUT_PATH = os.path.join(PROJECT_DIR, "ASSEMBLED_SYSTEM_PROMPT.txt")
PLACEHOLDER = "{INSERT_GENERATED_INDEX_HERE}"

DEFAULT_TEMPLATE = """[SKILL_INDEX]
{INSERT_GENERATED_INDEX_HERE}
"""


def run_build_index():
    """Run build_index.py to regenerate the skill index."""
    build_script = os.path.join(SCRIPTS_DIR, "build_index.py")
    if not os.path.exists(build_script):
        print(f"Warning: {build_script} not found. Skipping index build.", file=sys.stderr)
        return

    result = subprocess.run(
        [sys.executable, build_script],
        capture_output=True, text=True, cwd=PROJECT_DIR
    )
    if result.returncode != 0:
        print(f"Error: build_index.py failed:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)
    if result.stdout:
        print(result.stdout.rstrip(), file=sys.stderr)


def read_index() -> str:
    """Read the generated skill index."""
    if not os.path.exists(INDEX_PATH):
        print(f"Error: SKILL_INDEX not found at {INDEX_PATH}. Run build_index.py first.", file=sys.stderr)
        sys.exit(1)

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        return f.read()


def read_template(path: str | None) -> str:
    """Read the base prompt template, or return the default if none given."""
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    if path:
        print(f"Warning: template not found at {path}, using default.", file=sys.stderr)
    return DEFAULT_TEMPLATE


def inject_index(template: str, index_text: str) -> str:
    """Replace the placeholder with the actual skill index."""
    if PLACEHOLDER not in template:
        print(f"Warning: Placeholder '{PLACEHOLDER}' not found in template.", file=sys.stderr)
        print(f"Injecting index after [SKILL_INDEX] header.", file=sys.stderr)
        template = template.replace("[SKILL_INDEX]\n", f"[SKILL_INDEX]\n{index_text}\n")
        return template

    return template.replace(PLACEHOLDER, index_text.rstrip("\n"))


def assemble(template_path: str | None = None) -> str:
    """Run the full assembly pipeline and return the final prompt text."""
    run_build_index()
    base = read_template(template_path)
    index_text = read_index()
    with_index = inject_index(base, index_text)
    from compress_prompt import compress
    return compress(with_index)


def main():
    parser = argparse.ArgumentParser(description="Assemble the meta-skill framework system prompt.")
    parser.add_argument("--output", "-o", type=str, default=None,
                        help=f"Output file path (default: {DEFAULT_OUTPUT_PATH})")
    parser.add_argument("--stdout-only", action="store_true",
                        help="Print to stdout only, don't write to a file")
    parser.add_argument("--template", "-t", type=str, default=None,
                        help="Path to a base prompt template with {INSERT_GENERATED_INDEX_HERE}")
    args = parser.parse_args()

    final_prompt = assemble(args.template)

    if args.stdout_only:
        print(final_prompt)
        return

    output_path = args.output or DEFAULT_OUTPUT_PATH
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_prompt.rstrip("\n") + "\n")

    print(f"Assembled system prompt written to: {output_path}", file=sys.stderr)
    token_estimate = len(final_prompt) / 4
    print(f"Final prompt: {len(final_prompt)} chars (~{int(token_estimate)} tokens)", file=sys.stderr)


if __name__ == "__main__":
    main()
