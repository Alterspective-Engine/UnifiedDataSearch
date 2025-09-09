#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# --- Helpers ---------------------------------------------------------------
backup_if_exists() {
  local f="$1"
  if [[ -f "$f" ]]; then
    cp -f "$f" "$f.bak.$(date +%Y%m%d%H%M%S)"
    echo "Backed up existing $f -> $f.bak.*"
  fi
}

ensure_dir() {
  mkdir -p "$1"
}

write_file() {
  local path="$1"
  local content="$2"
  backup_if_exists "$path"
  printf "%s" "$content" > "$path"
  echo "Wrote $path"
}

# --- Create folders --------------------------------------------------------
ensure_dir "$ROOT_DIR/.claude/commands/unified-search"
ensure_dir "$ROOT_DIR/scripts"

# --- review.md (no-mocks) --------------------------------------------------
read -r -d '' REVIEW_MD <<'EOF'
---
description: Analyze and verify Unified Search (ODS + external provider) in the Sharedo IDE with live-API expectations (no mocks).
argument-hint: [optional searchTerm]
model: claude-sonnet-4-20250514
allowed-tools: Read, Grep, Glob, Bash(git*)
/* Keep tools lean; live checks are performed by scripts/test-live-unified-search.sh */
---

<role>
You are a Senior ShareDo Frontend Architect. Be precise, cite file paths, and propose minimal diffs.
</role>

<context>
Repo paths to inspect (already present):
- @Blades/UnifiedOdsPmsSearch/blade.js
- @Blades/UnifiedOdsPmsSearch/blade.html
- @Services/SearchApiService.js
- @Services/UnifiedSearchService.js
- @Services/ResultMergerService.js
- @Services/OdsImportService.js
- @Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.js
- @Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.html
- @tests/unified-search-parity.test.js
- @docs/README.md

APIs (live; validated by scripts/test-live-unified-search.sh):
- GET  /api/featureFramework/ods-external-search/isEnabled
- GET  /api/ods/externalSearch/providers/enabled
- GET  /api/ods/externalSearch/providers/{systemName}/{people|organisations}?page=0&q={query}
- POST /api/ods/_search
- GET  /api/ods/optionsets/organisation-status
</context>

<what-to-verify>
1) Single Source of Truth:
   - Widget and Blade both call UnifiedSearchService.searchUnified(...)
   - SearchApiService is the sole place posting to /api/ods/_search

2) Config-driven scope:
   - Honors entityTypes: ["person"], ["organisation"], or both
   - Inline widget and blade return identical merged datasets for identical inputs

3) External provider enablement & filtering:
   - Respect /featureFramework/.../isEnabled and /providers/enabled
   - Filter providers by canSearchPeople/canSearchOrganisations

4) Merging & discrepancies:
   - ResultMergerService matches first by providersReference ↔ ODS reference/custom field
   - Heuristics: person(name+dob/email/phone), org(normalized name + company number/ABN)
   - Conflicts array enumerates differing fields; “Edit in Sharedo” action wired

5) Auto-add (configurable):
   - On selection, create ODS entity (people/org) with external providersReference persisted
   - Map locations/contactDetails
   - Duplicate check invoked and surfaced

6) Live checks:
   - All live validations are executed via scripts/test-live-unified-search.sh (no mocks).
</what-to-verify>

<steps>
1) Read all listed files and sketch data flow.
2) Confirm Widget & Blade call the same UnifiedSearchService method.
3) Review provider enablement and filtering logic.
4) Review ResultMergerService for match & conflict rules.
5) Confirm selection → optional auto-import path exists and is guarded by config.
6) Produce a Findings report and minimal, surgical diffs per file.
</steps>

<acceptance-tests>
- [ ] Widget and Blade call UnifiedSearchService.searchUnified(...)
- [ ] Only SearchApiService posts to /api/ods/_search
- [ ] External enablement respected; providers filtered by capability
- [ ] Conflicts computed where values differ; “Edit in Sharedo” wired
- [ ] Auto-add persists providersReference and re-checks duplicates
- [ ] scripts/test-live-unified-search.sh completes without failures against the live API
</acceptance-tests>

<output>
1) Findings (with file paths)
2) Minimal diffs (patch blocks per file)
3) Notes for any config toggles affecting live tests
</output>

