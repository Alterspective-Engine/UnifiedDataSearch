# Unified ODS/PMS Search Blade Specification

## Overview
A **frontend-only** unified search blade that enables users to search for persons and organisations across both ShareDo ODS (Organisational Data Store) and external PMS (Practice Management System) in a single interface. This solution requires **NO backend changes** - all functionality is implemented in client-side JavaScript. The blade consolidates results, provides clear source indicators, and handles automatic data synchronization between systems.

## Domain Structure
- **Location**: `_IDE/Alt/UnifiedDataSearch/`
- **Blade Name**: `UnifiedOdsPmsSearch`
- **Full ID**: `Alt.UnifiedDataSearch.UnifiedOdsPmsSearch`

## Core Features

### 1. Unified Search Interface
- Single search input for querying both ODS and PMS simultaneously
- Support for both Person and Organisation entity types
- Real-time search with debouncing (500ms delay)
- Pagination support for large result sets

### 2. Result Display & Indicators
- **ShareDo-only results**: Badge/icon indicating "ShareDo" source
- **PMS-only results**: Badge/icon indicating "PMS" source  
- **Matched records**: Special indicator showing "Synced" or "Matched" status
- **Data conflicts**: Visual indicator when ShareDo and PMS data differs

### 3. Selection Actions

#### ShareDo Records
- Default: Standard ShareDo behavior (same as `Sharedo.Core.Case.Panels.Ods.OdsSearch`)
- Configurable via settings to open specific blades

#### PMS Records
- Default: Automatically add to ShareDo ODS
- Configurable action blade via settings:
  - `alt.ods.person.external.search.actionBlade` for persons
  - `alt.ods.organisation.external.search.actionBlade` for organisations
- Example: Open `Sharedo.Core.Case.Panels.Ods.AddEditPerson` for review before adding

#### Matched Records (Existing in Both)
- Default: Same as ShareDo-only behavior
- Configurable via settings for custom handling
- Data conflict resolution when differences detected

### 4. Data Synchronization
- Setting: `alt.ods.unified.search.conflictResolution`
  - Options: "ignore", "prompt", "autoUpdate", "review"
- When data differs between systems:
  - Display conflict indicator
  - Option to review differences
  - Ability to update either/both systems (permission-dependent)

## Technical Architecture

### Frontend-Only Architecture
**IMPORTANT**: This entire solution is implemented in client-side JavaScript only:
- NO backend API changes required
- NO server-side code modifications
- NO database schema changes
- NO new REST endpoints
- ALL logic runs in the browser
- Uses ONLY existing ShareDo APIs

### Configuration Schema
```javascript
{
    // Core search configuration
    searchMode: "unified", // "unified", "odsOnly", "pmsOnly"
    entityTypes: ["person", "organisation"],
    
    // Context from work item
    sharedoId: "{{sharedoId}}",
    sharedoTypeSystemName: "{{sharedoTypeSystemName}}",
    parentSharedoId: null,
    
    // Participant configuration
    addNewParticipantsToSharedoId: null,
    forRoleSystemName: null,
    allowedParticipantRoles: [],
    
    // Display options
    rowsPerPage: 20,
    showDataSourceIndicators: true,
    showConflictIndicators: true,
    
    // Action configuration
    allowAddNew: true,
    tryAutoAddParticipant: false,
    promptOnPmsAdd: true,
    
    // PMS integration settings
    pmsProvider: "default", // Configured PMS provider
    pmsSearchTimeout: 5000,
    
    // Conflict handling
    conflictResolutionMode: "prompt", // "ignore", "prompt", "autoUpdate", "review"
    allowBidirectionalSync: false
}
```

### API Endpoints (Using ONLY Existing ShareDo APIs)

**IMPORTANT**: This solution uses ONLY existing ShareDo APIs. NO new backend endpoints or services are required.

#### Search Endpoints
- **ODS Search**: `/api/ods/search` (existing ShareDo API)
  - Standard ODS search functionality
  
