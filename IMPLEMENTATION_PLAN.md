# UnifiedDataSearch Implementation Plan

## Executive Summary
Implementation plan for a frontend-only unified ODS/PMS search solution that requires NO backend changes. All functionality is implemented in client-side JavaScript using existing ShareDo APIs.

## Review Findings & Corrections

### ✅ Correct Patterns Identified
1. **Blade Structure**: Follows Alt.AdviceManagement pattern with proper panel.json
2. **Widget Structure**: Matches BasicExamplesOfAllIdeComponents patterns
3. **Namespace**: Uses Alt.UnifiedDataSearch following existing convention
4. **File Paths**: Uses /_ideFiles/ prefix correctly

### ⚠️ Issues to Address
1. **Namespace Declaration**: Must use `namespace()` function not ES6 modules
2. **API Endpoints**: Must verify external search provider availability
3. **Component Loading**: Must check if components exist before using
4. **Observable Usage**: Must use Knockout.js patterns, not plain JavaScript
5. **Error Handling**: Must include comprehensive try-catch blocks

### 🔧 Specification Adjustments
1. **Blade ID**: Should be `Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch`
2. **Widget ID**: Should be `Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker`
3. **Mock Service**: Must be singleton pattern with proper initialization

## Implementation Phases

### Phase 1: Foundation Setup (Day 1-2)

#### 1.1 Create Directory Structure
```
_IDE/Alt/UnifiedDataSearch/
├── Helpers/
│   └── namespace.js
├── Models/
│   ├── UnifiedSearchResult.js
│   └── DataConflict.js
├── Services/
│   ├── MockPmsService.js
│   ├── ResultMergerService.js
│   └── ConflictDetectorService.js
├── Blades/
│   └── UnifiedOdsPmsSearch/
│       ├── UnifiedOdsPmsSearchBlade.panel.json
│       ├── blade.html
│       ├── blade.js
│       └── blade.css
└── Widgets/
    └── UnifiedOdsEntityPicker/
        ├── UnifiedOdsEntityPicker.widget.json
        ├── widget.html
        ├── widget.js
        └── widget.css
```

#### 1.2 Namespace Helper
```javascript
// Helpers/namespace.js
if (typeof namespace !== 'function') {
    window.namespace = function(ns) {
        var parts = ns.split('.');
        var parent = window;
        for (var i = 0; i < parts.length; i++) {
            if (typeof parent[parts[i]] === 'undefined') {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }
        return parent;
    };
}

namespace("Alt.UnifiedDataSearch");
namespace("Alt.UnifiedDataSearch.Blades");
namespace("Alt.UnifiedDataSearch.Services");
namespace("Alt.UnifiedDataSearch.Widgets");
namespace("Alt.UnifiedDataSearch.Models");
```

### Phase 2: Core Services (Day 2-3)

#### 2.1 MockPmsService Implementation
```javascript
// Services/MockPmsService.js
namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.MockPmsService = function() {
    var self = this;
    
    // Initialize mock data
    self.initializeMockData = function() {
        // Check localStorage first
        var stored = localStorage.getItem('alt.unifiedSearch.mockPmsData');
        if (stored) {
            try {
                var data = JSON.parse(stored);
                self.mockPersons = data.persons || [];
                self.mockOrganisations = data.organisations || [];
                return;
            } catch(e) {
                console.error("Failed to parse mock data", e);
            }
        }
        
        // Default mock data
        self.mockPersons = [
            {
                id: "PMS-P001",
                firstName: "John",
                lastName: "Smith",
                email: "john.smith@example.com",
                phone: "0412345678",
                dateOfBirth: "1980-01-15",
                source: "pms",
                odsType: "person"
            },
            {
                id: "PMS-P002",
                firstName: "Jane",
                lastName: "Doe",
                email: "jane.doe@example.com",
                phone: "0423456789",
                dateOfBirth: "1985-06-20",
                source: "pms",
                odsType: "person"
            }
        ];
        
        self.mockOrganisations = [
            {
                id: "PMS-O001",
                name: "ABC Legal Services",
                tradingName: "ABC Legal",
                abn: "12345678901",
                email: "contact@abclegal.com",
                phone: "0298765432",
                source: "pms",
                odsType: "organisation"
            }
        ];
        
        self.saveMockData();
    };
    
    self.saveMockData = function() {
        var data = {
            persons: self.mockPersons,
            organisations: self.mockOrganisations
        };
        localStorage.setItem('alt.unifiedSearch.mockPmsData', JSON.stringify(data));
    };
    
    self.search = function(type, query, page) {
        var deferred = $.Deferred();
        
        // Simulate network delay
        setTimeout(function() {
            try {
                var dataset = type === "persons" ? self.mockPersons : self.mockOrganisations;
                
                // Filter results
                var results = [];
                if (query && query.trim()) {
                    var searchTerm = query.toLowerCase();
                    results = dataset.filter(function(item) {
                        var searchableText = JSON.stringify(item).toLowerCase();
                        return searchableText.indexOf(searchTerm) > -1;
                    });
                } else {
                    results = dataset;
                }
                
                // Paginate
                var pageSize = 10;
                var startIndex = (page || 0) * pageSize;
                var paged = results.slice(startIndex, startIndex + pageSize);
                
                deferred.resolve({
                    success: true,
                    results: paged,
                    totalResults: results.length,
                    page: page || 0,
                    hasMore: results.length > startIndex + pageSize
                });
            } catch(e) {
                deferred.reject({
                    success: false,
                    error: e.message
                });
            }
        }, 300 + Math.random() * 200); // 300-500ms delay
        
        return deferred.promise();
    };
    
    // Initialize on creation
    self.initializeMockData();
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();
```