<style>
- Be surgical; retain existing namespaces under Alt.UnifiedDataSearch.*
- Keep deltas minimal and production-safe
</style>
EOF

# --- implement.md (no-mocks) ----------------------------------------------
read -r -d '' IMPLEMENT_MD <<'EOF'
---
description: Implement/refactor Unified Search per spec; keep minimal diffs; no mocks—live smoke checks handled by scripts/test-live-unified-search.sh.
argument-hint: [mode=unified|odsOnly|externalOnly] [types=person|organisation|both]
model: claude-sonnet-4-20250514
allowed-tools: Read, Edit, Write, Grep, Glob, Bash(git*)
---

<role>
You are a Senior ShareDo Frontend Architect writing production-quality, minimal diffs.
</role>

<inputs>
- mode: $1 (default unified)
- types: $2 (default both)
</inputs>

<context>
Key files:
- @Services/SearchApiService.js
- @Services/UnifiedSearchService.js
- @Services/ResultMergerService.js
- @Services/OdsImportService.js
- @Blades/UnifiedOdsPmsSearch/blade.js
- @Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.js

Live APIs (do not mock):
- GET  /api/featureFramework/ods-external-search/isEnabled
- GET  /api/ods/externalSearch/providers/enabled
- GET  /api/ods/externalSearch/providers/{systemName}/{people|organisations}?page={n}&q={q}
- POST /api/ods/_search
- GET  /api/ods/optionsets/organisation-status
</context>

<requirements>
1) Single-source-of-truth orchestration via UnifiedSearchService calling SearchApiService (ODS) + external (when enabled).
2) Honors entityTypes (people|organisations|both) and paging.
3) Widget & Blade both invoke UnifiedSearchService.searchUnified({ query, entityTypes, rowsPerPage, page, mode }).
4) ResultMergerService:
   - Match by providersReference ↔ ODS reference/aspect first;
   - Fallback heuristics (person: name+dob/email/phone; org: normalized name + companyNo/ABN);
   - conflicts[] = { field, odsValue, externalValue }.
5) Auto-add (configurable):
   - Map fields, locations, contactDetails;
   - Persist providersReference in ODS (reference or configured aspect);
   - Duplicate check invoked and surfaced in UI.
6) Error-handling & UX: debounced inline queries, paged external calls, user-friendly failure states.
</requirements>

<output>
- Minimal patch blocks per file.
- Short runbook: how to trigger inline vs blade search, and how to run scripts/test-live-unified-search.sh for verification.
</output>
EOF

# --- tests.md (live tests only) -------------------------------------------
read -r -d '' TESTS_MD <<'EOF'
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
2) Keep any existing unit tests that don’t mock network disabled or annotate them clearly as optional.
3) Ensure docs mention: `cp .env.sharedo.sample .env.sharedo` then `bash scripts/test-live-unified-search.sh "igor" person`.
</tasks>

<output>
- Short doc snippet for README explaining the live tests.
</output>
EOF

# --- live smoke test script ------------------------------------------------
read -r -d '' LIVE_TEST <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# Live API smoke checks for Unified Search (NO MOCKS)
#   Usage:
#     bash scripts/test-live-unified-search.sh [query] [entityType]
#   Defaults:
#     query="igor"
#     entityType="person"    # one of: person | organisation | both
# ---------------------------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load env if present
ENV_FILE="$ROOT_DIR/.env.sharedo"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

BASE_URL="${BASE_URL:-https://atb-vnext.sharedo.tech}"
QUERY="${1:-igor}"
ENTITY_TYPE="${2:-person}"   # person | organisation | both

# Optional auth:
#   AUTH_BEARER="eyJ..."   (adds Authorization: Bearer)
#   SHARED0_COOKIE="name=value; other=value"  (adds Cookie:)
#   EXTRA_HEADERS="X-Whatever: 1"
AUTH_HEADER=()
COOKIE_HEADER=()
EXTRA_HEADER=()

[[ -n "${AUTH_BEARER:-}" ]] && AUTH_HEADER=(-H "Authorization: Bearer ${AUTH_BEARER}")
[[ -n "${SHARED0_COOKIE:-}" ]] && COOKIE_HEADER=(-H "Cookie: ${SHARED0_COOKIE}")
[[ -n "${EXTRA_HEADERS:-}" ]] && EXTRA_HEADER=(-H "${EXTRA_HEADERS}")