- **External Search**: `/api/ods/externalSearch/providers/{providerSystemName}/{type}`
  - **NOTE**: This assumes PMS is already configured as an external search provider in ShareDo
  - If PMS is not available as a provider, we will use a mock/simulator approach (see below)
  - Parameters: `page`, `q`
  - type: "persons" or "organisations"

#### Participant Management (Existing APIs)
- **Add Participant**: `/api/v2/participants` 
- **Get Participant Roles**: `/api/v2/public/participants/roles`
- **ODS Entity Operations**: Standard ODS APIs for adding/updating entities

#### Settings API (Existing)
- **Get Settings**: `/api/v2/public/settings/{settingName}`
  - Used to retrieve configuration for action blades and conflict resolution

### Implementation Strategy (Frontend-Only Solution)

This is a **100% frontend JavaScript solution** with no backend changes:

1. **Parallel API Calls**: Execute searches from the browser
   - Call `/api/ods/search` for ShareDo ODS data
   - For PMS data, use one of these approaches:
     - If PMS is configured as external provider: Call `/api/ods/externalSearch/providers/pms/{type}`
     - If no PMS provider exists: Use mock data service (see Mock PMS section below)

2. **Client-Side Processing**: All logic in JavaScript
   - Merge results in the browser
   - Match detection using JavaScript algorithms
   - Conflict identification in frontend code
   - All UI state management in Knockout observables

3. **Mock PMS Provider (Fallback Option)**:
   If no real PMS integration exists, implement a JavaScript mock service that:
   - Simulates PMS search responses
   - Returns test data for demonstration
   - Can be replaced with real API calls when PMS integration is available
   - Stored in browser localStorage for persistence

### Result Data Structure
```javascript
{
    success: true,
    results: [
        {
            // Core fields
            id: "unique-result-id",
            entityType: "person", // or "organisation"
            displayName: "John Smith",
            
            // Source information
            source: "sharedo", // "sharedo", "pms", "matched"
            odsId: "ODS-123",
            pmsId: "PMS-456",
            
            // Match information
            isMatched: false,
            matchConfidence: 0.95,
            hasConflicts: false,
            
            // Data fields
            data: {
                // Common fields
                firstName: "John",
                lastName: "Smith",
                email: "john.smith@example.com",
                // ... other fields
            },
            
            // Conflict information (if applicable)
            conflicts: [
                {
                    field: "email",
                    odsValue: "john@example.com",
                    pmsValue: "j.smith@example.com"
                }
            ]
        }
    ],
    totalResults: 150,
    page: 0,
    pageSize: 20,
    hasMore: true
}
```

## UI Components

### Search Progress Indicator
A visual component showing real-time search progress across both systems:

```html
<div class="search-progress-indicator" data-bind="visible: isSearching">
    <div class="search-systems">
        <!-- ShareDo ODS Search Status -->
        <div class="search-system" data-bind="css: { 'completed': odsSearchComplete, 'error': odsSearchError }">
            <div class="system-icon">
                <i class="fa fa-database"></i>
            </div>
            <div class="system-name">ShareDo ODS</div>
            <div class="system-status">
                <!-- ko if: !odsSearchComplete() && !odsSearchError() -->
                <div class="spinner">
                    <i class="fa fa-spinner fa-spin"></i>
                </div>
                <!-- /ko -->
                <!-- ko if: odsSearchComplete() -->
                <div class="checkmark">
                    <i class="fa fa-check-circle"></i>
                </div>
                <span class="result-count" data-bind="text: odsResultCount() + ' results'"></span>
                <!-- /ko -->
                <!-- ko if: odsSearchError() -->
                <div class="error-mark">
                    <i class="fa fa-exclamation-circle"></i>
                </div>
                <!-- /ko -->
            </div>
        </div>
        
        <!-- Connector Line with Animation -->
        <div class="connector">
            <div class="pulse-line"></div>
        </div>
        
        <!-- PMS Search Status -->
        <div class="search-system" data-bind="css: { 'completed': pmsSearchComplete, 'error': pmsSearchError }">
            <div class="system-icon">
                <i class="fa fa-briefcase"></i>
            </div>
            <div class="system-name">PMS System</div>
            <div class="system-status">
                <!-- ko if: !pmsSearchComplete() && !pmsSearchError() -->
                <div class="spinner">
                    <i class="fa fa-spinner fa-spin"></i>
                </div>
                <!-- /ko -->
                <!-- ko if: pmsSearchComplete() -->
                <div class="checkmark">
                    <i class="fa fa-check-circle"></i>
                </div>
                <span class="result-count" data-bind="text: pmsResultCount() + ' results'"></span>
                <!-- /ko -->
                <!-- ko if: pmsSearchError() -->
                <div class="error-mark">
                    <i class="fa fa-exclamation-circle"></i>
                </div>
                <span class="error-text">Timeout</span>
                <!-- /ko -->
            </div>
        </div>
    </div>
    
    <!-- Overall Progress Bar -->
    <div class="overall-progress">
        <div class="progress-bar">
            <div class="progress-fill" data-bind="style: { width: searchProgressPercent() + '%' }"></div>
        </div>
        <div class="progress-text" data-bind="text: searchProgressText"></div>
    </div>
</div>
```

