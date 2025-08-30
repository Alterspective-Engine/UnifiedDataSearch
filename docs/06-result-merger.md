# ResultMergerService Documentation

## Overview
The ResultMergerService combines search results from ShareDo ODS and PMS systems, identifying matches and detecting conflicts.

## Matching Logic

### Two-Way Matching
The service checks for matches in TWO ways:

1. **Data matching** - Matches by name, email, DOB, ABN, etc.
2. **Reference field matching** - Checks if PMS ID is stored in ODS Reference field

```javascript
// The service maintains two maps for matching:
var matchMap = {};      // Map by generated match keys (name+email, etc)
var referenceMap = {};   // Map ODS records by their Reference field

// Process ODS results
odsData.forEach(function(item) {
    var key = self.generateMatchKey(item);
    var result = {
        // ... result properties
        reference: item.reference || item.Reference || null
    };
    matchMap[key] = result;
    
    // Track by Reference field if it exists
    if (result.reference) {
        referenceMap[result.reference] = result;
    }
});

// Process PMS results
pmsResults.results.forEach(function(item) {
    var key = self.generateMatchKey(item);
    var matchedByKey = matchMap[key];
    var matchedByReference = referenceMap[item.id];  // Check if PMS ID is in ODS Reference
    
    // Reference match takes priority
    var matchedRecord = matchedByReference || matchedByKey;
    
    if (matchedRecord) {
        // Found a match - mark as matched
        matchedRecord.source = "matched";
        matchedRecord.pmsId = item.id;
        matchedRecord.pmsData = item;
    }
});
```

## Match Key Generation

### For Persons
```javascript
var first = (item.firstName || "").toLowerCase().trim();
var last = (item.lastName || "").toLowerCase().trim();
var dob = item.dateOfBirth || "";
return "person:" + first + ":" + last + ":" + dob;
```

### For Organisations
```javascript
var name = (item.name || item.organisationName || "").toLowerCase().trim();
var abn = (item.abn || "").replace(/\s/g, "");
return "org:" + name + ":" + abn;
```

## Conflict Detection

### Checked Fields
- email
- phone
- address
- postcode
- suburb

### Source States
- `"sharedo"` - ODS only
- `"pms"` - PMS only
- `"matched"` - Found in both systems

## Usage Example
```javascript
var mergerService = Alt.UnifiedDataSearch.Services.resultMergerService;
var merged = mergerService.mergeResults(odsResults, pmsResults);

// Result includes:
// - source: "sharedo", "pms", or "matched"
// - hasConflicts: boolean
// - conflicts: array of field differences
```

## Related Documentation
- [Mock PMS Service](07-mock-pms.md) - Test data provider
- [Blade Implementation](11-blade-implementation.md) - How merger is used