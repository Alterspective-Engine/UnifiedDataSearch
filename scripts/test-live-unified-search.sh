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