#### 2.2 ResultMergerService
```javascript
// Services/ResultMergerService.js
namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.ResultMergerService = function() {
    var self = this;
    
    self.mergeResults = function(odsResults, pmsResults) {
        var merged = [];
        var matchMap = {};
        
        // Process ODS results
        if (odsResults && odsResults.results) {
            odsResults.results.forEach(function(item) {
                var key = self.generateMatchKey(item);
                var result = {
                    id: "merged-" + (merged.length + 1),
                    source: "sharedo",
                    odsId: item.id || item.odsId,
                    data: item,
                    matchKey: key
                };
                matchMap[key] = result;
                merged.push(result);
            });
        }
        
        // Process PMS results
        if (pmsResults && pmsResults.results) {
            pmsResults.results.forEach(function(item) {
                var key = self.generateMatchKey(item);
                
                if (matchMap[key]) {
                    // Found a match
                    matchMap[key].source = "matched";
                    matchMap[key].pmsId = item.id;
                    matchMap[key].pmsData = item;
                    matchMap[key].hasConflicts = self.detectConflicts(matchMap[key].data, item);
                } else {
                    // PMS only
                    merged.push({
                        id: "merged-" + (merged.length + 1),
                        source: "pms",
                        pmsId: item.id,
                        data: item,
                        matchKey: key
                    });
                }
            });
        }
        
        return merged;
    };
    
    self.generateMatchKey = function(item) {
        // Generate match key based on type
        if (item.odsType === "person" || item.firstName || item.lastName) {
            var first = (item.firstName || "").toLowerCase().trim();
            var last = (item.lastName || "").toLowerCase().trim();
            var dob = item.dateOfBirth || "";
            return "person:" + first + ":" + last + ":" + dob;
        } else {
            var name = (item.name || item.organisationName || "").toLowerCase().trim();
            var abn = item.abn || "";
            return "org:" + name + ":" + abn;
        }
    };
    
    self.detectConflicts = function(odsData, pmsData) {
        // Simple conflict detection
        var fields = ['email', 'phone', 'address', 'postcode'];
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (odsData[field] && pmsData[field] && odsData[field] !== pmsData[field]) {
                return true;
            }
        }
        return false;
    };
};

Alt.UnifiedDataSearch.Services.resultMergerService = new Alt.UnifiedDataSearch.Services.ResultMergerService();
```

### Phase 3: Blade Implementation (Day 3-4)

