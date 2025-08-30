# Blade Implementation Guide

## Blade Configuration

### Panel JSON Structure
```json
{
    "id": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
    "priority": 6000,
    "width": 750,
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
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

## Blade Constructor

### Required Parameters
```javascript
function(element, configuration, stackModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    // Blade metadata
    self.blade = {
        title: ko.observable("Unified ODS/PMS Search"),
        subtitle: ko.observable("Search across ShareDo and Practice Management System"),
        ribbon: self.ribbon
    };
}
```

## Key Observables

### Search State
```javascript
self.searchQuery = ko.observable("").extend({ rateLimit: 500 });
self.isSearching = ko.observable(false);
self.hasSearched = ko.observable(false);
```

### Progress Tracking
```javascript
self.odsSearchComplete = ko.observable(false);
self.odsSearchError = ko.observable(false);
self.pmsSearchComplete = ko.observable(false);
self.pmsSearchError = ko.observable(false);
```

## Lifecycle Methods

### loadAndBind()
Called after blade is loaded:
```javascript
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.loadAndBind = function() {
    var self = this;
    
    // Check PMS provider availability
    self.checkPmsProvider();
    
    // Subscribe to search query changes
    self.searchQuery.subscribe(function(newValue) {
        if (newValue && newValue.length >= 2) {
            self.executeSearch();
        }
    });
};
```

## Search Execution

### Parallel Search
```javascript
// Execute ODS search
var odsPromise = self.searchOds(query, page);

// Execute PMS search with timeout
var pmsPromise = self.searchPmsWithTimeout(query, page, self.options.pmsTimeout);

// Wait for both to complete
$.when(odsPromise, pmsPromise)
    .always(function(odsResponse, pmsResponse) {
        // Merge results
        var merged = self.resultMergerService.mergeResults(odsResults, pmsResults);
        self.searchResults(merged);
    });
```

## Opening the Blade

### Correct Method
```javascript
// ✅ CORRECT - Use $ui.stacks.openPanel
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    sharedoId: "WI-123",
    mode: "auto",
    useMockPms: true
});
```

### Wrong Method
```javascript
// ❌ WRONG - $ui.showBlade doesn't exist!
$ui.showBlade(...);  // This will fail
```

## Closing the Blade

### With Event Publishing
```javascript
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.close = function() {
    var self = this;
    
    // Publish events if entity was selected
    if (self.selectedEntity()) {
        $ui.events.publish("Alt.UnifiedDataSearch.ParticipantAdded", {
            sharedoId: self.options.sharedoId,
            entity: self.selectedEntity()
        });
    }
    
    // Close the blade
    if (self.stackModel && self.stackModel.close) {
        self.stackModel.close();
    }
};
```

## Related Documentation
- [Event Handling](12-event-handling.md) - Event system
- [HTML Templates](18-html-templates.md) - Blade HTML
- [Configuration Options](15-configuration.md) - Blade settings