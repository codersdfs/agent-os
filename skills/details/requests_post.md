---
skill_name: "REQUESTS_POST"
library_type: "internal"
summary: "HTTP POST helper using Node.js native fetch()"
depends_on: []
trigger_keywords: ["post", "http", "http post"]
---
# REQUESTS_POST — HTTP POST with Node.js native fetch

A simple utility for making HTTP POST requests in Node.js 18+. No external deps needed.

## Usage

```js
async function postRequest(url, payload, headers = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
```

## Notes
- Node 18+ has native `fetch`; no dependency needed.
- `timeoutMs` defaults to 30 s via AbortController.
