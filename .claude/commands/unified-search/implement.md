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