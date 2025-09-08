# UnifiedDataSearch - Technical Reference

## Overview

UnifiedDataSearch is a frontend-only solution for ShareDo that provides unified search across ODS (Organisational Data Store) with a simplified, production-ready architecture.

**Current Status**: ODS-only implementation (PMS integration removed for simplification)

## Architecture

### Service-Oriented Design

```
┌─────────────────────────────────────────┐
│           UI Components                  │
├─────────────────────────────────────────┤
│  Blade (1,430 lines)  │ Widget (1,812)  │  
└─────────────┬───────────────────┬───────┘
              │                   │
┌─────────────▼───────────────────▼───────┐
│           Core Services                  │
├─────────────────────────────────────────┤
│ • SearchApiService (451 lines)          │
│ • UnifiedSearchService (346 lines)      │
│ • ResultMergerService (283 lines)       │
│ • OdsImportService (340 lines)          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         ShareDo APIs                    │
│  /api/ods/_search • /api/ods/person/... │
└─────────────────────────────────────────┘
```

### Core Services

#### SearchApiService
- **Purpose**: Centralized ODS API interaction
- **Key Features**: Guaranteed initialization, consistent contact detail extraction, unified response parsing
- **Usage**: Single source of truth for all search operations

#### UnifiedSearchService  
- **Purpose**: Orchestrates searches across data sources
- **Key Features**: Timeout handling, progress tracking, result coordination
- **Note**: PMS functionality removed, focuses on ODS coordination

#### ResultMergerService
- **Purpose**: Merges and deduplicates search results
- **Key Features**: Intelligent matching, conflict detection, display enrichment
- **Algorithm**: O(n) hash-based matching with dual strategies

#### OdsImportService
- **Purpose**: Imports external entities to ShareDo ODS
- **Key Features**: ShareDo API compliance, proper contact formatting, date conversion
- **Endpoints**: Uses `/api/aspects/ods/people/` and `/api/aspects/ods/organisations/`

## Integration Guide

### Widget Usage

```javascript
// Basic configuration
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "label": "Select Entity",
    "entityTypes": ["person", "organisation"],
    "searchMode": "odsOnly",
    "allowInlineSearch": true,
    "mode": "select"
}

// Advanced configuration
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker", 
    "label": "Select Client",
    "entityTypes": ["person"],
    "required": true,
    "allowMultiple": false,
    "displayFields": ["email", "phone"],
    "maxQuickResults": 10,
    "mode": "auto",  // Auto-import if needed
    "fieldName": "clientOdsId"
}
```

### Blade Usage

```javascript
// Open search blade programmatically
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    mode: "auto",
    entityTypes: ["person", "organisation"],
    allowAddNew: true,
    sharedoId: workItemId,
    addNewParticipantsToSharedoId: workItemId
});
```

## API Integration

### ShareDo API Requirements

The module uses these existing ShareDo endpoints:

1. **Search**: `POST /api/ods/_search`
   ```javascript
   payload = {
       query: "search terms",
       odsEntityTypes: ["person", "organisation"],
       page: 0,
       pageSize: 20,
       searchType: "quick",
       searchOds: { enabled: true }
   }
   ```

2. **Entity Creation**: `POST /api/aspects/ods/people/` or `POST /api/aspects/ods/organisations/`

3. **Entity Loading**: `GET /api/ods/person/{id}` or `GET /api/ods/organisation/{id}`

### Service Initialization

Services use guaranteed initialization pattern:

```javascript
// Always use this method to get SearchApiService
var searchApiService = Alt.UnifiedDataSearch.Services.getSearchApiService();

// This ensures service is available even if loading order varies
searchApiService.searchOds(query, entityTypes, pageSize, page)
    .done(function(results) {
        // Handle results
    });
```

## Configuration Options

### Widget Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entityTypes` | Array | `["person", "organisation"]` | Types to search |
| `searchMode` | String | `"odsOnly"` | Search mode (PMS removed) |
| `allowInlineSearch` | Boolean | `true` | Enable inline search dropdown |
| `maxQuickResults` | Number | `5` | Max inline results |
| `mode` | String | `"select"` | "select" or "auto" for imports |
| `required` | Boolean | `false` | Field validation |
| `allowMultiple` | Boolean | `false` | Multi-select support |

### Blade Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | String | `"auto"` | "select" or "auto" |
| `entityTypes` | Array | `["person", "organisation"]` | Entity type filter |
| `allowAddNew` | Boolean | `true` | Show "Add New" options |
| `pmsTimeout` | Number | `5000` | PMS timeout (deprecated) |
| `rowsPerPage` | Number | `20` | Results pagination |

## File Structure

```
UnifiedDataSearch/
├── Services/              # Core business logic
│   ├── SearchApiService.js       # ODS API integration
│   ├── UnifiedSearchService.js   # Search orchestration  
│   ├── ResultMergerService.js    # Result processing
│   └── OdsImportService.js       # Entity import
├── Blades/               # Search interface
│   └── UnifiedOdsPmsSearch/
│       ├── blade.js             # Blade logic
│       ├── blade.html           # UI template
│       ├── blade.css            # Styling
│       └── *.panel.json         # ShareDo config
├── Widgets/              # Form integration
│   ├── UnifiedOdsEntityPicker/
│   │   ├── UnifiedOdsEntityPicker.js    # Widget logic
│   │   ├── UnifiedOdsEntityPicker.html  # UI template
│   │   ├── UnifiedOdsEntityPicker.css   # Styling
│   │   └── *.widget.json               # ShareDo config
│   └── UnifiedOdsEntityPickerDesigner/  # Designer interface
├── Helpers/              # Utilities
│   └── namespace.js             # Namespace management
├── Examples/             # Configuration examples
├── tests/                # Test suite
└── docs/                # Documentation
```

## Testing

Run the test suite:
```javascript
// In browser console after loading test file
npm test  // If using Node.js test runner

// Or manual testing:
// 1. Test widget inline search
// 2. Test blade advanced search  
// 3. Verify entity selection/import
// 4. Check service initialization
```

## Troubleshooting

### Common Issues

**Search not working**: Verify SearchApiService initialization
```javascript
console.log("SearchApiService:", Alt.UnifiedDataSearch.Services.searchApiService);
```

**Widget not displaying**: Check configuration and entity types
```javascript
// Ensure entityTypes array is correct
entityTypes: ["person", "organisation"]  // ✓ Correct
entityTypes: ["people", "orgs"]          // ✗ Wrong
```

**Blade errors**: Ensure $ui.stacks.openPanel (not $ui.showBlade):
```javascript
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", config);
```

### Debug Mode

Enable detailed logging:
```javascript
localStorage.setItem('alt.unifiedSearch.debug', 'true');
// Reload page, then check console for detailed logs
```

## Migration Notes

**From older versions**: 
- PMS mock services removed - use `searchMode: "odsOnly"`
- `useMockPms` configuration deprecated
- All searches now go through SearchApiService

**Architectural Changes**:
- True unification achieved - both Widget and Blade use same search logic
- Zero code duplication between components
- Single source of truth for all search operations

---

For implementation examples, see `Examples/` directory.  
For detailed API patterns, see service source files.