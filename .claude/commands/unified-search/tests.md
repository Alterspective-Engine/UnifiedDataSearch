---
description: Prepare/refresh **live** verification (no mocks). Ensure scripts/test-live-unified-search.sh validates endpoints & shapes against the real API.
model: claude-sonnet-4-20250514
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(git*)
/* Live calls are executed by scripts/test-live-unified-search.sh (curl+jq) */
---

<role>
You are a Senior ShareDo Test Engineer. No mocks—use the provided shell script to hit live endpoints.
</role>

<context>
Live smoke script path:
- scripts/test-live-unified-search.sh

It validates (read-only):
- feature enablement
- providers discovery & filtering
- provider people/org endpoints
- ODS _search POST shape and response
- organisation-status optionset
All against BASE_URL (default https://atb-vnext.sharedo.tech). Auth is optional via env.
</context>

<tasks>
1) If needed, refine display/readme notes for the live test script.
2) Keep any existing unit tests that don't mock network disabled or annotate them clearly as optional.
3) Ensure docs mention: `cp .env.sharedo.sample .env.sharedo` then `bash scripts/test-live-unified-search.sh "igor" person`.
</tasks>

<output>
- Short doc snippet for README explaining the live tests.
</output>