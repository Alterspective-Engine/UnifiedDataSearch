# Inline Search Fix Summary

## Issues Fixed

### 1. Service Initialization Problem
**Issue**: The widget was trying to create a NEW instance of UnifiedSearchService with `new`, but UnifiedSearchService is a singleton.

**Fix**: Changed to use the singleton directly:
```javascript
// OLD - WRONG
self.searchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({...});

// NEW - CORRECT
self.searchService = Alt.UnifiedDataSearch.Services.unifiedSearchService;
```

### 2. Search Method Confusion
**Issue**: There were multiple search methods causing confusion:
- `performInlineSearch` - tried to use the service but failed
- `executeInlineSearch` - has the working API call implementation

**Fix**: Simplified to always use `executeInlineSearch` which contains the working POST API call to `/api/ods/_search`.

### 3. Selection Not Working
**Issue**: Clicking on inline search results didn't select the entity.

**Fixes Applied**:
1. Added proper console logging to trace the selection flow
2. Fixed `selectInlineResult` to properly handle the entity data
3. Fixed `setSelectedEntity` to normalize the entity data and update the widget
4. Added `getReturnValue` method to determine what value to return to the host model
5. Added proper blur prevention to keep the dropdown open during selection

### 4. API Call Pattern
**Issue**: Widget was trying different API endpoints instead of using the working pattern from the blade.

**Fix**: Updated to use the exact same API pattern as the blade:
```javascript
// POST to /api/ods/_search with payload:
{
    query: "search term",
    page: 0,
    pageSize: 5,
    searchType: "quick",
    searchParticipants: { enabled: false },
    searchOds: { enabled: true, ... },
    odsEntityTypes: ["person", "organisation"],
    // ... other fields
}
```

## Key Changes Made

### UnifiedOdsEntityPicker.js

1. **Service Initialization** (lines 1316-1329):
   - Use singleton UnifiedSearchService
   - Added console logging for debugging

2. **Search Execution** (lines 1405-1411):
   - `performInlineSearch` now just calls `executeInlineSearch`
   - Removed broken service call attempt

3. **Search Subscription** (lines 1356-1371):
   - Added proper debouncing
   - Direct call to `executeInlineSearch`

4. **Selection Handler** (lines 1435-1468):
   - Added console logging
   - Proper blur prevention
   - Handle entity data correctly

5. **Entity Setting** (lines 1471-1517):
   - Normalize entity data
   - Update observables correctly
   - Update host model if in aspect mode

6. **Return Value** (lines 1535-1558):
   - New method to get the correct return value
   - Supports different return field configurations

### Configuration Updates

1. **UnifiedOdsEntityPicker.widget.json**:
   - Set `useMockOds: false` by default (use real API)
   - Keep `useMockPms: true` (use mock PMS data)

## Testing the Fix

1. **Check Console Logs**:
   - "Using UnifiedSearchService singleton for inline search"
   - "Making real ODS API call with query: [your search]"
   - "selectInlineResult called with: [entity data]"
   - "setSelectedEntity called with: [entity data]"
   - "Entity selected. Current selection: [selected entities]"

2. **Check Network Tab**:
   - Should see POST requests to `/api/ods/_search`
   - Response should contain `rows` array with results

3. **Verify Selection**:
   - Click on a search result
   - Should see the entity appear in the widget
   - Check console for selection logs

## Flow Summary

1. User types in inline search input → triggers `inlineSearchQuery` observable
2. After debounce → calls `executeInlineSearch`
3. `executeInlineSearch` makes POST to `/api/ods/_search`
4. Results are processed and displayed in dropdown
5. User clicks result → triggers `selectInlineResult`
6. `selectInlineResult` calls `setSelectedEntity`
7. `setSelectedEntity` updates the widget's `selectedEntities` observable
8. If in aspect mode, updates host model via `getReturnValue`
9. `closeInlineSearch` clears the search and hides dropdown

## Next Steps

If issues persist:
1. Check browser console for any errors
2. Verify the API is responding correctly
3. Check that all required services are loaded in the correct order
4. Ensure Knockout.js bindings are properly initialized