### CSS for Search Progress Indicator
```css
.search-progress-indicator {
    padding: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.search-systems {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    margin-bottom: 15px;
}

.search-system {
    background: white;
    border-radius: 8px;
    padding: 20px;
    min-width: 180px;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
}

.search-system.completed {
    background: #f0fdf4;
    border: 2px solid #22c55e;
}

.search-system.error {
    background: #fef2f2;
    border: 2px solid #ef4444;
}

.system-icon {
    font-size: 32px;
    color: #667eea;
    margin-bottom: 10px;
}

.search-system.completed .system-icon {
    color: #22c55e;
}

.search-system.error .system-icon {
    color: #ef4444;
}

.system-name {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 10px;
    color: #1f2937;
}

.system-status {
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.spinner {
    color: #667eea;
}

.checkmark {
    color: #22c55e;
    font-size: 20px;
    animation: checkmarkPop 0.4s ease;
}

@keyframes checkmarkPop {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

.connector {
    position: relative;
    width: 60px;
    height: 2px;
    background: rgba(255,255,255,0.3);
}

.pulse-line {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 20px;
    background: white;
    animation: pulse-move 1.5s infinite;
}

@keyframes pulse-move {
    0% { left: 0; opacity: 0; }
    50% { opacity: 1; }
    100% { left: calc(100% - 20px); opacity: 0; }
}

.overall-progress {
    margin-top: 10px;
}

.progress-bar {
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: white;
    transition: width 0.3s ease;
    border-radius: 3px;
}

.progress-text {
    text-align: center;
    color: white;
    font-size: 12px;
    margin-top: 5px;
}
```

### Search Header
```html
<div class="unified-search-header">
    <div class="search-input-group">
        <input type="text" placeholder="Search for person or organisation..." 
               data-bind="value: searchQuery, valueUpdate: 'input'" />
        <button data-bind="click: search">
            <i class="fa fa-search"></i> Search
        </button>
    </div>
    
    <div class="search-filters">
        <label>
            <input type="checkbox" data-bind="checked: includeOds" />
            ShareDo ODS
        </label>
        <label>
            <input type="checkbox" data-bind="checked: includePms" />
            PMS System
        </label>
    </div>
</div>
```

### Result Card Template
```html
<div class="search-result-card" data-bind="css: { 'has-conflicts': hasConflicts }">
    <div class="result-header">
        <span class="result-name" data-bind="text: displayName"></span>
        <span class="source-badge" data-bind="css: sourceClass">
            <i data-bind="css: sourceIcon"></i>
            <span data-bind="text: sourceLabel"></span>
        </span>
    </div>
    
    <div class="result-details">
        <!-- Entity-specific details -->
    </div>
    
    <!-- ko if: hasConflicts -->
    <div class="conflict-indicator">
        <i class="fa fa-exclamation-triangle"></i>
        Data differences detected
    </div>
    <!-- /ko -->
    
    <div class="result-actions">
        <button data-bind="click: $parent.selectEntity">
            Select
        </button>
        <!-- ko if: hasConflicts -->
        <button data-bind="click: $parent.reviewConflicts">
            Review Differences
        </button>
        <!-- /ko -->
    </div>
</div>
```

