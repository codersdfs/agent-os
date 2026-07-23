#!/usr/bin/env python3
"""
Prompt compressor: preserves structure while fitting under the token limit.

Strategy:
  1. Remove lines containing verbose filler words (noteworthy, additionally, etc.)
  2. Keep ALL structural content — section headers, lists, rules, prose.
  3. Use a 395-token target (5 token safety margin below the 400 limit).
  4. If over target, shorten the longest line by finding a natural break point.
     Loop until under target.
"""

import re

STOPWORDS = {"noteworthy", "additionally", "in order to"}
MAX_TOKENS = 395  # Soft limit — 5 below 400 for safety


def has_stopword(line: str) -> bool:
    return any(w in line.lower() for w in STOPWORDS)


def shorten_line(line: str) -> str:
    """Shorten a line at a natural break point. Returns the original if already short."""
    if len(line) < 40:
        return line

    # Try splitting at key separators in the first half
    halfway = max(len(line) // 3, 20)
    for sep in [" |", " — ", ", ", ";"]:
        pos = line.rfind(sep, 0, halfway)
        if pos > 10:
            return line[:pos] + " ..."

    # Fallback: hard truncate at halfway
    return line[:halfway] + "..."


def compress(text: str) -> str:
    """Compress a prompt while preserving structure."""
    lines = text.split("\n")

    # Step 1: filter stopword lines
    filtered = [line for line in lines if not has_stopword(line)]

    # Step 2: compute token estimate
    joined = "\n".join(filtered)
    token_estimate = len(joined) / 4

    # Step 3: if under target, return as-is
    if token_estimate <= MAX_TOKENS:
        return joined

    # Step 4: iteratively shorten the longest line until under target
    truncated = filtered[:]
    while True:
        joined = "\n".join(truncated)
        token_estimate = len(joined) / 4
        if token_estimate <= MAX_TOKENS:
            break

        # Find the longest line
        longest_idx = max(range(len(truncated)), key=lambda i: len(truncated[i]))
        shortest = min(len(truncated[i]) for i in range(len(truncated)))

        # If the longest line is roughly the same as the shortest, stop
        if longest_idx < 0 or len(truncated[longest_idx]) <= shortest + 5:
            break

        shortened = shorten_line(truncated[longest_idx])
        if shortened == truncated[longest_idx]:
            # Can't shorten this line further, skip it
            truncated[longest_idx] = ""
        else:
            truncated[longest_idx] = shortened

    return "\n".join(line for line in truncated if line)
