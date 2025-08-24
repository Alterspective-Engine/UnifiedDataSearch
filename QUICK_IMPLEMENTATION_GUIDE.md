# UnifiedDataSearch - Quick Implementation Guide

## 🚀 Quick Start

### Choose Your Implementation Mode

#### Option 1: Simple Mode (RECOMMENDED) ✅

**Best for:** Most implementations, full control needed, PMS integration

```javascript
// Widget configuration
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "useShareDoComponent": false,  // ← Use custom UI
    "displayMode": "simple",
    "label": "Select Client",
    "entityTypes": ["person", "organisation"],
    "mode": "auto",  // Auto-import from PMS to ODS
    "bladeName": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"
}
```

**You get:**
- ✅ Custom search blade opens
- ✅ Custom entity view blade opens
- ✅ Full PMS integration
- ✅ Consistent experience

#### Option 2: Component Mode (LIMITED USE) ⚠️

**Best for:** When visual consistency with ShareDo is mandatory

```javascript
// Widget configuration
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "useShareDoComponent": true,  // ← Use ShareDo component
    "displayMode": "component",
    "roleSystemName": "client",
    "viewMode": "card",
    "bladeName": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"
}
```

**You get:**
- ✅ ShareDo visual styling
- ✅ Custom search blade (search button only)
- ❌ Standard ShareDo entity view blades (cannot override)
- ⚠️ Mixed user experience

## 📋 Decision Checklist

Ask yourself these questions:

1. **Do I need custom entity viewing/editing blades?**
   - Yes → Use Simple Mode
   - No → Either mode works

2. **Is visual consistency with ShareDo critical?**
   - Yes → Consider Component Mode
   - No → Use Simple Mode

3. **Do I need full PMS integration?**
   - Yes → Use Simple Mode
   - No → Either mode works

4. **Can users accept different blades for viewing entities?**
   - Yes → Component Mode possible
   - No → Use Simple Mode

**If in doubt → Use Simple Mode**

## 🔧 Basic Implementation Steps

### Step 1: Add Widget to Aspect Configuration

```json
{
    "widgets": [
        {
            "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
            "useShareDoComponent": false,
            "label": "Client",
            "required": true,
            "fieldName": "clientOdsId",
            "mode": "auto"
        }
    ]
}
```

### Step 2: Configure in Form Designer

```javascript
// In your form configuration
{
    "_host": {
        "model": "@parent",
        "blade": "@blade",
        "enabled": true
    },
    "useShareDoComponent": false,  // Your choice
    "label": "Select Participant",
    "entityTypes": ["person", "organisation"],
    "allowMultiple": false,
    "required": true
}
```

### Step 3: Handle Selected Entities

```javascript
// Subscribe to selection events
$ui.events.subscribe("Alt.UnifiedDataSearch.EntitySelected", function(data) {
    console.log("Entity selected:", data.entities);
    // Your handling code here
});
```

## ⚠️ Common Pitfalls to Avoid

### ❌ DON'T Use Component Mode If:
- You need custom entity viewing blades
- You want consistent user experience
- You need full control over interactions

### ❌ DON'T Expect These to Work in Component Mode:
```javascript
// These WON'T work with useShareDoComponent: true
{
    "customEntityViewBlade": "MyCustomBlade",  // ❌ Ignored
    "onEntityClick": "customHandler",          // ❌ Ignored
    "overrideDefaultBehavior": true           // ❌ Ignored
}
```

### ✅ DO Use Simple Mode For:
- New implementations
- PMS-integrated environments
- Custom workflows
- Consistent UX requirements

## 🎯 Mode Comparison Table

| Feature | Simple Mode | Component Mode |
|---------|------------|----------------|
| Custom Search | ✅ Full | ✅ Search only |
| Custom Entity View | ✅ Yes | ❌ No |
| ShareDo Styling | ❌ Custom | ✅ Native |
| Control Level | ✅ 100% | ⚠️ 30% |
| Best For | New projects | Legacy UI match |

## 📝 Example Configurations

### Example 1: Simple Mode with Auto-Import

```javascript
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "useShareDoComponent": false,
    "label": "Client",
    "mode": "auto",  // Auto-create ODS from PMS
    "entityTypes": ["person"],
    "required": true,
    "fieldName": "clientId"
}
```

### Example 2: Component Mode (Visual Consistency)

```javascript
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "useShareDoComponent": true,
    "roleSystemName": "client",
    "viewMode": "card",
    "allowMultiple": false
    // Note: Entity clicks will open standard ShareDo blades
}
```

### Example 3: Simple Mode with Multiple Selection

```javascript
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "useShareDoComponent": false,
    "label": "Select Participants",
    "allowMultiple": true,
    "entityTypes": ["person", "organisation"],
    "mode": "select"  // Just select, don't auto-import
}
```

## 🆘 Troubleshooting

### Issue: "Want ShareDo look but custom behavior"
**Solution:** Use Simple Mode and apply ShareDo CSS classes manually

### Issue: "Component Mode opens wrong blades"
**Solution:** This is expected behavior - use Simple Mode instead

### Issue: "Search works but entity view doesn't"
**Solution:** Component Mode limitation - switch to Simple Mode

## 📚 Further Reading

- [Full CLAUDE.md Documentation](./CLAUDE.md)
- [Component Integration Research](./SHAREDO_COMPONENT_INTEGRATION_RESEARCH.md)
- [Technical Specification](./SPECIFICATION.md)

## 💡 Remember

> **When in doubt, use Simple Mode!** It provides full control and consistent user experience. Only use Component Mode when visual consistency with ShareDo is absolutely mandatory and you can accept its limitations.