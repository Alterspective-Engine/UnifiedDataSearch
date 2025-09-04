# UnifiedDataSearch Widget - Diagnostic Guide

## 🔍 Debugging Widget vs Blade Search Differences

### What to Check in Browser Console

When you search for "igor" in both the widget and blade, look for these console messages:

#### Widget Console Output (Expected)
```javascript
// 1. Search initiation
"executeInlineSearch called with query: igor"
"Search mode: unified"
"Making real ODS API call with query: igor"

// 2. API Payload (MUST match blade exactly)
"ODS API payload: {
    startPage: 1,  // ✅ Must be 1, not 0
    endPage: 1,
    rowsPerPage: 10,
    searchString: "igor",  // ✅ Must be "searchString", not "query"
    odsEntityTypes: ["person", "organisation"],
    // ... full structure
}"

// 3. Search completion
"=== WIDGET SEARCH COMPLETE ==="
"Search promises count: 2"  // Should be 2 for unified search

// 4. Pre-merge data
"=== PRE-MERGE DATA ==="
"ODS Results to merge: {results: [...], totalResults: n}"
"  - Count: [number]"
"PMS Results to merge: {results: [...], totalResults: n}"
"  - Count: [number]"

// 5. Merge process
"Using ResultMergerService for merging"  // ✅ MUST see this

// 6. Post-merge data
"=== POST-MERGE DATA ==="
"Merged results count: [total]"
"Source distribution: {sharedo: n, pms: n, matched: n}"
```

#### Blade Console Output (For Comparison)
```javascript
"🚀 UnifiedDataSearch Blade Loaded"
"🔍 UNIFIED SEARCH STARTED"
"→ Starting ShareDo ODS search..."
"→ Starting PMS search..."
"✓ ShareDo ODS search complete: [n] results found"
"✓ PMS search complete: [n] results found"
"📊 MERGING RESULTS"
"✓ Results merged: [n] total records"
"📈 Merge Statistics: {sharedo: n, pms: n, matched: n}"
```

### Common Issues and Solutions

#### Issue 1: Widget shows different results than blade
**Check:**
1. Are both using the same API endpoint? (`/api/ods/_search`)
2. Are the payloads identical? (Compare in Network tab)
3. Is ResultMergerService being used? (Look for "Using ResultMergerService")

**Solution:**
- Ensure widget uses `searchString` not `query`
- Ensure widget uses `startPage: 1` not `page: 0`
- Verify ResultMergerService is loaded

#### Issue 2: "ResultMergerService NOT AVAILABLE"
**Check:**
```javascript
console.log(Alt.UnifiedDataSearch.Services.resultMergerService);
```

**Solution:**
- Ensure ResultMergerService.js is loaded before widget
- Check widget.json includes the service
- Verify namespace is created

#### Issue 3: PMS results missing
**Check:**
- Is PMS search being executed?
- Are both entity types being searched?

**Solution:**
- Widget should search both "persons" AND "organisations" for PMS
- Check `searchPromises.length` should be 2 for unified search

#### Issue 4: Sources labeled incorrectly
**Check:**
- How is source being determined?
- Is merge service identifying matches?

**Solution:**
- ResultMergerService handles source labeling
- Don't rely on ID format alone

### Network Tab Analysis

#### Widget Request (Should Match Blade)
```
POST /api/ods/_search
Payload:
{
    "startPage": 1,
    "endPage": 1,
    "rowsPerPage": 10,
    "searchString": "igor",
    "odsEntityTypes": ["person", "organisation"],
    "availability": {...},
    "location": {...},
    "connection": {...},
    "competencies": [],
    "teams": [],
    "roles": [],
    "odsTypes": [],
    "wallManagement": false
}
```

#### Response Format
```json
{
    "rows": [
        {
            "id": "ods-id",
            "result": "{...}", // JSON string
            "odsEntityType": "person"
        }
    ],
    "totalRows": 23
}
```

### Testing Checklist

1. **Open Browser DevTools Console**
2. **Clear Console**
3. **Search "igor" in Widget**
4. **Check Console for:**
   - [ ] "Making real ODS API call"
   - [ ] Correct payload structure
   - [ ] 2 search promises for unified
   - [ ] "Using ResultMergerService"
   - [ ] Source distribution shows all types
5. **Search "igor" in Blade**
6. **Compare:**
   - [ ] Total result count
   - [ ] Source distribution
   - [ ] Entity details (email, phone)

### Quick Diagnostic Commands

Run these in console to check widget state:

```javascript
// Check if services are loaded
console.log("ResultMergerService:", Alt.UnifiedDataSearch.Services.resultMergerService);
console.log("MockPmsService:", Alt.UnifiedDataSearch.Services.mockPmsService);

// Check widget configuration
var widget = ko.dataFor($('.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker')[0]);
console.log("Widget search mode:", widget.options.searchMode);
console.log("Widget entity types:", widget.options.entityTypes);
console.log("Use mock PMS:", widget.options.useMockPms);
console.log("Use mock ODS:", widget.options.useMockOds);

// Force a search
widget.inlineSearchQuery("igor");

// Check last results
console.log("Last inline results:", widget.inlineSearchResults());
```

### Fix Verification

After applying fixes, you should see:

1. **Same API calls** - Network tab shows identical requests
2. **Same results** - Count and content match
3. **Proper merging** - Matched entities identified
4. **Correct sources** - ShareDo/PMS/Matched labels
5. **Selection works** - Click selects entity

### If Still Not Working

1. **Check Script Loading Order**
   - namespace.js must load first
   - Services before widget
   - Check browser console for load errors

2. **Verify Configuration**
   ```javascript
   // Widget should have:
   searchMode: "unified"  // Not "odsOnly"
   entityTypes: ["person", "organisation"]  // Both types
   useMockPms: true  // For testing
   useMockOds: false  // Use real API
   ```

3. **Check API Availability**
   - Can you access `/api/ods/_search` directly?
   - Are you logged into ShareDo?
   - Do you have permissions?

4. **Compare Side by Side**
   - Open two browser tabs
   - Search same term in both
   - Compare console output line by line

### Contact Details Issue

If contact details (email/phone) differ:

**Widget MUST extract like blade:**
1. Check for `isPrimary: true` first
2. Then fall back to any contact
3. Mobile/direct-line for persons
4. Phone for organisations

### The Fix Applied

The widget now:
1. ✅ Uses exact same API payload as blade
2. ✅ Searches both entity types for PMS when "all"
3. ✅ Uses ResultMergerService for merging
4. ✅ Prioritizes primary contacts
5. ✅ Has comprehensive logging

If it's still not working after these fixes, the issue may be in:
- Browser caching (clear cache)
- Service initialization timing
- Configuration differences
- API permissions/availability