need_tool() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' is required."; exit 1; }
}

need_tool curl
need_tool jq

pass=true
fail() { echo "❌ $*"; pass=false; }
ok()   { echo "✅ $*"; }

get() {
  local url="$1"
  curl -sS -f "${AUTH_HEADER[@]}" "${COOKIE_HEADER[@]}" "${EXTRA_HEADER[@]}" \
    -H "Accept: application/json" \
    "$url"
}

post_json() {
  local url="$1"
  local json_payload="$2"
  curl -sS -f "${AUTH_HEADER[@]}" "${COOKIE_HEADER[@]}" "${EXTRA_HEADER[@]}" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -d "$json_payload" \
    "$url"
}

echo "=== Live Unified Search Smoke ==="
echo "BASE_URL:   $BASE_URL"
echo "QUERY:      $QUERY"
echo "ENTITY_TYPE:$ENTITY_TYPE"
echo

# 1) External search feature enablement
echo "[1] GET /api/featureFramework/ods-external-search/isEnabled"
if resp=$(get "$BASE_URL/api/featureFramework/ods-external-search/isEnabled"); then
  isEnabled=$(echo "$resp" | jq -r '.isEnabled // empty')
  if [[ -z "$isEnabled" ]]; then fail "isEnabled missing"; else ok "isEnabled=$isEnabled"; fi
else
  fail "feature enablement endpoint failed"
fi
echo

# 2) Providers discovery
echo "[2] GET /api/ods/externalSearch/providers/enabled"
if providers=$(get "$BASE_URL/api/ods/externalSearch/providers/enabled"); then
  count=$(echo "$providers" | jq 'length')
  ok "providers length=$count"
  # Pick first people-capable and org-capable providers if present
  peopleProvider=$(echo "$providers" | jq -r '[.[] | select(.canSearchPeople==true)][0].systemName // empty')
  orgProvider=$(echo "$providers"    | jq -r '[.[] | select(.canSearchOrganisations==true)][0].systemName // empty')
  [[ -n "$peopleProvider" ]] && ok "people provider: $peopleProvider" || echo "ℹ️  no people-capable provider"
  [[ -n "$orgProvider"    ]] && ok "organisation provider: $orgProvider" || echo "ℹ️  no org-capable provider"
else
  fail "providers endpoint failed"
fi
echo

# 3) Provider search (people)
if [[ "${ENTITY_TYPE}" == "person" || "${ENTITY_TYPE}" == "both" ]]; then
  if [[ -n "${peopleProvider:-}" ]]; then
    echo "[3] GET provider people search (page=0&q=$QUERY)"
    if pResp=$(get "$BASE_URL/api/ods/externalSearch/providers/${peopleProvider}/people?page=0&q=$(printf "%s" "$QUERY" | jq -sRr @uri)"); then
      total=$(echo "$pResp" | jq -r '.totalResults // 0')
      rows=$(echo "$pResp" | jq -r '.rowsPerPage // 0')
      cur=$(echo "$pResp" | jq -r '.currentPage // 0')
      resType=$(echo "$pResp" | jq -r '(.results | type) // empty')
      [[ "$resType" == "array" ]] && ok "provider people results array (total=$total, rowsPerPage=$rows, currentPage=$cur)" || fail "provider people results not array"
    else
      fail "provider people search failed"
    fi
    echo
  fi
fi

# 4) Provider search (organisations)
if [[ "${ENTITY_TYPE}" == "organisation" || "${ENTITY_TYPE}" == "both" ]]; then
  if [[ -n "${orgProvider:-}" ]]; then
    echo "[4] GET provider organisations search (page=0&q=$QUERY)"
    if oResp=$(get "$BASE_URL/api/ods/externalSearch/providers/${orgProvider}/organisations?page=0&q=$(printf "%s" "$QUERY" | jq -sRr @uri)"); then
      total=$(echo "$oResp" | jq -r '.totalResults // 0')
      resType=$(echo "$oResp" | jq -r '(.results | type) // empty')
      [[ "$resType" == "array" ]] && ok "provider org results array (total=$total)" || fail "provider org results not array"
    else
      fail "provider organisations search failed"
    fi
    echo
  fi
fi

