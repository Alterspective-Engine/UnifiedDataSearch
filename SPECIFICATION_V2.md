# UnifiedDataSearch Specification v2.0

**Last Updated**: Based on implementation learnings and production testing  
**Status**: Implemented with critical bug fixes and UX improvements

## Executive Summary

The UnifiedDataSearch module provides a unified search interface across ShareDo ODS and external PMS systems. This specification has been updated with critical learnings from implementation and production deployment.

## 🔴 Critical Implementation Requirements

### 1. Service Initialization Pattern

**Problem Discovered**: Services may not be initialized when components try to use them, causing `undefined` errors.

**Solution Pattern**:
```javascript
// ALWAYS use defensive initialization
if (!Alt.UnifiedDataSearch.Services.mockPmsService) {
    if (Alt.UnifiedDataSearch.Services.MockPmsService) {
        Alt.UnifiedDataSearch.Services.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();
    }
}

// ALWAYS check service methods exist before calling
if (mockService && typeof mockService.search === 'function') {
    return mockService.search(type, query, page);
} else {
    // Return empty results as fallback
    return $.Deferred().resolve({ results: [] }).promise();
}
```

### 2. ShareDo API Endpoint Requirements

**Critical**: ShareDo uses PLURAL endpoints for ODS entities

✅ **CORRECT Endpoints**:
```javascript
/api/aspects/ods/people/        // NOT /api/aspects/ods/person/
/api/aspects/ods/organisations/ // NOT /api/aspects/ods/organisation/
```

### 3. Contact Type Requirements

**Critical**: Different contact types for persons vs organisations

**Person Contact Types**:
```javascript
{
    // Email
    contactTypeCategoryId: 2100,
    contactTypeSystemName: "email",
    
    // Phone - MUST BE "mobile" NOT "phone"
    contactTypeCategoryId: 2101,
    contactTypeSystemName: "mobile",  // ⚠️ CRITICAL: NOT "phone"
}
```

**Organisation Contact Types**:
```javascript
{
    // Email
    contactTypeCategoryId: 2100,
    contactTypeSystemName: "email",
    
    // Phone - MUST BE "phone" NOT "mobile"
    contactTypeCategoryId: 2102,  // Different category ID
    contactTypeSystemName: "phone",  // ✅ "phone" for orgs
}
```

### 4. Date Format Requirements

**ShareDo PureDate Format**: YYYYMMDD as integer

```javascript
// CORRECT conversion
function convertDateToShareDoFormat(dateString) {
    // Input: "1980-01-15"
    var parts = dateString.split('-');
    var year = parts[0];
    var month = parts[1].padStart(2, '0');
    var day = parts[2].padStart(2, '0');
    return parseInt(year + month + day, 10);  // Returns: 19800115
}
```

### 5. Entity Type Filtering

**Problem Discovered**: "All" filter only searched persons, not both types

**Solution**:
```javascript
if (entityType === "all") {
    // Must search BOTH types and merge results
    var personsPromise = self.searchPmsType("persons", query, page);
    var orgsPromise = self.searchPmsType("organisations", query, page);
    
    return $.when(personsPromise, orgsPromise).then(function(personsResult, orgsResult) {
        // Merge both result sets
        var combinedResults = {
            results: [...personsResult.results, ...orgsResult.results]
        };
        return combinedResults;
    });
}
```

## 📁 File Structure Requirements

```
_IDE/Alt/UnifiedDataSearch/
├── docs/                              # Modular documentation
│   ├── 01-overview.md
│   ├── 02-quick-setup.md
│   ├── 03-api-patterns.md            # CRITICAL API patterns
│   ├── 04-ods-entity-creation.md
│   ├── 05-contact-details.md         # Contact type matrix
│   └── ...
├── Helpers/
│   └── namespace.js                   # MUST load first
├── Services/
│   ├── MockPmsService.js             # With fallback data
│   ├── ResultMergerService.js        # Dual matching strategy
│   ├── OdsImportService.js           # Handles API requirements
│   ├── UnifiedSearchService.js       # Orchestrator
│   └── ConflictDetectorService.js
├── Blades/
│   └── UnifiedOdsPmsSearch/
│       ├── UnifiedOdsPmsSearchBlade.panel.json
│       ├── blade.html
│       ├── blade.js
│       ├── blade.css
│       └── mockData/                 # JSON mock data files
└── Widgets/
    └── UnifiedOdsEntityPicker/
        ├── UnifiedOdsEntityPicker.widget.json
        ├── UnifiedOdsEntityPicker.html
        ├── UnifiedOdsEntityPicker.js
        └── UnifiedOdsEntityPicker.css
```

## 🔧 Implementation Patterns

### 1. Namespace Pattern (ShareDo Requirement)

```javascript
// MUST use namespace() function, NOT ES6 modules
namespace("Alt.UnifiedDataSearch.Services");

// Create service as constructor function
Alt.UnifiedDataSearch.Services.MyService = function() {
    var self = this;
    // Implementation
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.myService = new Alt.UnifiedDataSearch.Services.MyService();
```

### 2. Observable Pattern (Knockout.js)

