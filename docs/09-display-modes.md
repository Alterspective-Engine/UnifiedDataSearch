# Display Modes Comparison

## Simple Mode vs Component Mode

### Simple Mode (Recommended)

**Configuration:**
```javascript
{
    useShareDoComponent: false,
    displayMode: "simple"
}
```

**Advantages:**
- ✅ Full control over search behavior
- ✅ Direct blade opening
- ✅ Consistent unified search experience
- ✅ No dependencies on ShareDo internals
- ✅ Predictable behavior
- ✅ Custom UI styling

**Disadvantages:**
- ❌ Different visual style from standard pickers
- ❌ Need to implement own entity display

**When to Use:**
- Most implementations
- Custom search requirements
- Need full control
- Want unified search as primary action

### Component Mode

**Configuration:**
```javascript
{
    useShareDoComponent: true,
    displayMode: "component",
    viewMode: "card"  // or "list"
}
```

**Advantages:**
- ✅ Visual consistency with ShareDo
- ✅ Built-in card/list views
- ✅ Standard entity display
- ✅ Familiar user experience

**Disadvantages:**
- ❌ Cannot override entity click behavior
- ❌ Limited customization
- ❌ Depends on component availability
- ❌ Search override may not work in all versions

**When to Use:**
- Visual consistency is critical
- Standard entity viewing is acceptable
- Need card/list view layouts

## Feature Comparison Table

| Feature | Simple Mode | Component Mode |
|---------|------------|----------------|
| Custom Search | ✅ Full control | ⚠️ Override attempt |
| Entity Display | Custom | ShareDo standard |
| Click Behavior | Customizable | Fixed (ShareDo blades) |
| Visual Style | Custom | ShareDo native |
| Dependencies | None | ShareDo component |
| Maintenance | Independent | Version dependent |

## Implementation Examples

### Simple Mode Implementation
```javascript
// Direct control over everything
self.openUnifiedSearch = function() {
    $ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
        mode: "auto",
        callback: function(selected) {
            self.selectedEntity(selected);
        }
    });
};
```

### Component Mode Implementation
```javascript
// Attempts to override search while using ShareDo display
self.initComponent = function() {
    // Component handles display
    // We try to intercept search events
    $ui.events.subscribe("ods.search.initiated", function() {
        // Open our blade instead
        self.openUnifiedSearch();
    });
};
```

## Decision Matrix

Choose **Simple Mode** if you need:
- Unified search as primary feature
- Custom behavior control
- Independent implementation
- Predictable maintenance

Choose **Component Mode** if you need:
- Visual consistency above all
- Standard ShareDo behavior
- Minimal custom code
- Existing component features

## Related Documentation
- [Widget Integration](08-widget-integration.md) - Integration overview
- [Configuration Options](15-configuration.md) - All settings