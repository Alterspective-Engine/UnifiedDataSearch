# Using ShareDo Core OdsEntityPicker Component with UnifiedOdsEntityPicker

## Overview

The `UnifiedOdsEntityPicker` widget can be configured to use ShareDo's built-in `sharedo-core-case-ods-entity-picker` component while still controlling which blade opens for search functionality.

## Configuration Options

### Enable ShareDo Component Mode

```json
{
    "useShareDoComponent": true,
    "displayMode": "component",
    "roleSystemName": "participant",
    "roleLabel": "Select Participant",
    "viewMode": "card",
    "showSearchOds": false,
    "allowInlineSearch": false
}
```

### Component Configuration Parameters

The widget builds the ShareDo component configuration using these options:

#### Required Parameters
- `useShareDoComponent: true` - Enables ShareDo component mode
- `sharedoId` - The work item ID if used in work item context
- `roleSystemName` - The participant role system name (e.g., "participant", "client", "counsel")

#### Display Options
- `label` - Label text displayed above the component
- `viewMode` - "card" or "list" display mode
- `allowMultiple` - Allow multiple entity selection
- `required` - Whether the field is mandatory

#### Search Override Options
- `showSearchOds: false` - Disables standard ODS search (we override it)
- `allowInlineSearch: false` - Disables inline search in the component
- `allowAddNew: false` - We handle "Add New" in our unified blade

## How It Works

### 1. Component Initialization
```javascript
// The widget builds ShareDo component configuration
self.shareDoComponentConfig = {
    sharedoId: self.options.sharedoId,
    parentSharedoId: self.options.parentSharedoId,
    sharedoTypeSystemName: self.options.sharedoTypeSystemName,
    roleConfigModels: [roleConfig],
    hideLabel: true, // We show our own label
    participantMode: false, // Store locally
    disabled: ko.computed(function() {
        return self._host.enabled === false;
    }),
    blade: self._host.blade
};
```

### 2. Search Event Interception
```javascript
// Listen for ShareDo component search events and override them
self.searchInterceptSubscription = $ui.events.subscribe(
    "Sharedo.Core.Case.Components.OdsEntityPicker.searchInitiated",
    function(data) {
        // Cancel the default search
        if (data && data.cancel) {
            data.cancel();
        }
        
        // Open our unified search blade instead
        self.openUnifiedSearchBlade();
    },
    self
);
```

### 3. Unified Search Blade
When the user clicks search in the ShareDo component, it opens our unified blade:
- `Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch` 
- Searches both ShareDo ODS and external PMS systems
- Returns selected entities to the component

## HTML Template Usage

### Option 1: Use Component Mode (Recommended)
```html
<!-- ko if: options.useShareDoComponent && shareDoComponentConfig -->
<!-- ko component: { 
    name: "sharedo-core-case-ods-entity-picker", 
    params: shareDoComponentConfig 
} -->
<!-- /ko -->
<!-- /ko -->
```

### Option 2: Fallback to Custom UI
```html
<!-- ko ifnot: options.useShareDoComponent -->
<!-- Custom UI implementation -->
<!-- /ko -->
```

## Widget Configuration Examples

### Basic ShareDo Component Mode
```json
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "useShareDoComponent": true,
    "label": "Select Client",
    "roleSystemName": "client",
    "entityTypes": ["person", "organisation"],
    "allowMultiple": false,
    "required": true
}
```

### Advanced Configuration
```json
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "useShareDoComponent": true,
    "label": "Select Participants",
    "roleSystemName": "participant",
    "roleLabel": "Participants",
    "viewMode": "list",
    "allowMultiple": true,
    "required": false,
    "entityTypes": ["person", "organisation"],
    "searchMode": "unified",
    "useMockPms": false,
    "bladeName": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
    "bladeWidth": 800
}
```

## Benefits of Using ShareDo Component

### 1. **Consistent UI/UX**
- Matches ShareDo's standard look and feel
- Automatic theming support
- Familiar user experience

### 2. **Built-in Functionality**
- Standard validation and error handling
- Proper accessibility support
- Responsive design
- Keyboard navigation

### 3. **Integration Benefits**
- Works seamlessly with ShareDo forms
- Proper aspect widget support
- Standard event handling
- Work item context awareness

### 4. **Controlled Search Experience**
- Users see familiar ShareDo component
- Search button opens our unified blade
- Best of both worlds: standard UI + enhanced search

## Implementation Steps

### 1. Enable Component Mode
Set `useShareDoComponent: true` in widget configuration

### 2. Configure Role Settings
Set appropriate `roleSystemName` and `roleLabel`

### 3. Override Search Behavior
The widget automatically intercepts search events and opens the unified blade

### 4. Handle Results
Selected entities from the unified blade are automatically applied to the ShareDo component

## Fallback Behavior

If ShareDo component is not available or `useShareDoComponent: false`:
- Widget falls back to custom UI implementation
- All functionality remains available
- Search button directly opens unified blade

## Event Handling

The widget publishes events when entities are selected:
```javascript
$ui.events.publish("Alt.UnifiedDataSearch.EntitySelected", {
    widgetId: self.baseModel.id,
    entities: entities,
    mode: self.options.mode
});
```

## Troubleshooting

### Component Not Loading
- Ensure ShareDo version supports `sharedo-core-case-ods-entity-picker`
- Check browser console for component registration errors
- Verify `useShareDoComponent: true` in configuration

### Search Override Not Working
- Check that `$ui.events.subscribe` is available
- Verify event name: `"Sharedo.Core.Case.Components.OdsEntityPicker.searchInitiated"`
- Ensure unified search blade is deployed and accessible

### Styling Issues
- ShareDo component uses its own styling
- Custom CSS should target the wrapper: `.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker.sharedo-component-mode`
- Avoid overriding ShareDo component internal styles
