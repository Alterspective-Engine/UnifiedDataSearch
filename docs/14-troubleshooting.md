# Troubleshooting Guide

## Common Issues and Solutions

### 1. Namespace not defined

**Error:** `Uncaught ReferenceError: namespace is not defined`

**Solution:** Ensure namespace.js is loaded first in panel.json:
```json
"scripts": [
    "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",  // FIRST!
    // ... other scripts
]
```

### 2. Mock data not appearing

**Symptoms:** Search returns no results even with mock service

**Solutions:**
1. Check localStorage:
```javascript
console.log(localStorage.getItem('alt.unifiedSearch.mockPmsData'));
```

2. Clear and reinitialize:
```javascript
localStorage.removeItem('alt.unifiedSearch.mockPmsData');
location.reload();
```

3. Verify service initialization:
```javascript
console.log(Alt.UnifiedDataSearch.Services.mockPmsService.mockPersons);
```

### 3. Events not firing

**Symptoms:** Widgets not refreshing after participant add

**Solutions:**
1. Verify event system:
```javascript
console.log(window.$ui.events);  // Should exist
```

2. Test event publishing:
```javascript
$ui.events.publish("Test.Event", { test: true });
```

3. Check subscription:
```javascript
var id = $ui.events.subscribe("Test.Event", function(data) {
    console.log("Received:", data);
});
```

### 4. PMS timeout

**Symptoms:** PMS search always times out

**Solutions:**
1. Increase timeout:
```javascript
{
    pmsTimeout: 10000  // 10 seconds instead of 5
}
```

2. Check network tab for actual response times

3. Use mock service for development:
```javascript
{
    useMockPms: true
}
```

### 5. API Errors

#### "Invalid contact detail type"
**Cause:** Wrong contactTypeSystemName for entity type

**Solution:**
- Person phone: Use "mobile" not "phone"
- Organisation phone: Use "phone" not "mobile"

#### "InvalidPureDateException"
**Cause:** Wrong date format

**Solution:** Convert to YYYYMMDD integer:
```javascript
function convertDateToShareDoFormat(dateString) {
    var parts = dateString.split('-');
    return parseInt(parts[0] + parts[1] + parts[2], 10);
}
```

#### "Foreign key constraint violation"
**Cause:** Invalid sourceSystem value

**Solution:** Don't use sourceSystem, use reference field:
```javascript
{
    // sourceSystem: "PMS",  // ❌ Remove this
    reference: "PMS-ID-123"   // ✅ Use this
}
```

### 6. Blade won't open

**Error:** `$ui.showBlade is not a function`

**Solution:** Use correct method:
```javascript
// ❌ WRONG
$ui.showBlade("bladeName", config);

// ✅ CORRECT
$ui.stacks.openPanel("bladeName", config);
```

### 7. Search not triggering

**Symptoms:** Typing in search box does nothing

**Solutions:**
1. Check observable binding:
```javascript
console.log(blade.searchQuery());  // Should update
```

2. Verify subscription:
```javascript
blade.searchQuery.subscribe(function(val) {
    console.log("Search query:", val);
});
```

3. Check minimum length (2 characters required)

### 8. Merge conflicts not detected

**Symptoms:** Different data not showing as conflict

**Solutions:**
1. Check field names match:
```javascript
// ODS might use different field names
console.log("ODS fields:", Object.keys(odsData));
console.log("PMS fields:", Object.keys(pmsData));
```

2. Verify conflict detection logic:
```javascript
var conflicts = merger.getConflictDetails(odsData, pmsData);
console.log("Conflicts:", conflicts);
```

## Debug Tools

### Enable Verbose Logging
```javascript
// Add to blade constructor
self.debug = true;

// In methods
if (self.debug) console.log("Searching:", query);
```

### Monitor Performance
```javascript
console.time("Search");
// ... operation
console.timeEnd("Search");
```

### Check Service Status
```javascript
// List all services
console.log(Alt.UnifiedDataSearch.Services);

// Check specific service
console.log(Alt.UnifiedDataSearch.Services.mockPmsService);
```

## Getting Help

1. Check browser console for errors
2. Review network tab for API calls
3. Verify all files are loaded (Sources tab)
4. Test with mock data first
5. Check ShareDo logs if available

## Related Documentation
- [Testing Guide](13-testing.md) - Testing procedures
- [API Patterns](03-api-patterns.md) - Common API errors
- [Configuration Options](15-configuration.md) - Settings that might help