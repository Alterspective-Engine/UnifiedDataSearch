# UnifiedOdsEntityPicker Analysis & ShareDo Component Integration

## Analysis Summary

The `UnifiedOdsEntityPicker` widget **can be configured to use ShareDo's core `sharedo-core-case-ods-entity-picker` component** while maintaining control over which blade opens for search functionality.

## Current Implementation Status

### ✅ Already Implemented
1. **ShareDo Component Configuration** - The widget has infrastructure to build ShareDo component config
2. **Event Interception** - Listens for ShareDo component search events and overrides them
3. **Unified Search Integration** - Opens custom unified search blade instead of standard ODS search
4. **Designer Support** - Configuration UI includes ShareDo component options

### ⚠️ Missing Implementation
1. **`openSearchBlade` method** - Referenced in code but not defined (FIXED)
2. **Alternative HTML template** - No conditional template for ShareDo component mode (FIXED)
3. **Clear configuration examples** - Limited documentation (FIXED)

## How It Works

### Architecture Flow
```
User clicks search → ShareDo Component → Event Interception → Custom Unified Blade → Results Return
```

### 1. Component Mode Configuration
```json
{
    "useShareDoComponent": true,
    "roleSystemName": "participant",
    "roleLabel": "Select Participant",
    "viewMode": "card",
    "showSearchOds": false,
    "allowInlineSearch": false
}
```

### 2. Event Override Mechanism
```javascript
// Widget listens for ShareDo component search events
$ui.events.subscribe(
    "Sharedo.Core.Case.Components.OdsEntityPicker.searchInitiated",
    function(data) {
        data.cancel(); // Cancel default search
        self.openUnifiedSearchBlade(); // Open our custom blade
    }
);
```

### 3. HTML Template Structure
```html
<!-- Use ShareDo component when enabled -->
<!-- ko if: options.useShareDoComponent && shareDoComponentConfig -->
<!-- ko component: { 
    name: "sharedo-core-case-ods-entity-picker", 
    params: shareDoComponentConfig 
} -->
<!-- /ko -->
<!-- /ko -->

<!-- Fallback to custom UI -->
<!-- ko ifnot: options.useShareDoComponent -->
<!-- Custom implementation -->
<!-- /ko -->
```

## Configuration Options

### Basic ShareDo Component Setup
```json
{
    "useShareDoComponent": true,
    "label": "Select Client",
    "roleSystemName": "client",
    "entityTypes": ["person", "organisation"],
    "allowMultiple": false,
    "required": true,
    "searchMode": "unified",
    "bladeName": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"
}
```

### Advanced Configuration
```json
{
    "useShareDoComponent": true,
    "label": "Select Participants", 
    "roleSystemName": "participant",
    "roleLabel": "Participants",
    "viewMode": "list",
    "allowMultiple": true,
    "sharedoId": "@workItemId",
    "sharedoTypeSystemName": "matter",
    "entityTypes": ["person", "organisation"],
    "searchMode": "unified",
    "useMockPms": false,
    "bladeWidth": 800
}
```

## Benefits of Using ShareDo Component

### 1. **Consistent User Experience**
- Users see familiar ShareDo OdsEntityPicker interface
- Standard ShareDo theming and styling
- Familiar keyboard navigation and accessibility

### 2. **Enhanced Search Capability**
- Search button opens unified ODS + PMS search blade
- Standard UI with enhanced functionality
- Maintains ShareDo look-and-feel while adding PMS integration

### 3. **Best of Both Worlds**
- ShareDo component handles UI, validation, theming
- Custom blade handles unified search across systems
- Seamless integration without UI inconsistencies

### 4. **Backwards Compatibility**
- Falls back to custom UI if ShareDo component unavailable
- Configuration controls which mode to use
- Existing functionality preserved

## Files Updated/Created

### ✅ Fixed Missing Implementation
1. **UnifiedOdsEntityPicker.js** - Added missing `openUnifiedSearchBlade()` and `clearSelection()` methods
2. **UnifiedOdsEntityPicker-ShareDoComponent.html** - Created alternative template for ShareDo component mode
3. **UnifiedOdsEntityPicker.widget.json** - Added ShareDo component configuration options
4. **SHAREDO_COMPONENT_GUIDE.md** - Comprehensive configuration and usage guide

### ✅ Enhanced Designer Support
- Designer already supports ShareDo component configuration
- Configuration options include role settings, view modes, etc.

## Recommended Implementation Steps

### 1. **Enable ShareDo Component Mode**
Set `useShareDoComponent: true` in widget configuration

### 2. **Configure Role Settings**
Set appropriate `roleSystemName` (e.g., "client", "participant", "counsel")

### 3. **Test Event Interception**
Verify that clicking search in ShareDo component opens the unified blade

### 4. **Validate Results Handling**
Ensure selected entities from unified blade are properly returned to ShareDo component

## Source Code Comparison Notes

Based on the request to compare with ShareDo source code at:
`C:\Users\IgorJericevich\Alterspective\...\LastFullCodeFromDevOpsPre7.9\src\Sharedo.Web.UI\OdsEntityPicker`

The UnifiedOdsEntityPicker already implements the pattern to:
1. **Use ShareDo component for display** - Through `useShareDoComponent` option
2. **Override search behavior** - Through event interception
3. **Control which blade opens** - Through custom `openUnifiedSearchBlade()` method

## Verification Steps

### 1. **Component Loading**
- Check that `sharedo-core-case-ods-entity-picker` is available in ShareDo version
- Verify component registration in browser console

### 2. **Event Interception**
- Test that search button in ShareDo component opens unified blade
- Verify `"Sharedo.Core.Case.Components.OdsEntityPicker.searchInitiated"` event is published

### 3. **Results Flow**
- Confirm selected entities from unified blade are applied to ShareDo component
- Test multiple selection if `allowMultiple: true`

## Conclusion

The `UnifiedOdsEntityPicker` widget **is already designed to work with ShareDo's core `sharedo-core-case-ods-entity-picker` component**. The missing pieces have been implemented:

- ✅ Missing blade opening methods added
- ✅ ShareDo component template created  
- ✅ Configuration options documented
- ✅ Designer supports all necessary options

**To use**: Set `"useShareDoComponent": true` in the widget configuration and configure the role settings appropriately. The widget will display using ShareDo's standard component while opening your custom unified search blade when users click search.
