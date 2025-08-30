# Quick Setup Guide

## Prerequisites
- ShareDo environment with IDE access
- Basic understanding of ShareDo blade/widget architecture
- Access to `/_ideFiles/` directory

## Quick Start

### 1. Create Directory Structure
```
_IDE/Alt/UnifiedDataSearch/
├── docs/           (documentation)
├── Helpers/        (namespace helper)
├── Services/       (mock and merger services)
├── Blades/         (search blade)
└── Widgets/        (entity picker widget)
```

### 2. Test with Mock Data
Open browser console and run:
```javascript
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    mode: "auto",
    useMockPms: true
});
```

### 3. Integration Points
- Work item UI configuration
- Aspect widgets
- Participant management

## Important Notes
- Always use `$ui.stacks.openPanel()` NOT `$ui.showBlade()` (doesn't exist!)
- Mock PMS service stores data in localStorage
- Events are published for widget refresh

## Next Steps
- [Directory Structure](10-directory-structure.md) - Detailed file organization
- [Testing Guide](13-testing.md) - Complete testing instructions