# 5) ODS unified search POST (person/org)
ods_type_payload() {
  local t="$1"            # person | organisation
  cat <<JSON
{
  "startPage": 1,
  "endPage": 1,
  "rowsPerPage": 10,
  "searchString": "$QUERY",
  "odsEntityTypes": ["$t"],
  "availability": {"isAvailable": null,"isOutOfOffice": null,"isNotAvailable": null},
  "location": {"postcode": null,"range": 10},
  "connection": {"systemName": null,"label": null,"otherOdsIds": []},
  "competencies": [],
  "teams": [],
  "roles": [],
  "odsTypes": [],
  "wallManagement": false
}
JSON
}

post_ods_search() {
  local t="$1"
  echo "[5] POST /api/ods/_search (type=$t)"
  local payload
  payload="$(ods_type_payload "$t")"
  if sResp=$(post_json "$BASE_URL/api/ods/_search" "$payload"); then
    rowsType=$(echo "$sResp" | jq -r '(.rows | type) // empty')
    [[ "$rowsType" == "array" ]] && ok "ODS _search rows is array (type=$t)" || fail "ODS _search rows not array (type=$t)"
  else
    fail "ODS _search failed (type=$t)"
  fi
  echo
}

if [[ "${ENTITY_TYPE}" == "person" || "${ENTITY_TYPE}" == "both" ]]; then
  post_ods_search "person"
fi
if [[ "${ENTITY_TYPE}" == "organisation" || "${ENTITY_TYPE}" == "both" ]]; then
  post_ods_search "organisation"
fi

# 6) Optionset check
echo "[6] GET /api/ods/optionsets/organisation-status"
if opt=$(get "$BASE_URL/api/ods/optionsets/organisation-status"); then
  valCount=$(echo "$opt" | jq '.optionSetValueProperties | length')
  [[ "$valCount" -gt 0 ]] && ok "organisation-status optionSet has $valCount values" || fail "organisation-status has no values"
else
  fail "organisation-status endpoint failed"
fi

# 7) Optional: widget HTML presence (best-effort)
echo "[7] GET /_pluginfiles/atbplugin/widgets/externalodssearch/resultwidget.html (optional)"
if curl -sS -f -I "${AUTH_HEADER[@]}" "${COOKIE_HEADER[@]}" "${EXTRA_HEADER[@]}" "$BASE_URL/_pluginfiles/atbplugin/widgets/externalodssearch/resultwidget.html" >/dev/null; then
  ok "resultwidget.html reachable"
else
  echo "ℹ️  resultwidget.html not reachable (optional)"
fi

echo
if $pass; then
  echo "✅ LIVE SMOKE CHECKS PASSED"
  exit 0
else
  echo "❌ LIVE SMOKE CHECKS FAILED"
  exit 1
fi
EOF

# --- env sample ------------------------------------------------------------
read -r -d '' ENV_SAMPLE <<'EOF'
# Copy to .env.sharedo and adjust as needed
# Base URL for the Sharedo environment (no trailing slash)
BASE_URL="https://atb-vnext.sharedo.tech"

# Optional auth:
# AUTH_BEARER="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# SHARED0_COOKIE="name=value; other=value"
# EXTRA_HEADERS="X-Forwarded-Proto: https"
EOF

# --- Write files -----------------------------------------------------------
write_file "$ROOT_DIR/.claude/commands/unified-search/review.md"    "$REVIEW_MD"
write_file "$ROOT_DIR/.claude/commands/unified-search/implement.md" "$IMPLEMENT_MD"
write_file "$ROOT_DIR/.claude/commands/unified-search/tests.md"     "$TESTS_MD"
write_file "$ROOT_DIR/scripts/test-live-unified-search.sh"          "$LIVE_TEST"
chmod +x "$ROOT_DIR/scripts/test-live-unified-search.sh"
write_file "$ROOT_DIR/.env.sharedo.sample"                          "$ENV_SAMPLE"

echo
echo "All done."
echo
echo "Run the live checks (defaults: query='igor', entityType='person'):"
echo "  bash scripts/test-live-unified-search.sh"
echo "  bash scripts/test-live-unified-search.sh \"igor\" both"
echo
echo "Use the Claude commands:"
echo "  claude \"/unified-search review\""
echo "  claude \"/unified-search implement unified both\""
echo "  claude \"/unified-search tests\""
