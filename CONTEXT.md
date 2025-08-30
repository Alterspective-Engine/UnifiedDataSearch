# UnifiedDataSearch Implementation Context

## Current State (After OOB Styling Update)

### What We Have Working
✅ **Blade Functionality** - Fully functional unified search blade
✅ **OOB Card Styling** - Widget matches ShareDo entity picker appearance  
✅ **Mock PMS Service** - Working mock data for testing
✅ **Result Merger Service** - Deduplication and matching logic
✅ **Auto-Import Logic** - In blade, can create ODS records from PMS

### What We Lost (Temporarily)
❌ **Inline Search** - Removed during OOB styling update
❌ **Quick Results** - No dropdown results in widget
❌ **Shared Services** - Code duplicated between widget and blade

## Implementation Goals

### Primary Objectives
1. **Restore Inline Search** - Add back inline search with OOB styling
2. **Share Code** - Extract common logic into shared services
3. **Maintain OOB Look** - Keep ShareDo card appearance
4. **Add Configurability** - Allow custom labels for systems

### Key Constraints
- **NO Backend Changes** - Everything must be frontend JavaScript
- **NO Blade Changes** - Blade functionality must remain identical
- **MAINTAIN Styling** - Must look like OOB ShareDo component
- **USE ShareDo APIs** - Only use existing ShareDo APIs

## Architecture Overview

```
UnifiedDataSearch/
├── Services/                      # Shared Services (NEW)
│   ├── UnifiedSearchService.js   # Core search logic (EXTRACT from blade)
│   ├── OdsImportService.js       # Auto-import logic (EXTRACT from blade)
│   ├── ResultMergerService.js    # Already exists (ENHANCE)
│   └── MockPmsService.js         # Already exists (KEEP)
│
├── Widgets/
│   └── UnifiedOdsEntityPicker/
│       ├── Widget uses shared services
│       └── Inline search UI layer
│
└── Blades/
    └── UnifiedOdsPmsSearch/
        ├── Blade uses shared services
        └── Full search UI remains unchanged
```

## Critical Code Patterns to Preserve

### 1. ShareDo Card Structure (MUST KEEP)
```html
<div class="card entity-card">
    <div class="status-section"><!-- Icon --></div>
    <div class="content-section"><!-- Content --></div>
    <div class="menu-section"><!-- Actions --></div>
</div>
```

### 2. ODS Entity Creation (WORKING - DON'T BREAK)
```javascript
// Person endpoint (plural)
"/api/aspects/ods/people/"

// Contact details for person (mobile, not phone)
{
    contactTypeCategoryId: 2101,
    contactTypeSystemName: "mobile",  // NOT "phone"
    contactValue: "0412345678"
}
```

### 3. Date Format (CRITICAL)
```javascript
// ShareDo PureDate format: YYYYMMDD as integer
function convertDateToShareDoFormat(dateString) {
    var parts = dateString.split('-');
    return parseInt(parts[0] + parts[1].padStart(2, '0') + parts[2].padStart(2, '0'), 10);
}
```

## Implementation Steps

### Step 1: Create Shared Services
- [ ] Extract search logic from blade → UnifiedSearchService
- [ ] Extract import logic from blade → OdsImportService
- [ ] Enhance ResultMergerService for inline needs
- [ ] Keep MockPmsService as-is

### Step 2: Update Widget HTML
- [ ] Add inline search container to card
- [ ] Add results dropdown below card
- [ ] Maintain exact card structure

### Step 3: Update Widget JavaScript
- [ ] Initialize shared services
- [ ] Add inline search observables
- [ ] Implement result selection
- [ ] Handle auto-import

### Step 4: Update Widget CSS
- [ ] Style inline input (subtle, integrated)
- [ ] Style results dropdown (ShareDo style)
- [ ] Add source indicator colors
- [ ] Ensure responsive design

### Step 5: Refactor Blade
- [ ] Replace inline logic with shared services
- [ ] Test all functionality still works
- [ ] Verify no regression

### Step 6: Configuration
- [ ] Add labels configuration
- [ ] Add mode configuration
- [ ] Test with different settings

## Testing Scenarios

### Inline Search Tests
1. Click "Click to search" → Input appears
2. Type "john" → Results appear after 500ms
3. Results show source indicators (PMS/ShareDo/Matched)
4. Click result → Entity selected
5. If PMS + auto mode → Creates ODS record

### Visual Tests
1. Empty state matches OOB
2. Search state maintains card structure
3. Selected state shows entity details
4. Source indicators visible and colored
5. Responsive on mobile

### Integration Tests
1. Widget refreshes on participant add
2. Blade opens when clicking chevron
3. Events fire correctly
4. Mock mode works
5. Real API mode works (when configured)

## Common Pitfalls to Avoid

### DON'T
- ❌ Change blade functionality
- ❌ Break OOB card structure
- ❌ Modify backend/APIs
- ❌ Use ES6 modules (use namespace)
- ❌ Forget browser compatibility

### DO
- ✅ Test every change
- ✅ Maintain card styling
- ✅ Share code via services
- ✅ Use Knockout observables
- ✅ Handle errors gracefully

## Configuration Examples

### Basic Widget Config
```javascript
{
    label: "Client",
    required: true,
    mode: "auto",
    useMockPms: true
}
```

### Advanced Config with Labels
```javascript
{
    label: "Primary Owner",
    required: true,
    mode: "auto",
    useMockPms: false,
    pmsProvider: "aderant",
    labels: {
        sharedo: "Case",
        pms: "Aderant",
        matched: "Linked"
    }
}
```

## File Checklist

### Files to Create
- [ ] Services/UnifiedSearchService.js
- [ ] Services/OdsImportService.js

### Files to Update
- [ ] Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.html
- [ ] Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.js
- [ ] Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.css
- [ ] Blades/UnifiedOdsPmsSearch/blade.js
- [ ] Services/ResultMergerService.js

### Files to Keep As-Is
- [x] Services/MockPmsService.js
- [x] Models/*
- [x] Helpers/namespace.js

## Progress Tracking

### Completed
- ✅ OOB card styling implemented
- ✅ Basic widget structure working
- ✅ Blade fully functional
- ✅ Mock service operational

### In Progress
- 🔄 Inline search specification created
- 🔄 Context document created

### To Do
- ⏳ Create shared services
- ⏳ Implement inline search
- ⏳ Add source indicators
- ⏳ Test configuration options
- ⏳ Final integration testing

## Quick Commands

```javascript
// Test inline search in console
var widget = $('[data-widget-id="your-widget-id"]').data('widget');
widget.performInlineSearch("john");

// Test auto-import
widget.importService.importEntity({ 
    firstName: "Test", 
    lastName: "User", 
    source: "pms" 
});

// Check configuration
console.log(widget.options.labels);
```

## Remember

1. **The blade works perfectly** - Don't break it!
2. **OOB styling is correct** - Maintain it!
3. **Inline search is the goal** - Focus on that!
4. **Share code via services** - DRY principle!
5. **Test everything** - Both mock and real modes!

## Final Checklist Before Commit

- [ ] Inline search works
- [ ] Blade still works
- [ ] OOB styling maintained
- [ ] Source indicators visible
- [ ] Labels configurable
- [ ] Mock mode works
- [ ] No console errors
- [ ] Events fire correctly
- [ ] Documentation updated