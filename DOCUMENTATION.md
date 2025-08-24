# UnifiedDataSearch - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Modes](#implementation-modes)
4. [API Reference](#api-reference)
5. [Configuration Reference](#configuration-reference)
6. [ShareDo Integration](#sharedo-integration)
7. [Troubleshooting](#troubleshooting)

## Overview

UnifiedDataSearch is a frontend-only solution for searching across ShareDo ODS and external Practice Management Systems. It requires NO backend changes and uses only existing ShareDo APIs.

### Key Capabilities
- Simultaneous search across ODS and PMS systems
- Intelligent result merging and deduplication
- Automatic conflict detection
- PMS entity import to ODS
- Mock PMS service for development

## Architecture

### Component Structure
```
UnifiedDataSearch/
├── Blades/
│   └── UnifiedOdsPmsSearch/         # Main search interface
├── Widgets/
│   ├── UnifiedOdsEntityPicker/      # Form integration widget
│   └── UnifiedOdsEntityPickerDesigner/ # Widget designer
├── Services/
│   ├── MockPmsService.js            # Mock PMS for demo/dev
│   ├── ResultMergerService.js       # Result merging logic
│   └── ConflictDetectorService.js   # Conflict detection
└── Helpers/
    └── namespace.js                  # ShareDo namespace helper
```

### Data Flow
1. User initiates search from widget or blade
2. Parallel queries to ODS and PMS systems
3. ResultMergerService matches and merges results
4. ConflictDetectorService identifies discrepancies
5. Results displayed with source indicators

## Implementation Modes

### Simple Mode (Recommended Default)
Full control implementation with custom UI.

**Configuration:**
```javascript
{
    "useShareDoComponent": false,
    "displayMode": "simple",
    "bladeName": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"
}
```

**Advantages:**
- Complete control over all interactions
- Custom blades for search and entity viewing
- Consistent user experience
- Optimal PMS integration

**Use When:**
- Building new implementations
- Need full control over UX
- Integrating with PMS systems
- Consistency is important

### Component Mode (Limited Use)
Uses ShareDo's native component with search override.

**Configuration:**
```javascript
{
    "useShareDoComponent": true,
    "displayMode": "component",
    "roleSystemName": "client",
    "viewMode": "card"
}
```

**Limitations:**
- Cannot override entity click behavior
- Opens standard ShareDo blades for viewing
- Limited customization options
- Mixed user experience

**Use Only When:**
- Visual consistency with ShareDo is mandatory
- Standard entity viewing is acceptable
- Working within strict UI requirements

## API Reference

### Blade API

#### Opening the Search Blade
```javascript
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    mode: "auto",              // "auto" | "select"
    entityTypes: ["person", "organisation"],
    sharedoId: "WI-123",       // Optional work item context
    useMockPms: true,          // Use mock data
    pmsTimeout: 5000,          // Timeout in ms
    callback: function(result) {
        console.log("Selected:", result);
    }
});
```

### Widget API

#### Widget Configuration
```javascript
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    
    // Mode Settings
    "useShareDoComponent": false,
    "mode": "auto",            // "auto" | "select"
    
    // Display Settings
    "label": "Select Client",
    "hideLabel": false,
    "required": true,
    "allowMultiple": false,
    "allowClear": true,
    
    // Entity Settings
    "entityTypes": ["person", "organisation"],
    "roleSystemName": "client",
    
    // Field Mapping
    "fieldName": "clientOdsId",
    "returnField": "odsId",    // "odsId" | "entity" | "reference"
    
    // Advanced Settings
    "useMockPms": true,
    "pmsTimeout": 5000,
    "bladeName": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
    "bladeWidth": 800
}
```

### Service APIs

#### MockPmsService
```javascript
// Search PMS data
Alt.UnifiedDataSearch.Services.mockPmsService.search(
    "persons",      // "persons" | "organisations"
    "john",         // search query
    0              // page number
).done(function(results) {
    console.log(results);
});

// Add mock data
Alt.UnifiedDataSearch.Services.mockPmsService.addMockPerson({
    id: "PMS-P999",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com"
});
```

#### ResultMergerService
```javascript
// Merge ODS and PMS results
var merged = Alt.UnifiedDataSearch.Services.resultMergerService.mergeResults(
    odsResults,
    pmsResults
);

// Check for matches
var matchKey = service.generateMatchKey(entity);
var hasMatch = service.detectMatch(odsEntity, pmsEntity);
```

## Configuration Reference

### Mode Configuration

| Mode | Description | When to Use |
|------|-------------|-------------|
| `auto` | Auto-import PMS entities to ODS | Production use |
| `select` | Just return selection without creating | Testing/preview |

### Entity Type Configuration

| Type | Description | API Endpoint |
|------|-------------|--------------|
| `person` | Individual entities | `/api/aspects/ods/people/` |
| `organisation` | Company entities | `/api/aspects/ods/organisations/` |

### Return Field Options

| Field | Returns | Example |
|-------|---------|---------|
| `odsId` | ODS entity ID | `"12345"` |
| `entity` | Full entity object | `{ id: 12345, name: "..." }` |
| `reference` | PMS reference | `"PMS-P001"` |

## ShareDo Integration

### Required ShareDo APIs
- `/api/ods/search` - Entity search
- `/api/aspects/ods/people/` - Person CRUD
- `/api/aspects/ods/organisations/` - Organisation CRUD
- `/api/aspects/participants/` - Participant management

### Event Integration
```javascript
// Subscribe to entity selection
$ui.events.subscribe("Alt.UnifiedDataSearch.EntitySelected", function(data) {
    console.log("Entity selected:", data);
});

// Subscribe to participant added
$ui.events.subscribe("Alt.UnifiedDataSearch.ParticipantAdded", function(data) {
    console.log("Participant added:", data);
});
```

### Form Integration
```javascript
// In ShareDo aspect configuration
{
    "widgets": [
        {
            "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
            "label": "Client",
            "required": true,
            "fieldName": "clientOdsId"
        }
    ]
}
```

## Troubleshooting

### Common Issues and Solutions

#### Module Not Found by VSCode Extension
**Cause:** Module not in correct directory structure
**Solution:** Ensure module is at `_IDE/Alt/UnifiedDataSearch/`

#### 404 Errors When Loading Blade
**Cause:** Incorrect path references
**Solution:** Verify paths use `/_ideFiles/Alt/UnifiedDataSearch/...`

#### Search Returns No Results
**Cause:** API endpoint issues or permissions
**Solution:** Check browser console for API errors, verify user permissions

#### PMS Search Timeout
**Cause:** Slow external system or network issues
**Solution:** Increase `pmsTimeout` setting or use mock service

#### Duplicate Results Appearing
**Cause:** Matching logic not detecting duplicates
**Solution:** Check entity data format, ensure consistent field names

#### Widget Not Updating After Selection
**Cause:** Event subscription issues
**Solution:** Verify event handlers are properly subscribed

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('alt.unifiedSearch.debug', 'true');
```

View mock data:
```javascript
// Check current mock data
var mockData = JSON.parse(localStorage.getItem('alt.unifiedSearch.mockPmsData'));
console.log(mockData);
```

Clear all data:
```javascript
// Reset everything
localStorage.removeItem('alt.unifiedSearch.mockPmsData');
localStorage.removeItem('alt.unifiedSearch.debug');
```

## Advanced Topics

### Custom PMS Integration

To integrate with a real PMS system:

1. Implement PMS API endpoint in backend
2. Configure external search provider in ShareDo
3. Set `useMockPms: false` in configuration
4. Map PMS fields to ODS format

### Extending the Module

Add custom entity types:
1. Update `entityTypes` configuration
2. Modify `ResultMergerService.generateMatchKey()`
3. Add type-specific icons in UI
4. Update API endpoints as needed

### Performance Optimization

For large datasets:
- Implement pagination properly
- Use debounced search input
- Cache results appropriately
- Limit concurrent API calls

---

For additional information, see:
- [README.md](./README.md) - Quick start guide
- [CLAUDE.md](./CLAUDE.md) - Implementation details
- [Examples/](./Examples/) - Configuration examples