#!/usr/bin/env node
/* compress_check.js — prompt budget check: enforce the <=400-token system
   prompt limit. Deliberately a *check*, not a mangler (audit verdict): if the
   assembled prompt is over budget, fail loudly and let the author shorten the
   template. No silent content destruction.

   The estimate is chars/4 — advisory, not a real tokenizer. Conservative for
   prose; code-heavy content estimates low. Treat as a floor for review. */
const MAX_TOKENS = 395; // 5-token safety margin below the 400 limit

function estimateTokens(text) {
  return text.length / 4;
}

function check(text) {
  const est = estimateTokens(text);
  if (est > MAX_TOKENS) {
    throw new Error(
      `assembled prompt ~${Math.round(est)} tokens exceeds the ${MAX_TOKENS}-token ` +
      `budget (chars/4 estimate). Shorten the template or skill summaries — ` +
      `the compressor no longer truncates content.`
    );
  }
  return text;
}

module.exports = { MAX_TOKENS, estimateTokens, check };