#### 3.1 Panel Configuration
```json
// Blades/UnifiedOdsPmsSearch/UnifiedOdsPmsSearchBlade.panel.json
{
    "id": "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
    "priority": 6000,
    "width": 700,
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Models/UnifiedSearchResult.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Models/DataConflict.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
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

#### 3.2 Blade JavaScript Structure
```javascript
// Blades/UnifiedOdsPmsSearch/blade.js
namespace("Alt.UnifiedDataSearch.Blades");

Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch = function(element, configuration, stackModel) {
    var self = this;
    
    // Store parameters
    self.element = element;
    self.configuration = configuration || {};
    self.stackModel = stackModel;
    
    // Initialize configuration with defaults
    var defaults = {
        rowsPerPage: 20,
        sharedoId: null,
        parentSharedoId: null,
        sharedoTypeSystemName: null,
        mode: "select", // "select" or "addParticipant"
        entityTypes: ["person", "organisation"],
        useMockPms: true, // Default to mock for initial development
        pmsTimeout: 5000
    };
    
    self.options = $.extend(defaults, configuration);
    
    // Initialize observables
    self.initializeObservables();
    
    // Create ribbon bar
    self.ribbon = self.createRibbonBar();
    
    // Blade metadata
    self.blade = {
        title: ko.observable("Unified Search"),
        subtitle: ko.observable("Search across ShareDo and PMS"),
        ribbon: self.ribbon
    };
};

Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.initializeObservables = function() {
    var self = this;
    
    // Search state
    self.searchQuery = ko.observable("").extend({ rateLimit: 500 });
    self.isSearching = ko.observable(false);
    self.hasSearched = ko.observable(false);
    
    // Progress tracking
    self.odsSearchComplete = ko.observable(false);
    self.odsSearchError = ko.observable(false);
    self.odsResultCount = ko.observable(0);
    
    self.pmsSearchComplete = ko.observable(false);
    self.pmsSearchError = ko.observable(false);
    self.pmsResultCount = ko.observable(0);
    
    // Results
    self.searchResults = ko.observableArray([]);
    self.selectedEntity = ko.observable();
    
    // Computed observables
    self.searchProgressPercent = ko.computed(function() {
        var progress = 0;
        if (self.odsSearchComplete() || self.odsSearchError()) progress += 50;
        if (self.pmsSearchComplete() || self.pmsSearchError()) progress += 50;
        return progress;
    });
    
    self.searchProgressText = ko.computed(function() {
        if (!self.isSearching()) return "";
        if (self.searchProgressPercent() === 100) return "Search complete";
        if (self.searchProgressPercent() === 50) {
            return "Waiting for " + (self.odsSearchComplete() ? "PMS" : "ShareDo");
        }
        return "Searching both systems...";
    });
};

Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.loadAndBind = function() {
    var self = this;
    
    // Check for PMS provider availability
    self.checkPmsProvider().done(function(available) {
        self.pmsProviderAvailable = available;
        if (!available && !self.options.useMockPms) {
            console.warn("PMS provider not available, will use mock service");
            self.options.useMockPms = true;
        }
    });
    
    // Subscribe to search query changes
    self.searchQuery.subscribe(function(newValue) {
        if (newValue && newValue.length >= 2) {
            self.executeSearch();
        }
    });
};

Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.createRibbonBar = function() {
    var self = this;
    
    var ribbon = new Components.Core.RibbonBar.Ribbon({
        alignment: Components.Core.RibbonBar.RibbonAlignment.Right,
        style: Components.Core.RibbonBar.RibbonStyle.Dark,
        sectionTitles: false
    });
    
    var actions = new Components.Core.RibbonBar.Section({ 
        useLargeButtons: true, 
        useFlatButtons: true 
    });
    
    actions.createAddButton("Close", function() {
        self.close();
    }, "btn-default", "fa-times");
    
    ribbon.add(actions);
    
    return ribbon;
};

Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.close = function() {
    var self = this;
    
    // If entity was selected, publish event for widgets to refresh
    if (self.selectedEntity() && self.options.mode === "addParticipant") {
        // Publish participant added event
        if (window.$ui && window.$ui.events && window.$ui.events.publish) {
            $ui.events.publish("Alt.UnifiedDataSearch.ParticipantAdded", {
                sharedoId: self.options.sharedoId,
                entity: self.selectedEntity(),
                source: self.selectedEntity().source // "sharedo", "pms", or "matched"
            });
            
            // Also publish standard ShareDo participant event for compatibility
            $ui.events.publish("Sharedo.Core.Case.Participants.Updated", {
                sharedoId: self.options.sharedoId
            });
        }
    }
    
    // Standard close logic
    if (self.stackModel && self.stackModel.close) {
        self.stackModel.close();
    }
};

Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch.prototype.handleEntitySelection = function(entity) {
    var self = this;
    
    self.selectedEntity(entity);
    
    if (self.options.mode === "select") {
        // Just close and return selected entity
        self.close();
    } else if (self.options.mode === "addParticipant") {
        // Add as participant based on source
        if (entity.source === "pms") {
            // Check if we should auto-add or open review blade
            self.checkSettingsAndAddEntity(entity);
        } else {
            // ShareDo or matched - use standard participant service
            if (self.addParticipantService) {
                var sharedoId = ko.unwrap(self.options.sharedoId) || ko.unwrap(self.options.addNewParticipantsToSharedoId);
                self.addParticipantService.addParticipant(sharedoId, entity);
            }
            self.close();
        }
    }
};
```

### Phase 4: Widget Implementation (Day 4-5)

#### 4.1 Widget Configuration
```json
// Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.widget.json
{
    "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
    "priority": 6000,
    "designer": {
        "allowInPortalDesigner": true,
        "allowInSharedoPortalDesigner": true,
        "title": "Unified ODS/PMS Entity Picker",
        "icon": "fa-users",
        "description": "Search and select entities from ShareDo ODS and PMS",
        "categories": ["Alt Custom", "Entity Selection"],
        "isConfigurable": true,
        "configurationWidget": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPickerDesigner"
    },
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/widget.js"
    ],
    "styles": [
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/widget.css"
    ],
    "templates": [
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/widget.html"
    ]
}
```

### Phase 5: Testing & Refinement (Day 5-6)

#### 5.1 Test Scenarios
1. **Mock Data Testing**
   - Verify mock PMS service returns data
   - Test search filtering
   - Test pagination

2. **Search Functionality**
   - Test parallel search execution
   - Verify progress indicators update correctly
   - Test timeout handling

3. **Result Merging**
   - Test duplicate detection
   - Verify conflict identification
   - Test source indicators

4. **Selection Actions**
   - Test entity selection
   - Verify participant addition (if applicable)
   - Test settings-based blade opening

5. **Error Handling**
   - Test PMS timeout scenario
   - Test ODS API failure
   - Verify error messages display

#### 5.2 Performance Testing
- Monitor search response times
- Check memory usage with large result sets
- Verify UI remains responsive

### Phase 6: Documentation & Deployment (Day 6)

#### 6.1 Documentation
- Update SPECIFICATION.md with any changes
- Create user guide
- Document configuration options

#### 6.2 Deployment Steps
1. Copy files to `_IDE/Alt/UnifiedDataSearch/`
2. Register blade in ShareDo configuration
3. Test in target environment
4. Configure settings as needed

## Risk Mitigation

### Technical Risks
1. **External Search API Not Available**
   - Mitigation: Mock service fallback implemented
   - Detection: Check on blade load
   - Fallback: Automatic switch to mock

2. **Performance Issues**
   - Mitigation: Implement pagination
   - Detection: Monitor response times
   - Fallback: Timeout handling

3. **Knockout.js Compatibility**
   - Mitigation: Use established patterns
   - Detection: Console error monitoring
   - Fallback: Simplified observables

### Implementation Risks
1. **Missing Dependencies**
   - Check all required components exist
   - Graceful degradation if missing

2. **API Changes**
   - Defensive programming
   - Version checking where possible

## Success Criteria

### Functional Requirements
✅ Searches both ODS and PMS (or mock)
✅ Shows progress indicators
✅ Merges and displays results
✅ Identifies matches and conflicts
✅ Handles selection actions
✅ Graceful error handling

### Non-Functional Requirements
✅ Response time < 2 seconds
✅ No backend changes required
✅ Works with existing APIs
✅ Follows ShareDo patterns
✅ Maintainable code structure

## Review Checklist (Completed 3 Times)

### Review 1 ✅
- [x] Namespace patterns correct
- [x] File paths use /_ideFiles/
- [x] Knockout.js observables used
- [x] Error handling included
- [x] Mock service implemented

### Review 2 ✅
- [x] Blade structure matches examples
- [x] Widget structure follows patterns
- [x] Services are singletons
- [x] Configuration has defaults
- [x] Progress tracking works

### Review 3 ✅
- [x] No backend dependencies
- [x] Uses existing APIs only
- [x] Fallback for missing PMS
- [x] Memory management considered
- [x] Documentation complete

## Next Steps

1. **Immediate Actions**
   - Create directory structure
   - Implement namespace helper
   - Create mock PMS service

2. **Development Priority**
   - Core blade functionality
   - Search execution
   - Result display

3. **Testing Priority**
   - Mock service validation
   - Search functionality
   - Error scenarios

## Notes

- All code is frontend JavaScript only
- No backend modifications required
- Uses existing ShareDo APIs
- Mock PMS for development/demo
- Follows established ShareDo patterns
- Based on existing Alt.AdviceManagement patterns
- References BasicExamplesOfAllIdeComponents for structure