```javascript
// MUST use observables for all UI-bound data
self.searchQuery = ko.observable("");
self.results = ko.observableArray([]);
self.isLoading = ko.observable(false);

// Use computed for derived values
self.hasResults = ko.computed(function() {
    return self.results().length > 0;
});
```

### 3. Blade Opening Pattern

```javascript
// CORRECT - Use openPanel
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", config);

// WRONG - showBlade doesn't exist
// $ui.showBlade(...);  // ❌ DON'T USE
```

### 4. Error Handling Pattern

```javascript
// Always provide fallbacks
self.searchPms = function() {
    if (!self.pmsService) {
        // Try to initialize
        self.initializePmsService();
    }
    
    if (self.pmsService && self.pmsService.search) {
        return self.pmsService.search();
    } else {
        // Return empty results instead of failing
        return $.Deferred().resolve({ 
            results: [], 
            success: true 
        }).promise();
    }
};
```

## 🎨 UX Requirements

### 1. Result Cards Must Show Information

**Problem**: Too much white space, no useful information

**Solution**: Display relevant fields based on entity type
- **Persons**: Name, Email, Phone, DOB, Address
- **Organisations**: Name, Trading Name, ABN, Email, Phone

### 2. Search Progress Indicators

**Required Elements**:
- Visual progress for each system (ODS/PMS)
- Result count as they arrive
- Clear error states with recovery options
- Timeout handling for slow systems

### 3. Inline Search Widget

**Requirements**:
- Show entity details in dropdown (not just names)
- Correct source labels (ShareDo/PMS, not all "MATCHED")
- Selection must update host model
- Clear visual feedback on selection

## 🐛 Common Issues and Solutions

### Issue 1: "Cannot read properties of undefined"

**Cause**: Service not initialized  
**Solution**: Defensive initialization pattern (see above)

### Issue 2: "Invalid contact detail type"

**Cause**: Using "phone" for persons or "mobile" for orgs  
**Solution**: Use correct contact types matrix

### Issue 3: Entity type filter not working

**Cause**: Not searching both types for "all"  
**Solution**: Search both and merge results

### Issue 4: All results show as "MATCHED"

**Cause**: Incorrect source assignment in result processing  
**Solution**: Check ID format to determine source
```javascript
source: item.id && item.id.indexOf("PMS") > -1 ? "pms" : "sharedo"
```

### Issue 5: Selection doesn't update form

**Cause**: Host model not being updated  
**Solution**: Update host model after selection
```javascript
if (self._host && self._host.model && self.options.fieldName) {
    self._host.model[self.options.fieldName](value);
}
```

## 📋 Testing Checklist

### Pre-deployment
- [ ] Clear browser cache
- [ ] Verify all services initialize
- [ ] Test with no mock data
- [ ] Test with API failures
- [ ] Test all entity type filters
- [ ] Test inline search selection
- [ ] Test conflict detection
- [ ] Test auto-import from PMS

### Entity Creation
- [ ] Create person with email and mobile
- [ ] Create organisation with email and phone
- [ ] Verify date conversion
- [ ] Check reference field population
- [ ] Test with missing optional fields

### Search Functionality
- [ ] Search returns both systems
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Results show details
- [ ] Source badges are correct
- [ ] Selection updates form

## 🚀 Deployment Requirements

### Script Loading Order (panel.json)
```json
{
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/OdsImportService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/UnifiedSearchService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.js"
    ]
}
```

### Environment Variables
```javascript
// For real PMS integration (future)
PMS_API_ENDPOINT=https://pms.example.com/api
PMS_API_KEY=xxx
PMS_TIMEOUT=5000
```

### ShareDo Settings
```javascript
// Optional blade overrides
alt.ods.person.external.search.actionBlade
alt.ods.organisation.external.search.actionBlade
alt.ods.unified.search.conflictResolution
```

## 📊 Success Metrics

1. **Search Performance**
   - Both systems respond < 2 seconds
   - Timeout handling works correctly
   - Results merge properly

2. **Data Quality**
   - No duplicate entities created
   - Conflicts detected accurately
   - Reference fields maintain links

3. **User Experience**
   - Clear visual feedback
   - Intuitive entity selection
   - Error recovery options
   - Mobile responsive

## 🔮 Future Enhancements

1. **Real PMS Integration**
   - Remove mock service dependency
   - Add authentication handling
   - Implement retry logic

2. **Advanced Features**
   - Batch entity import
   - Conflict auto-resolution
   - Search history
   - Fuzzy matching

3. **Performance**
   - Result caching
   - Predictive search
   - Background sync

## 📚 References

- [ShareDo API Documentation](./docs/03-api-patterns.md)
- [Contact Types Matrix](./docs/05-contact-details.md)
- [ODS Entity Creation Guide](./docs/04-ods-entity-creation.md)
- [Troubleshooting Guide](./docs/14-troubleshooting.md)
- [UX Enhancement Plan](./UX_REVIEW_AND_ENHANCEMENTS.md)
- [Bug Fix Summary](./BUGFIX_SUMMARY.md)

---

**Note**: This specification is based on actual implementation experience and production deployment learnings. Always refer to the latest ShareDo API documentation for any platform changes.