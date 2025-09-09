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
   - Conflicts array enumerates differing fields; "Edit in Sharedo" action wired

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
- [ ] Conflicts computed where values differ; "Edit in Sharedo" wired
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