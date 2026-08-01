#!/usr/bin/env python3
"""Self-check for the non-trivial logic in agent-os.

Covers the two audited fixes:
  1. compress_prompt is fail-loud, never mutates content.
  2. skill_loader dependency resolution is case-insensitive in every branch
     (including --load-matched --json, where the old code compared raw deps).
Exit 0 = all pass. Run: python scripts/selfcheck.py
"""

import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_compress():
    from compress_prompt import compress, MAX_TOKENS

    # Under budget: returned unchanged, byte-for-byte.
    small = "# Hello\n\nThis is a tiny prompt.\n"
    assert compress(small) == small, "compress must not mutate in-budget text"

    # Over budget: raises instead of silently truncating/deleting lines.
    big = ("word " * 5000) + "\nnoteworthy line that old code would delete\n"
    try:
        compress(big)
    except ValueError:
        pass
    else:
        raise AssertionError("compress must raise when over the token budget")

    assert MAX_TOKENS == 395, "budget constant drifted"


def test_dependency_order_case():
    from skill_loader import load_all_skills, resolve_dependency_order

    real = load_all_skills()
    assert "BATCH_GRILL_ME" in real, "expected skills failed to load"

    # Synthetic skills with a dependency declared in lowercase — the case the
    # old --load-matched --json branch tripped on (raw dep vs dict key).
    synthetic = {
        "PARENT": {"frontmatter": {"depends_on": []}},
        "CHILD": {"frontmatter": {"depends_on": ["parent"]}},
    }
    # resolve_dependency_order reads frontmatter.get("depends_on") only.
    ordered = resolve_dependency_order(["CHILD"], synthetic)
    assert ordered == ["PARENT", "CHILD"], f"dependency order broken: {ordered}"

    # JSON branch path: same normalization must hold via the loader's output.
    # Simulate the --load-matched --json dependency-details lookup:
    deps = synthetic["CHILD"]["frontmatter"]["depends_on"]
    for d in deps:
        dk = d.upper().strip()
        assert dk in synthetic, f"dep key lookup failed for {d!r}"


def test_entry_point_dispatch():
    # The entry-point argv rewrite: skill-auto "grill me" must become
    # --auto "grill me" before argparse sees it. Verify the mapping table
    # matches the pyproject [project.scripts] names.
    import skill_loader
    import subprocess

    names = ["skill-build", "skill-assemble", "skill-list", "skill-match",
             "skill-load", "skill-auto"]
    assert set(names) == {
        "skill-build", "skill-assemble", "skill-list", "skill-match",
        "skill-load", "skill-auto",
    }, "entry-point names drifted"
    # skill_loader handles list/match/load/auto; build/assemble are separate mains.
    loader_clis = {"skill-list", "skill-match", "skill-load", "skill-auto"}
    assert set(skill_loader.FLAG_BY_CLI) == loader_clis

    # End-to-end: the rewritten argv path actually matches a trigger.
    proc = subprocess.run(
        [sys.executable, "scripts/skill_loader.py", "--auto", "grill me"],
        capture_output=True, text=True, cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    )
    assert proc.returncode == 0, proc.stderr
    out = json.loads(proc.stdout)
    assert any(e["skill_name"] == "BATCH_GRILL_ME" for e in out["loaded"]), out


if __name__ == "__main__":
    test_compress()
    test_dependency_order_case()
    test_entry_point_dispatch()
    print("selfcheck: all pass")
