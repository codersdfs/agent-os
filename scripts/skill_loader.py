#!/usr/bin/env python3
"""
Skill Loader — runtime skill activation for a coding agent.

Scans /skills/details/, parses frontmatter + content, and provides:
  - Trigger matching: which skills activate based on user input
  - Dependency ordering: load skills in the right order
  - Content retrieval: get the full detail text for a skill

CLI usage:
  python scripts/skill_loader.py --match "how does this system work"
  python scripts/skill_loader.py --load META_SKILL_FRAMEWORK
  python scripts/skill_loader.py --list
  python scripts/skill_loader.py --match "http post" --load-matched
"""

import os
import sys
import re
import json
import glob
import argparse
import io

# Force UTF-8 output for cross-platform compatibility
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    import yaml
except ImportError:
    print("pip install pyyaml", file=sys.stderr)
    sys.exit(1)

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPTS_DIR)
DETAILS_DIR = os.path.join(PROJECT_DIR, "skills", "details")


def parse_frontmatter_and_body(filepath):
    """
    Parse a skill detail .md file.
    Returns (frontmatter_dict, body_markdown) or (None, None).
    """
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if not content.startswith("---"):
        return None, None

    parts = content.split("---", 2)
    if len(parts) < 3:
        return None, None

    try:
        frontmatter = yaml.safe_load(parts[1])
    except yaml.YAMLError:
        return None, None

    body = parts[2].strip()
    return frontmatter, body


def load_all_skills(details_dir=None):
    """
    Scan details_dir and return a dict:
      {skill_name: {
          "filepath": str,
          "frontmatter": dict,
          "body": str,
          "full_text": str
      }}
    """
    if details_dir is None:
        details_dir = DETAILS_DIR

    if not os.path.isdir(details_dir):
        print(f"Error: details directory not found: {details_dir}", file=sys.stderr)
        return {}

    skills = {}
    md_files = glob.glob(os.path.join(details_dir, "**", "*.md"), recursive=True)

    for filepath in sorted(md_files):
        fm, body = parse_frontmatter_and_body(filepath)
        if fm is None:
            continue

        skill_name = fm.get("skill_name")
        if not skill_name:
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            full_text = f.read()

        skills[skill_name] = {
            "filepath": filepath,
            "frontmatter": fm,
            "body": body,
            "full_text": full_text,
        }

    return skills


def build_trigger_index(skills):
    """
    Build a reverse index: {lowercase_trigger: [skill_name, ...]}
    from each skill's trigger_keywords frontmatter field.
    """
    trigger_map = {}
    for skill_name, info in skills.items():
        keywords = info["frontmatter"].get("trigger_keywords", [])
        if not keywords:
            continue
        for kw in keywords:
            key = kw.lower().strip()
            if key not in trigger_map:
                trigger_map[key] = []
            trigger_map[key].append(skill_name)
    return trigger_map


def match_input(user_input, skills):
    """
    Given a string, return a list of (skill_name, score) tuples
    ranked by trigger keyword match relevance.

    Scoring:
      - Exact phrase match: +10 per hit
      - Word-level match: +3 per hit
      - Substring match: +1 per hit
    """
    trigger_map = build_trigger_index(skills)
    if not trigger_map:
        return []

    input_lower = user_input.lower()
    scores = {}

    for trigger, skill_names in trigger_map.items():
        # Exact phrase match
        if trigger in input_lower:
            for sn in skill_names:
                scores[sn] = scores.get(sn, 0) + 10
            continue

        # Word-level match (trigger is a single word)
        trigger_words = trigger.split()
        input_words = set(input_lower.split())
        for tw in trigger_words:
            if tw in input_words:
                for sn in skill_names:
                    scores[sn] = scores.get(sn, 0) + 3
            elif len(tw) > 2 and tw in input_lower:
                # Substring match (only for words > 2 chars)
                for sn in skill_names:
                    scores[sn] = scores.get(sn, 0) + 1

    # Sort by score descending
    ranked = sorted(scores.items(), key=lambda x: -x[1])
    return ranked


def resolve_dependency_order(skill_names, skills):
    """
    Given a list of skill names, return them in dependency-safe order.
    Raises ValueError on circular dependency.
    """
    ordered = []
    visited = set()
    in_progress = set()

    def visit(name):
        if name in visited:
            return
        if name in in_progress:
            raise ValueError(f"Circular dependency detected involving '{name}'")
        if name not in skills:
            return  # Unknown skill, skip

        in_progress.add(name)
        deps = skills[name]["frontmatter"].get("depends_on", [])
        for dep in deps:
            visit(dep.upper().strip())
        in_progress.discard(name)
        visited.add(name)
        ordered.append(name)

    for name in skill_names:
        visit(name)

    return ordered


def format_skill_output(skill_name, info, include_frontmatter=False):
    """Format a skill for output."""
    if include_frontmatter:
        return info["full_text"]
    return info["body"]


# Entry-point UX: `skill-match "q"` / `skill-auto "q"` / `skill-load NAME` /
# `skill-list` (from [project.scripts]) inject their subcommand flag so the
# user doesn't need to type it twice. Module-level so selfcheck can verify it.
FLAG_BY_CLI = {
    "skill-match": "--match",
    "skill-auto": "--auto",
    "skill-load": "--load",
    "skill-list": "--list",
}


