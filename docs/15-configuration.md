# Configuration Options

## Blade Configuration

### Complete Options
```javascript
{
    // Work item ID (optional)
    sharedoId: "WI-123",
    
    // Parent work item ID (optional)
    parentSharedoId: "WI-100",
    
    // ShareDo type system name
    sharedoTypeSystemName: "matter",
    
    // Where to add new participants
    addNewParticipantsToSharedoId: "WI-123",
    
    // Mode: "select" or "auto"
    mode: "auto",
    
    // Entity types to search
    entityTypes: ["person", "organisation"],
    
    // Use mock PMS service
    useMockPms: true,
    
    // PMS search timeout (ms)
    pmsTimeout: 5000,
    
    // Allow adding new entities
    allowAddNew: true,
    
    // Auto-add participant without confirmation
    tryAutoAddParticipant: false,
    
    // Results per page
    rowsPerPage: 20
}
```

### Mode Options

#### Select Mode
Returns selected entity without creating ODS records:
```javascript
{
    mode: "select"
}
```

#### Auto Mode
Automatically creates ODS entities from PMS records:
```javascript
{
    mode: "auto"
}
```

## Widget Configuration

### Simple Mode
```javascript
{
    "_host": {
        "model": "@parent",
        "blade": "@blade",
        "enabled": true
    },
    "useShareDoComponent": false,  // Simple mode
    "displayMode": "simple",
    "roleSystemName": "client",
    "roleLabel": "Select Client",
    "required": true,
    "allowMultiple": false,
    "mode": "auto",
    "fieldName": "clientOdsId",
    "returnField": "odsId"
}
```

### Component Mode
```javascript
{
    "_host": {
        "model": "@parent",
        "blade": "@blade",
        "enabled": true
    },
    "useShareDoComponent": true,  // Component mode
    "displayMode": "component",
    "roleSystemName": "client",
    "roleLabel": "Client",
    "viewMode": "card",  // or "list"
    "required": true,
    "allowMultiple": false,
    "mode": "auto",
    "fieldName": "clientOdsId",
    "returnField": "odsId",
    "bladeName": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"
}
```

## System Settings

### Via ShareDo Settings API

#### Person Review Blade
```javascript
// Setting name: alt.ods.person.external.search.actionBlade
// Value: Blade name to open for person review
$ajax.post("/api/v2/public/settings", {
    name: "alt.ods.person.external.search.actionBlade",
    value: "Custom.Person.Review.Blade"
});
```

#### Organisation Review Blade
```javascript
// Setting name: alt.ods.organisation.external.search.actionBlade
// Value: Blade name to open for organisation review
$ajax.post("/api/v2/public/settings", {
    name: "alt.ods.organisation.external.search.actionBlade",
    value: "Custom.Organisation.Review.Blade"
});
```

#### Conflict Resolution
```javascript
// Setting name: alt.ods.unified.search.conflictResolution
// Values: "preferOds", "preferPms", "askUser"
$ajax.post("/api/v2/public/settings", {
    name: "alt.ods.unified.search.conflictResolution",
    value: "askUser"
});
```

## Mock Service Configuration

### localStorage Keys
```javascript
// Mock PMS data
localStorage.setItem('alt.unifiedSearch.mockPmsData', JSON.stringify({
    persons: [...],
    organisations: [...],
    lastUpdated: new Date().toISOString()
}));

// User preferences
localStorage.setItem('alt.unifiedSearch.preferences', JSON.stringify({
    defaultMode: "auto",
    defaultTimeout: 5000,
    alwaysUseMock: true
}));
```

## Environment Detection

### Check for PMS Provider
```javascript
$ajax.get("/api/ods/externalSearch/providers")
    .done(function(providers) {
        var hasPms = providers.some(p => p.systemName === "pms");
        config.useMockPms = !hasPms;
    });
```

## Performance Tuning

### Search Optimization
```javascript
{
    // Delay before search triggers (ms)
    searchDelay: 500,
    
    // Minimum query length
    minSearchLength: 2,
    
    // Results per page
    rowsPerPage: 20,
    
    // Cache duration (ms)
    cacheTimeout: 300000  // 5 minutes
}
```

### Memory Management
```javascript
{
    // Maximum cached results
    maxCachedResults: 100,
    
    // Clear cache on close
    clearCacheOnClose: true
}
```

## Feature Flags

### Enable/Disable Features
```javascript
{
    // Feature toggles
    features: {
        enableConflictDetection: true,
        enableAutoImport: true,
        enableReferenceMatching: true,
        showDebugInfo: false,
        enableCaching: true
    }
}
```

## Related Documentation
- [Blade Implementation](11-blade-implementation.md) - How config is used
- [Widget Integration](08-widget-integration.md) - Widget config details
- [Testing Guide](13-testing.md) - Testing different configurations