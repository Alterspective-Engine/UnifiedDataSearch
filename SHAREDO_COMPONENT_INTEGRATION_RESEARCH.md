# ShareDo OdsEntityPicker Component Integration Research

## Executive Summary

After thorough investigation of the `sharedo-core-case-ods-entity-picker` component, we have determined that it has **hardcoded blade opening behavior that cannot be overridden through configuration**. This document outlines our findings and the recommended approach for integrating unified ODS/PMS search functionality.

## Research Findings

### 1. Component Behavior Analysis

The `sharedo-core-case-ods-entity-picker` component has the following hardcoded behaviors:

#### Blade Opening Logic (Cannot Be Changed)
- **For Existing Participants**: Opens `Sharedo.Core.Case.Panels.Participants.AddEditParticipant`
- **For ODS Persons**: Opens `Sharedo.Core.Case.Panels.Ods.AddEditPerson`
- **For ODS Organisations**: Opens `Sharedo.Core.Case.Panels.Ods.AddEditOrganisation`

#### Technical Implementation
- Uses `$ui.stacks.openPanel()` internally (correct ShareDo pattern)
- Does NOT use `$ui.showBlade()` (this method doesn't exist in ShareDo)
- No configuration parameters available to override blade selection

### 2. Configuration Limitations

#### What We CAN Control:
- Search button behavior (can be intercepted)
- Display options (card/list view)
- Role configuration
- Validation settings
- Multiple selection settings

#### What We CANNOT Control:
- Which blade opens when an entity is clicked
- Entity click behavior customization
- Blade configuration for entity viewing/editing
- Internal navigation logic

### 3. Event System Analysis

#### Available Events:
- Component may publish search initiation events
- Standard ShareDo participant update events
- Component lifecycle events

#### Limitations:
- No event cancellation mechanism for entity clicks
- Cannot prevent default blade opening behavior
- Limited event interception capabilities

## Recommended Solution: Dual-Mode Implementation

Based on our research, we recommend implementing TWO distinct modes for the UnifiedOdsEntityPicker widget:

### Mode 1: Simple Mode (RECOMMENDED DEFAULT)

**Use this mode for 90% of implementations**

```javascript
{
    useShareDoComponent: false,
    displayMode: "simple",
    bladeName: "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"
}
```

#### Advantages:
✅ Full control over all interactions  
✅ Custom blade opens for both search AND entity viewing  
✅ Consistent user experience  
✅ No dependency on ShareDo component limitations  
✅ Predictable behavior across all scenarios  

#### Disadvantages:
❌ Different visual appearance from standard ShareDo pickers  
❌ Requires custom styling maintenance  

#### When to Use:
- New implementations
- When unified search is the primary requirement
- When you need control over entity viewing/editing
- For PMS-integrated environments

### Mode 2: Component Mode (LIMITED USE)

**Use this mode ONLY when visual consistency is mandatory**

```javascript
{
    useShareDoComponent: true,
    displayMode: "component",
    roleSystemName: "client",
    viewMode: "card"
}
```

#### Advantages:
✅ Matches ShareDo's standard visual design  
✅ Automatic theming support  
✅ Familiar to existing ShareDo users  
✅ Can override search functionality  

#### Disadvantages:
❌ CANNOT override entity click behavior  
❌ Opens standard ShareDo blades for entity viewing  
❌ Limited customization options  
❌ Dependency on ShareDo component availability  
❌ Inconsistent experience (custom search, standard viewing)  

#### When to Use:
- ONLY when visual consistency is absolutely critical
- When standard entity viewing behavior is acceptable
- In environments with strict UI standards
- When users are already familiar with ShareDo components

## Implementation Decision Matrix

| Requirement | Simple Mode | Component Mode |
|------------|------------|----------------|
| Custom search blade | ✅ Yes | ✅ Yes (search only) |
| Custom entity view blade | ✅ Yes | ❌ No |
| Visual consistency | ⚠️ Custom | ✅ ShareDo standard |
| Full control | ✅ Yes | ❌ Limited |
| PMS integration | ✅ Optimal | ⚠️ Partial |
| Maintenance burden | ⚠️ Higher | ✅ Lower |
| User experience consistency | ✅ Consistent | ❌ Mixed |

## Technical Implementation Guidelines

### For Simple Mode Implementation

1. **Create custom UI components**
   ```javascript
   // Full control over the UI
   self.openUnifiedSearchBlade = function() {
       $ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
           mode: "select",
           onSelect: function(entity) {
               self.handleEntitySelection(entity);
           }
       });
   };
   ```

2. **Handle entity interactions**
   ```javascript
   self.viewEntity = function(entity) {
       // Open YOUR custom blade for viewing
       $ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.EntityViewer", {
           entity: entity,
           mode: "view"
       });
   };
   ```

### For Component Mode Implementation

1. **Configure ShareDo component**
   ```javascript
   self.shareDoComponentConfig = {
       sharedoId: self.options.sharedoId,
       roleConfigModels: [roleConfig],
       // Can only control display options
       viewMode: "card",
       allowMultiple: false
   };
   ```

2. **Override search only**
   ```javascript
   // Attempt to intercept search events
   $ui.events.subscribe("Sharedo.Core.Case.OdsEntityPicker.SearchRequested", 
       function(data) {
           // Can override search
           self.openUnifiedSearchBlade();
       }
   );
   // NOTE: Cannot override entity click behavior
   ```

## Migration Path

For existing implementations using ShareDo components:

1. **Phase 1**: Implement Simple Mode alongside existing components
2. **Phase 2**: Test with users, gather feedback
3. **Phase 3**: Gradually migrate to Simple Mode
4. **Phase 4**: Keep Component Mode only where absolutely necessary

## Conclusion

### Primary Recommendation
**Use Simple Mode as the default implementation** for the UnifiedOdsEntityPicker widget. This provides the best user experience and full control over the unified search functionality.

### Secondary Option
Reserve Component Mode for specific scenarios where visual consistency with existing ShareDo components is mandatory and the limitations are acceptable.

### Key Takeaway
The ShareDo `sharedo-core-case-ods-entity-picker` component's hardcoded blade opening behavior is a significant limitation that cannot be overcome through configuration. Our dual-mode approach provides flexibility while acknowledging these constraints.

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Main implementation guide
- [SPECIFICATION.md](./SPECIFICATION.md) - Original requirements
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Development roadmap
- [Widgets/UnifiedOdsEntityPicker/README.md](./Widgets/UnifiedOdsEntityPicker/README.md) - Widget documentation

## Document History

- **2024-01-XX**: Initial research and documentation
- **Research Conducted By**: AI Assistant based on ShareDo knowledge base analysis
- **Findings Status**: Confirmed through knowledge base investigation