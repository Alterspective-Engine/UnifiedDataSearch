# Widget Integration Guide

## ShareDo OdsEntityPicker Component

### Research Findings
The ShareDo `sharedo-core-case-ods-entity-picker` component has **hardcoded blade opening logic** and cannot be configured to open custom blades.

The component:
- Opens `Sharedo.Core.Case.Panels.Participants.AddEditParticipant` for existing participants
- Opens `Sharedo.Core.Case.Panels.Ods.AddEditPerson` or `AddEditOrganisation` for ODS entities
- Does NOT support custom blade configuration through parameters
- Uses `$ui.stacks.openPanel()` internally (not `$ui.showBlade()` which doesn't exist)

## Our Solution: Hybrid Approach

The UnifiedOdsEntityPicker widget supports two display modes:

### 1. Simple Mode (Default)
Uses our custom UI with direct blade opening:
```javascript
{
    useShareDoComponent: false,  // Default
    displayMode: "simple"
}
```

### 2. Component Mode (Advanced)
Uses ShareDo component for display but overrides search:
```javascript
{
    useShareDoComponent: true,
    displayMode: "component",
    roleSystemName: "client",
    roleLabel: "Client",
    viewMode: "card",  // or "list"
    bladeName: "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"
}
```

## Widget Configuration

### Aspect Widget Example
```javascript
{
    "_host": {
        "model": "@parent",
        "blade": "@blade",
        "enabled": true
    },
    "useShareDoComponent": false,  // Simple mode
    "roleSystemName": "client",
    "roleLabel": "Select Client",
    "required": true,
    "allowMultiple": false,
    "mode": "auto",  // Auto-import PMS to ODS
    "fieldName": "clientOdsId",
    "returnField": "odsId"
}
```

## Mode Configuration

### Select Mode
Just returns the selected entity without creating ODS records:
```javascript
mode: "select"
```

### Auto Mode
Automatically creates ODS entities from PMS records when selected:
```javascript
mode: "auto"
```

## Limitations

### Component Mode Limitations
- Cannot override entity click behavior in ShareDo component
- Search interception depends on component event support
- Requires ShareDo component to be available in environment

### Recommendations
Use **Simple Mode** for:
- Full control over search behavior
- Consistent unified search experience
- No dependency on ShareDo internals
- Predictable blade opening behavior

Use **Component Mode** only when:
- Visual consistency with other ShareDo pickers is critical
- You need the card/list view layouts
- Standard entity viewing is acceptable

## Related Documentation
- [Display Modes](09-display-modes.md) - Detailed mode comparison
- [Configuration Options](15-configuration.md) - All configuration settings