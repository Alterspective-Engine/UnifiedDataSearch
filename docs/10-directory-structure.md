# Directory Structure

## Complete File Organization

```
_IDE/Alt/UnifiedDataSearch/
├── SPECIFICATION.md           # Original requirements
├── IMPLEMENTATION_PLAN.md     # Implementation strategy
├── CLAUDE.md                  # Main guide (references docs/)
├── docs/                      # Modular documentation
│   ├── README.md             # Documentation index
│   ├── 01-overview.md        # Project overview
│   ├── 02-quick-setup.md     # Quick start guide
│   └── ...                   # Other doc files
├── Helpers/
│   └── namespace.js          # Namespace utility
├── Models/
│   ├── UnifiedSearchResult.js # Result model
│   └── DataConflict.js       # Conflict model
├── Services/
│   ├── MockPmsService.js     # Mock PMS data
│   ├── ResultMergerService.js # Result merging
│   └── ConflictDetectorService.js # Conflict detection
├── Blades/
│   └── UnifiedOdsPmsSearch/
│       ├── UnifiedOdsPmsSearchBlade.panel.json # Blade config
│       ├── blade.html        # Blade template
│       ├── blade.js          # Blade logic
│       └── blade.css         # Blade styles
└── Widgets/
    └── UnifiedOdsEntityPicker/
        ├── UnifiedOdsEntityPicker.widget.json # Widget config
        ├── UnifiedOdsEntityPicker.html        # Widget template
        ├── UnifiedOdsEntityPicker.js          # Widget logic
        └── UnifiedOdsEntityPicker.css         # Widget styles
```

## File Naming Conventions

### Blades
- Config: `[BladeName].panel.json`
- Logic: `blade.js`
- Template: `blade.html`
- Styles: `blade.css`

### Widgets
- Config: `[WidgetName].widget.json`
- Logic: `[WidgetName].js`
- Template: `[WidgetName].html`
- Styles: `[WidgetName].css`

### Services
- Name: `[ServiceName]Service.js`
- Instance: Created as singleton

## Path References

### In Panel/Widget JSON
```json
"scripts": [
    "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
    "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js"
]
```

### In JavaScript
```javascript
namespace("Alt.UnifiedDataSearch.Services");
Alt.UnifiedDataSearch.Services.MockPmsService = function() { };
```

## Important Notes
- Always use `/_ideFiles/` prefix for ShareDo
- Follow existing naming patterns
- Keep related files together
- Documentation in `docs/` folder

## Related Documentation
- [Quick Setup](02-quick-setup.md) - Creating the structure
- [Blade Implementation](11-blade-implementation.md) - Blade details