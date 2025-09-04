# Script Loading Review for UnifiedDataSearch

## Current Issues Found

### 1. JSON Configuration Issues

#### Panel.json Issues:
- ✅ Scripts paths are correct format: `/_ideFiles/Alt/UnifiedDataSearch/...`
- ✅ ConflictDetectorService.js exists (verified)
- ❌ **Dependencies array should be removed** - jquery and knockout are already available globally
- ⚠️ Scripts are loaded multiple times (services loaded in both blade and widget)

#### Widget.json Issues:
- ✅ Scripts paths are correct format
- ❌ **Dependencies array should be removed** - jquery and knockout are already available globally
- ❌ **Duplicate service loading** - Services loaded again that blade also loads
- ❌ **Missing designer widget** - References `Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPickerDesigner` but doesn't exist

### 2. Script Loading Pattern Analysis

Based on ShareDo knowledge base review:

**Standard ShareDo Pattern:**
```json
{
    "scripts": [
        "/_ideFiles/{namespace}/path/to/file.js"
    ],
    "styles": [...],
    "templates": [...],
    "components": [
        "Sharedo.UI.Framework.Components.RibbonBar"  // ShareDo components only
    ]
    // NO "dependencies" array for jquery/knockout
}
```

## Recommended Changes

### Option 1: Global Include Pattern (RECOMMENDED)

Create a global include file to load shared services once across the entire application:

**NEW FILE: `Helpers/UnifiedDataSearch.global.json`**
```json
{
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js"
    ],
    "styles": [],
    "widgets": []
}
```

**Updated `UnifiedOdsPmsSearchBlade.panel.json`:**
```json
{
    "id": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
    "priority": 6000,
    "width": 800,
    "height": 650,
    "minWidth": 600,
    "minHeight": 400,
    "title": "Unified ODS/PMS Search",
    "showHeader": true,
    "showFooter": false,
    "allowResize": true,
    "allowMaximize": true,
    "modal": false,
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.js"
    ],
    "styles": [
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.css"
    ],
    "templates": [
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.html"
    ],
    "components": [
        "Sharedo.UI.Framework.Components.RibbonBar"
    ]
}
```

**Updated `UnifiedOdsEntityPicker.widget.json`:**
```json
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "priority": 6000,
    "designer": {
        "allowInPortalDesigner": true,
        "allowInSharedoPortalDesigner": true,
        "allowAspectAdapter": true,
        "title": "Unified ODS/PMS Entity Picker",
        "icon": "fa-users",
        "description": "Search and select entities from both ShareDo ODS and PMS systems",
        "categories": ["Alt Custom", "Entity Selection", "Participants", "ODS"],
        "isConfigurable": false,  // Change to false until designer exists
        "defaultConfigurationJson": { /* ... existing config ... */ }
    },
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.js"
    ],
    "styles": [
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.css"
    ],
    "templates": [
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.html"
    ]
}
```

### Option 2: Keep Current Pattern (With Fixes)

If global include is not possible, fix the current files:

**Updated `UnifiedOdsPmsSearchBlade.panel.json`:**
```json
{
    "id": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
    "priority": 6000,
    "width": 800,
    "height": 650,
    "minWidth": 600,
    "minHeight": 400,
    "title": "Unified ODS/PMS Search",
    "showHeader": true,
    "showFooter": false,
    "allowResize": true,
    "allowMaximize": true,
    "modal": false,
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.js"
    ],
    "styles": [
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.css"
    ],
    "templates": [
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.html"
    ],
    "components": [
        "Sharedo.UI.Framework.Components.RibbonBar"
    ]
    // REMOVED: "dependencies" array
}
```

**Updated `UnifiedOdsEntityPicker.widget.json`:**
```json
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "priority": 6000,
    "designer": {
        // ... existing designer config ...
        "isConfigurable": false  // Change to false until designer exists
    },
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.js"
    ],
    "styles": [
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.css"
    ],
    "templates": [
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.html"
    ]
    // REMOVED: "components" and "dependencies" arrays
}
```

## Impact on Inline Search Specification

### New Shared Services to Add

When implementing the inline search specification, the new services need to be added to script loading:

**For NEW Services (UnifiedSearchService.js, OdsImportService.js):**

1. **If using Global Include (Option 1):**
   Add to `Helpers/UnifiedDataSearch.global.json`:
   ```json
   "scripts": [
       "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/UnifiedSearchService.js",      // NEW
       "/_ideFiles/Alt/UnifiedDataSearch/Services/OdsImportService.js"           // NEW
   ]
   ```

2. **If using Current Pattern (Option 2):**
   Add to BOTH panel.json and widget.json before the blade/widget script:
   ```json
   "scripts": [
       "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
       "/_ideFiles/Alt/UnifiedDataSearch/Services/UnifiedSearchService.js",      // NEW
       "/_ideFiles/Alt/UnifiedDataSearch/Services/OdsImportService.js",          // NEW
       "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.js"    // or widget.js
   ]
   ```

### Service Initialization Pattern

Services should follow ShareDo singleton pattern:

```javascript
// Service Definition
namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.UnifiedSearchService = function(config) {
    var self = this;
    self.config = config || {};
    // ... implementation
};

// NO automatic singleton creation - let components instantiate with their config
```

**In Widget/Blade:**
```javascript
// Each component creates its own configured instance
self.searchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({
    useMockPms: self.options.useMockPms,
    labels: self.options.labels
});
```

## Script Loading Order Requirements

The correct loading order must be:

1. **namespace.js** - Must be first (defines namespace function)
2. **Services** - Must be before components that use them
3. **Models** - If used, load before services/components
4. **Component script** - Must be last (blade.js or widget.js)

## Testing Script Loading

To verify scripts are loading correctly:

```javascript
// In browser console after loading
console.log(typeof Alt.UnifiedDataSearch); // Should be "object"
console.log(typeof Alt.UnifiedDataSearch.Services); // Should be "object"
console.log(typeof Alt.UnifiedDataSearch.Services.MockPmsService); // Should be "function"
console.log(typeof Alt.UnifiedDataSearch.Services.mockPmsService); // Should be "object" (instance)
```

## Immediate Actions Required

1. **Remove `dependencies` arrays** from both JSON files
2. **Set `isConfigurable: false`** in widget.json (designer doesn't exist)
3. **Choose Option 1 or 2** for script loading pattern
4. **Test script loading** in browser console
5. **Update specification** to include correct script registration for new services

## Benefits of Global Include (Option 1)

- ✅ **No duplicate loading** - Services loaded once globally
- ✅ **Cleaner JSON files** - Blade/widget JSON only reference their own files
- ✅ **Easier maintenance** - Add new services in one place
- ✅ **Better performance** - Scripts cached and loaded once
- ✅ **Standard ShareDo pattern** - Used by other modules

## Risks of Current Pattern (Option 2)

- ⚠️ **Duplicate script loading** - Same services loaded multiple times
- ⚠️ **Maintenance burden** - Update multiple files when adding services
- ⚠️ **Potential conflicts** - Services might initialize multiple times
- ⚠️ **Performance impact** - Redundant script parsing

## Recommendation

**Use Option 1 (Global Include Pattern)** for the following reasons:
1. Aligns with ShareDo best practices
2. Prevents duplicate script loading
3. Easier to maintain
4. Better performance
5. Cleaner separation of concerns

The inline search specification should be updated to reflect this script loading pattern.