## Mock PMS Provider Implementation

Since we cannot modify the backend, we'll implement a JavaScript mock PMS provider for development/demonstration:

### MockPmsService.js
```javascript
Alt.UnifiedDataSearch.Services.MockPmsService = function() {
    var self = this;
    
    // Mock data stored in browser
    self.mockPersons = [
        { 
            id: "PMS-P001", 
            firstName: "John", 
            lastName: "Smith", 
            email: "john.smith@pms.com",
            phone: "0412345678",
            source: "pms"
        },
        // ... more mock data
    ];
    
    self.mockOrganisations = [
        {
            id: "PMS-O001",
            name: "ABC Legal Services",
            abn: "12345678901",
            email: "contact@abclegal.com",
            source: "pms"
        },
        // ... more mock data
    ];
    
    // Load/save from localStorage for persistence
    self.loadMockData = function() {
        var stored = localStorage.getItem('alt.mockPmsData');
        if (stored) {
            var data = JSON.parse(stored);
            self.mockPersons = data.persons || self.mockPersons;
            self.mockOrganisations = data.organisations || self.mockOrganisations;
        }
    };
    
    self.search = function(type, query, page) {
        var deferred = $.Deferred();
        
        // Simulate API delay
        setTimeout(function() {
            var dataset = type === "persons" ? self.mockPersons : self.mockOrganisations;
            
            // Simple search filter
            var results = dataset.filter(function(item) {
                var searchText = JSON.stringify(item).toLowerCase();
                return searchText.indexOf(query.toLowerCase()) > -1;
            });
            
            // Paginate
            var pageSize = 10;
            var paged = results.slice(page * pageSize, (page + 1) * pageSize);
            
            deferred.resolve({
                success: true,
                results: paged,
                totalResults: results.length,
                page: page,
                hasMore: results.length > (page + 1) * pageSize
            });
        }, 300); // Simulate network delay
        
        return deferred.promise();
    };
    
    self.loadMockData();
};

// Singleton instance
Alt.UnifiedDataSearch.Services.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();
```

## Example Implementation Code

### Search Progress Tracking
```javascript
// In blade.js - Initialize observables for progress tracking
Sharedo.Core.Case.Panels.Ods.UnifiedOdsPmsSearch = function(element, configuration, stackModel) {
    var self = this;
    
    // ... other initialization ...
    
    // Progress tracking observables
    self.isSearching = ko.observable(false);
    
    // ODS search status
    self.odsSearchComplete = ko.observable(false);
    self.odsSearchError = ko.observable(false);
    self.odsResultCount = ko.observable(0);
    
    // PMS search status
    self.pmsSearchComplete = ko.observable(false);
    self.pmsSearchError = ko.observable(false);
    self.pmsResultCount = ko.observable(0);
    
    // Overall progress
    self.searchProgressPercent = ko.computed(function() {
        var progress = 0;
        if (self.odsSearchComplete() || self.odsSearchError()) progress += 50;
        if (self.pmsSearchComplete() || self.pmsSearchError()) progress += 50;
        return progress;
    });
    
    self.searchProgressText = ko.computed(function() {
        if (!self.isSearching()) return "";
        if (self.searchProgressPercent() === 100) return "Search complete";
        if (self.searchProgressPercent() === 50) return "Waiting for " + 
            (self.odsSearchComplete() ? "PMS" : "ShareDo");
        return "Searching both systems...";
    });
};

### Search Execution with Progress
```javascript
Sharedo.Core.Case.Panels.Ods.UnifiedOdsPmsSearch.prototype.executeSearch = function() {
    var self = this;
    var query = self.searchQuery();
    var page = self.page();
    
    // Reset status indicators
    self.isSearching(true);
    self.odsSearchComplete(false);
    self.odsSearchError(false);
    self.pmsSearchComplete(false);
    self.pmsSearchError(false);
    self.odsResultCount(0);
    self.pmsResultCount(0);
    
    // Execute ODS search
    var odsPromise = self.searchOds(query, page)
        .done(function(results) {
            self.odsSearchComplete(true);
            self.odsResultCount(results.totalResults || results.length);
        })
        .fail(function() {
            self.odsSearchError(true);
        });
    
    // Execute PMS search with timeout handling
    var pmsPromise = self.searchPmsWithTimeout(query, page, 5000)
        .done(function(results) {
            self.pmsSearchComplete(true);
            self.pmsResultCount(results.totalResults || results.results?.length || 0);
        })
        .fail(function() {
            self.pmsSearchError(true);
        });
    
    // Process results when both complete
    $.when(odsPromise, pmsPromise)
        .always(function(odsResponse, pmsResponse) {
            // Handle results even if one failed
            var odsResults = odsResponse?.[0] || { results: [] };
            var pmsResults = pmsResponse?.[0] || { results: [] };
            
            // Merge and process results
            var mergedResults = self.mergeSearchResults(odsResults, pmsResults);
            self.searchResults(mergedResults);
            
            // Detect matches and conflicts
            self.detectMatchesAndConflicts();
            
            // Hide progress indicator after short delay
            setTimeout(function() {
                self.isSearching(false);
            }, 1000);
        });
};

