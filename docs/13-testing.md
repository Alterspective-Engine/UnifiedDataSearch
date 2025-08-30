# Testing Guide

## Quick Tests

### 1. Test Mock PMS Service
```javascript
// In browser console
var service = Alt.UnifiedDataSearch.Services.mockPmsService;
service.search("persons", "john", 0).done(function(results) {
    console.log("Results:", results);
});
```

### 2. Test Blade Opening
```javascript
// CORRECT: Use $ui.stacks.openPanel
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    sharedoId: "{{sharedoId}}",  // Optional: work item ID
    mode: "auto",  // "auto" = auto-import PMS to ODS
    entityTypes: ["person", "organisation"],
    useMockPms: true,  // Use mock PMS data
    useMockOds: true   // Use mock ODS data
});
```

### 3. Test Event Publishing
```javascript
// Subscribe to events
$ui.events.subscribe("Alt.UnifiedDataSearch.ParticipantAdded", function(data) {
    console.log("Participant added:", data);
});
```

## Component Testing

### Test Namespace Helper
```javascript
// Should create nested objects
namespace("Alt.UnifiedDataSearch.Test.Deep.Path");
console.log(window.Alt.UnifiedDataSearch.Test.Deep.Path); // Should exist
```

### Test Result Merger
```javascript
var merger = Alt.UnifiedDataSearch.Services.resultMergerService;

var odsResults = {
    results: [{
        id: 1,
        firstName: "John",
        lastName: "Smith",
        email: "john@example.com"
    }]
};

var pmsResults = {
    results: [{
        id: "PMS-001",
        firstName: "John",
        lastName: "Smith",
        email: "john@different.com"  // Conflict!
    }]
};

var merged = merger.mergeResults(odsResults, pmsResults);
console.log("Merged:", merged);
// Should show matched record with conflict flag
```

## Integration Testing

### Full Search Flow
```javascript
// 1. Open blade
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    mode: "auto",
    useMockPms: true
});

// 2. Programmatically trigger search
var blade = $ui.stacks.current().viewModel;
blade.searchQuery("john");

// 3. Check results
setTimeout(function() {
    console.log("Results:", blade.searchResults());
}, 2000);
```

### Test Entity Selection
```javascript
// After search completes
var firstResult = blade.searchResults()[0];
blade.selectEntity(firstResult);

// Should trigger close and events
```

## Mock Data Management

### Reset Mock Data
```javascript
localStorage.removeItem('alt.unifiedSearch.mockPmsData');
// Reload service to reinitialize
location.reload();
```

### Add Test Data
```javascript
var service = Alt.UnifiedDataSearch.Services.mockPmsService;
service.mockPersons.push({
    id: "TEST-001",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "0400000000",
    source: "pms",
    odsType: "person"
});
service.saveMockData();
```

## Performance Testing

### Search Performance
```javascript
console.time("Search");
blade.executeSearch();
blade.searchProgressPercent.subscribe(function(percent) {
    if (percent === 100) {
        console.timeEnd("Search");
    }
});
```

### Memory Usage
```javascript
// Check before
console.log("Initial memory:", performance.memory.usedJSHeapSize);

// Perform operations
for (var i = 0; i < 100; i++) {
    blade.executeSearch();
}

// Check after
setTimeout(function() {
    console.log("Final memory:", performance.memory.usedJSHeapSize);
}, 5000);
```

## Error Testing

### Test API Failures
```javascript
// Temporarily break endpoint
var originalGet = $ajax.get;
$ajax.get = function(url) {
    if (url.indexOf("/api/ods/search") > -1) {
        return $.Deferred().reject({ responseText: "Test error" });
    }
    return originalGet.apply(this, arguments);
};

// Test search - should handle error gracefully
blade.executeSearch();

// Restore
$ajax.get = originalGet;
```

## Checklist

✅ Mock service returns data  
✅ Blade opens correctly  
✅ Search executes  
✅ Results display  
✅ Matching works  
✅ Conflicts detected  
✅ Entity selection works  
✅ Events publish  
✅ Blade closes properly  

## Related Documentation
- [Troubleshooting](14-troubleshooting.md) - Common issues
- [Mock PMS Service](07-mock-pms.md) - Mock data details