def main():
    _INVOKED = os.path.basename(sys.argv[0]).lower().removesuffix(".exe")
    flag = FLAG_BY_CLI.get(_INVOKED)
    if flag and flag not in sys.argv:
        sys.argv = [sys.argv[0], flag] + sys.argv[1:]

    parser = argparse.ArgumentParser(description="Skill Loader — activate skills by trigger keywords")
    parser.add_argument("--list", action="store_true", help="List all available skills")
    parser.add_argument("--match", type=str, help="Match user input against trigger keywords")
    parser.add_argument("--load", type=str, nargs="+", help="Load one or more skills by name")
    parser.add_argument("--load-matched", action="store_true",
                        help="After --match, load the matched skills (up to --max)")
    parser.add_argument("--max", type=int, default=3,
                        help="Max skills to load via --load-matched (default: 3)")
    parser.add_argument("--details-dir", type=str, default=None,
                        help=f"Override skills details directory (default: {DETAILS_DIR})")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--with-frontmatter", action="store_true",
                        help="Include YAML frontmatter in skill output")
    parser.add_argument("--auto", type=str,
                        help="Full auto mode: match user input, load top skills, print all content")

    args = parser.parse_args()

    skills = load_all_skills(args.details_dir)

    if args.list:
        if args.json:
            output = {sn: {
                "summary": info["frontmatter"].get("summary", ""),
                "library_type": info["frontmatter"].get("library_type", "unknown"),
                "depends_on": info["frontmatter"].get("depends_on", []),
                "triggers": info["frontmatter"].get("trigger_keywords", []),
            } for sn, info in skills.items()}
            print(json.dumps(output, indent=2))
        else:
            for skill_name, info in skills.items():
                fm = info["frontmatter"]
                tag = "[PUBLIC_LIB]" if fm.get("library_type") == "public" else "[INTERNAL]"
                summary = fm.get("summary", "No summary")
                deps = fm.get("depends_on", [])
                deps_str = ", ".join(deps) if deps else "None"
                print(f"  {tag} {skill_name} | {summary} | Depends: {deps_str}")
        return

    if args.match:
        ranked = match_input(args.match, skills)
        if args.json:
            print(json.dumps([{"skill": sn, "score": sc} for sn, sc in ranked], indent=2))
        else:
            if not ranked:
                print("No matching skills found.")
                return
            print(f"Matched skills for \"{args.match}\":")
            for sn, score in ranked:
                summary = skills[sn]["frontmatter"].get("summary", "")
                print(f"  [{score:2d}] {sn} — {summary}")

        if args.load_matched:
            top_names = [sn for sn, _ in ranked[:args.max]]
            ordered = resolve_dependency_order(top_names, skills)
            if args.json:
                output = {}
                for sn in ordered:
                    output[sn] = format_skill_output(sn, skills[sn], args.with_frontmatter)
                    # Include dependency chain info
                    deps = skills[sn]["frontmatter"].get("depends_on", [])
                    if deps:
                        dep_texts = {}
                        for d in deps:
                            dk = d.upper().strip()
                            if dk in skills:
                                dep_texts[dk] = skills[dk]["body"]
                        output[f"{sn}___dependency_details"] = dep_texts
                print(json.dumps(output, indent=2))
            else:
                print(f"\n--- Loading {len(ordered)} skill(s) in dependency order ---\n")
                for sn in ordered:
                    print(f"=== {sn} ===")
                    print(format_skill_output(sn, skills[sn], args.with_frontmatter))
                    print()
        return

    if args.auto:
        # Full auto mode: single entry point for coding agents
        ranked = match_input(args.auto, skills)
        top_names = [sn for sn, _ in ranked[:args.max]]
        ordered = resolve_dependency_order(top_names, skills)
        result = {
            "matched": [{"skill": sn, "score": sc} for sn, sc in ranked[:args.max]],
            "loaded": [],
        }
        for sn in ordered:
            info = skills[sn]
            entry = {
                "skill_name": sn,
                "summary": info["frontmatter"].get("summary", ""),
                "library_type": info["frontmatter"].get("library_type", "unknown"),
                "body": format_skill_output(sn, info, args.with_frontmatter),
                "depends_on": info["frontmatter"].get("depends_on", []),
            }
            result["loaded"].append(entry)
        print(json.dumps(result, indent=2))
        return

    if args.load:
        ordered = resolve_dependency_order([n.upper().strip() for n in args.load], skills)
        if args.json:
            output = {}
            for sn in ordered:
                output[sn] = format_skill_output(sn, skills[sn], args.with_frontmatter)
            print(json.dumps(output, indent=2))
        else:
            for sn in ordered:
                print(f"=== {sn} ===")
                print(format_skill_output(sn, skills[sn], args.with_frontmatter))
                print()
        return

    # Default: list
    if args.json:
        print(json.dumps({sn: {"summary": info["frontmatter"].get("summary", "")}
                          for sn, info in skills.items()}, indent=2))
    else:
        print("Available skills:")
        for skill_name, info in skills.items():
            summary = info["frontmatter"].get("summary", "")
            print(f"  {skill_name} — {summary}")


if __name__ == "__main__":
    main()