// PMS search with timeout wrapper
Sharedo.Core.Case.Panels.Ods.UnifiedOdsPmsSearch.prototype.searchPmsWithTimeout = function(query, page, timeout) {
    var self = this;
    var deferred = $.Deferred();
    var timeoutHandle;
    
    // Set timeout
    timeoutHandle = setTimeout(function() {
        deferred.reject("PMS search timeout");
    }, timeout);
    
    // Execute search
    self.searchPms(query, page)
        .done(function(results) {
            clearTimeout(timeoutHandle);
            deferred.resolve(results);
        })
        .fail(function(error) {
            clearTimeout(timeoutHandle);
            deferred.reject(error);
        });
    
    return deferred.promise();
};

Sharedo.Core.Case.Panels.Ods.UnifiedOdsPmsSearch.prototype.searchOds = function(query, page) {
    var self = this;
    
    return $ajax.get("/api/ods/search", {
        q: query,
        page: page,
        pageSize: self.options.rowsPerPage,
        entityTypes: self.options.entityTypes
    });
};

Sharedo.Core.Case.Panels.Ods.UnifiedOdsPmsSearch.prototype.searchPms = function(query, page) {
    var self = this;
    var type = self.activeSearchScope().entityType === "person" ? "persons" : "organisations";
    
    // Check if PMS provider is available
    if (self.options.useMockPms || !self.pmsProviderAvailable) {
        // Use mock service (frontend-only)
        return Alt.UnifiedDataSearch.Services.mockPmsService.search(type, query, page);
    } else {
        // Use real PMS provider if configured in ShareDo
        return $ajax.get("/api/ods/externalSearch/providers/pms/" + type, {
            q: query,
            page: page
        });
    }
};
```

## Services & Dependencies

### Frontend JavaScript Services (No Backend Required)
All services are implemented as client-side JavaScript classes:

1. **MockPmsService** - JavaScript mock PMS provider for demo/testing
2. **ResultMergerService** - Client-side result merging and matching
3. **ConflictDetectorService** - JavaScript-based conflict detection
4. **LocalStorageService** - Browser storage for settings/cache
5. **AddParticipantService** - Uses existing ShareDo participant APIs

### Required Components (Existing ShareDo)
- `Sharedo.UI.Framework.Components.RibbonBar`
- `Sharedo.Core.Case.Participants.AddParticipantService`
- Custom result card widgets

## Settings Configuration

### System Settings (via API)
```
alt.ods.unified.search.enabled = true
alt.ods.unified.search.pmsProvider = "defaultPms"
alt.ods.unified.search.conflictResolution = "prompt"
alt.ods.person.external.search.actionBlade = "Sharedo.Core.Case.Panels.Ods.AddEditPerson"
alt.ods.organisation.external.search.actionBlade = "Sharedo.Core.Case.Panels.Ods.AddEditOrganisation"
alt.ods.unified.search.autoSync = false
alt.ods.unified.search.syncPermissions = "bidirectional"
```

## Implementation Phases

### Phase 1: Core Search Infrastructure
- Basic blade structure and UI
- Dual search capability (ODS + mock PMS)
- Result display with source indicators
- Basic selection handling

### Phase 2: Advanced Features
- Conflict detection and display
- Custom action blade configuration
- Data synchronization framework
- Conflict resolution UI

### Phase 3: Production Ready
- Full PMS integration
- Bidirectional sync support
- Advanced matching algorithms
- Audit logging
- Performance optimization

## Custom ODS Entity Picker Widget

### UnifiedOdsEntityPicker
A custom widget that extends the standard `Sharedo.Core.Case.Aspects.Widgets.OdsEntityPicker` functionality to open our unified search blade instead of the standard ODS search.

#### Widget Configuration
```javascript
// Widget: Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker
{
    // Inherits all configuration from OdsEntityPicker
    roleConfigModels: [...],
    showPreSharedo: true,
    showPostSharedo: true,
    participantMode: false,
    
    // Override the search blade configuration
    searchBladeName: "Alt.UnifiedDataSearch.UnifiedOdsPmsSearch",
    searchBladeConfig: {
        searchMode: "unified",
        includeExternal: true,
        pmsProvider: "default"
    }
}
```

#### Implementation Approach
The widget will:
1. Extend the base OdsEntityPicker functionality
2. Override the menu creation to use our unified search blade
3. Maintain compatibility with existing participant management workflows
4. Support the same role configuration and validation

## File Structure
```
_IDE/Alt/UnifiedDataSearch/
├── SPECIFICATION.md (this file)
├── Blades/
│   └── UnifiedOdsPmsSearch/
│       ├── UnifiedOdsPmsSearchBlade.panel.json
│       ├── blade.html
│       ├── blade.js
│       └── blade.css
├── Services/
│   ├── PmsIntegrationService.js
│   ├── DataSyncService.js
│   └── ConflictResolutionService.js
├── Widgets/
│   ├── UnifiedOdsEntityPicker/
│   │   ├── widget.js
│   │   ├── widget.html
│   │   └── widget.css
│   ├── SearchResultCard/
│   │   ├── widget.js
│   │   ├── widget.html
│   │   └── widget.css
│   └── ConflictResolver/
│       ├── widget.js
│       ├── widget.html
│       └── widget.css
└── Models/
    ├── UnifiedSearchResult.js
    └── DataConflict.js
```

## Testing Considerations

### Test Scenarios
1. Search returns results from both systems
2. Search returns results from one system only
3. Duplicate detection and matching
4. Conflict resolution workflow
5. Permission-based sync operations
6. Performance with large result sets
7. Error handling for PMS timeouts

### Mock PMS Provider
Create a mock PMS provider for development/testing that:
- Returns predictable test data
- Simulates conflicts
- Tests timeout scenarios
- Validates sync operations

## Security & Permissions

### Required Permissions
- `ods.search` - Search ODS
- `pms.search` - Search PMS
- `ods.add` - Add to ODS
- `ods.update` - Update ODS records
- `pms.update` - Update PMS records (if bidirectional sync enabled)

### Data Protection
- Audit all sync operations
- Log conflict resolutions
- Maintain data lineage
- Respect data retention policies

## Performance Targets
- Search response: < 2 seconds for typical queries
- Result rendering: < 500ms for 20 results
- Conflict detection: Real-time during search
- Max concurrent searches: 2 (ODS + PMS)

## Future Enhancements
1. Multi-PMS support (search across multiple systems)
2. Advanced duplicate detection using ML
3. Bulk operations support
4. Scheduled synchronization
5. Data quality scoring
6. Custom field mapping configuration