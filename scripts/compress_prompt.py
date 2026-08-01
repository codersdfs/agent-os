#!/usr/bin/env python3
"""
Prompt budget check: enforce the <=400-token system-prompt limit.

Deliberately a *check*, not a mangler. Older versions of this file deleted
stopword lines and truncated prose to fit the budget — silently destroying
content that could be load-bearing. If the assembled prompt is over budget,
we fail loudly and let the author shorten the template. That is the honest
reading of D-4: no AI negotiation, no silent mutation.

The estimate is len(text)/4 — advisory, not a real tokenizer. It is
intentionally conservative for prose; code-heavy content estimates low, so
treat the number as a floor for review, not a guarantee.
"""

import re

MAX_TOKENS = 395  # 5-token safety margin below the 400 limit

# Real tokenizers differ; chars/4 is the documented estimate. When budgets
# actually matter, swap estimate() for tiktoken and keep the fail-loud check.


def estimate_tokens(text: str) -> float:
    """Advisory token estimate: characters / 4."""
    return len(text) / 4


def compress(text: str) -> str:
    """Return text unchanged if within budget; raise if over. No mutation."""
    estimate = estimate_tokens(text)
    if estimate > MAX_TOKENS:
        raise ValueError(
            f"assembled prompt ~{int(estimate)} tokens exceeds the {MAX_TOKENS}-token "
            f"budget (chars/4 estimate). Shorten the template or skill summaries — "
            f"the compressor no longer truncates content."
        )
    return text
