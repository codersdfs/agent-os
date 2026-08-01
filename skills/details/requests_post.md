---
skill_name: "REQUESTS_POST"
library_type: "public"
library_name: "requests"
locked_version: "2.31.0"
summary: "Executes HTTP POST with JSON auto-serialization"
depends_on: []
trigger_keywords: ["post", "http"]
---
# DETAIL TEMPLATE (AI MUST COPY THIS EXACTLY)
def post_request(url, json_payload=None, custom_headers=None, timeout=30):
    import requests
    response = requests.post(url, json=json_payload, headers=custom_headers, timeout=timeout)
    response.raise_for_status()
    return response.json()
