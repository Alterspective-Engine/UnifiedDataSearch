# Implementation Plan V2: Inline Search with Code Sharing

## Overview
This plan details the implementation of inline search functionality while maintaining OOB styling and sharing code between widget and blade.

## Phase 1: Create Shared Services (2 hours)

### 1.1 Create UnifiedSearchService.js
**Purpose**: Extract and centralize search logic from blade

**Tasks**:
- [ ] Create Services/UnifiedSearchService.js
- [ ] Extract search logic from blade.js
- [ ] Implement parallel ShareDo + PMS search
- [ ] Add configurable labels support
- [ ] Add timeout protection
- [ ] Test with mock data

**Code to Extract from Blade**:
```javascript
// From blade.js lines ~300-400
self.searchOds = function(query, page) { ... }
self.searchPms = function(query, page) { ... }
self.executeSearch = function() { ... }
```

### 1.2 Create OdsImportService.js
**Purpose**: Extract auto-import logic for PMS → ODS

**Tasks**:
- [ ] Create Services/OdsImportService.js
- [ ] Extract import logic from blade.js
- [ ] Add buildPersonPayload method
- [ ] Add buildOrganisationPayload method
- [ ] Add date conversion utility
- [ ] Handle contact details correctly

**Code to Extract from Blade**:
```javascript
// From blade.js lines ~500-600
self.importPmsEntity = function(entity) { ... }
self.checkSettingsAndAddPmsEntity = function(entity) { ... }
```

### 1.3 Update ResultMergerService.js
**Purpose**: Enhance for inline search needs

**Tasks**:
- [ ] Add source labeling with config
- [ ] Add result limiting for inline display
- [ ] Enhance match detection
- [ ] Add result scoring/ranking

## Phase 2: Update Widget Structure (3 hours)

### 2.1 Update Widget HTML
**File**: Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.html

**Changes**:
```html
<!-- Add to content-section after card-message-text -->
<!-- ko if: isSearchActive() -->
<div class="inline-search-container">
    <input type="text" class="inline-search-input" 
           placeholder="Type to search..."
           data-bind="textInput: inlineSearchQuery, 
                      hasFocus: isSearchActive,
                      event: { blur: handleSearchBlur }" />
</div>
<!-- /ko -->

<!-- ko ifnot: isSearchActive() -->
<div class="search-prompt" data-bind="click: activateInlineSearch">
    <i class="fa fa-search"></i>
    <span>Click to search</span>
</div>
<!-- /ko -->

<!-- Add after card div -->
<!-- ko if: showInlineResults() -->
<div class="inline-search-results">
    <!-- Loading -->
    <!-- ko if: isSearching() -->
    <div class="search-result-loading">
        <i class="fa fa-spinner fa-spin"></i>
        <span>Searching...</span>
    </div>
    <!-- /ko -->
    
    <!-- Results -->
    <!-- ko foreach: inlineSearchResults -->
    <div class="search-result-item" 
         data-bind="click: $parent.selectInlineResult">
        <div class="result-icon">
            <i data-bind="css: $parent.getEntityIcon($data)"></i>
        </div>
        <div class="result-content">
            <span class="result-name" 
                  data-bind="text: $parent.getEntityDisplayName($data)"></span>
            <span class="result-source" 
                  data-bind="text: $parent.getSourceLabel($data.source),
                             css: 'source-' + $data.source"></span>
        </div>
        <div class="result-indicators">
            <i data-bind="css: 'fa fa-circle source-indicator-' + $data.source,
                          attr: { title: $parent.getSourceLabel($data.source) }"></i>
        </div>
    </div>
    <!-- /ko -->
    
    <!-- More Results -->
    <!-- ko if: hasMoreResults() -->
    <div class="search-more-link" data-bind="click: openSearchBlade">
        <i class="fa fa-search-plus"></i>
        <span data-bind="text: options.labels.moreResults || 'View all results...'"></span>
    </div>
    <!-- /ko -->
</div>
<!-- /ko -->
```

### 2.2 Update Widget JavaScript
**File**: Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.js

**Key Additions**:
```javascript
// Initialize services
self.searchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({
    useMockPms: self.options.useMockPms,
    pmsProvider: self.options.pmsProvider,
    labels: self.options.labels,
    pmsTimeout: self.options.pmsTimeout
});

self.importService = new Alt.UnifiedDataSearch.Services.OdsImportService();

// Inline search observables
self.isSearchActive = ko.observable(false);
self.inlineSearchQuery = ko.observable("").extend({ rateLimit: 500 });
self.inlineSearchResults = ko.observableArray([]);
self.isSearching = ko.observable(false);

// Computed for showing results
self.showInlineResults = ko.computed(function() {
    return self.isSearchActive() && 
           (self.inlineSearchResults().length > 0 || 
            self.isSearching() || 
            self.inlineSearchQuery().length >= 2);
});

self.hasMoreResults = ko.computed(function() {
    return self.inlineSearchResults().length >= 10;
});

// Subscribe to search query
self.inlineSearchQuery.subscribe(function(query) {
    if (query && query.length >= self.options.inlineSearch.minCharacters) {
        self.performInlineSearch(query);
    } else {
        self.inlineSearchResults([]);
    }
});

// Methods
self.activateInlineSearch = function() {
    self.isSearchActive(true);
    self.inlineSearchQuery("");
};

self.handleSearchBlur = function() {
    // Delay to allow click on result
    setTimeout(function() {
        if (!self._keepSearchOpen) {
            self.isSearchActive(false);
            self.inlineSearchResults([]);
        }
    }, 200);
};

self.performInlineSearch = function(query) {
    self.isSearching(true);
    
    self.searchService.search(query, { 
        pageSize: self.options.inlineSearch.maxResults 
    })
    .done(function(results) {
        self.inlineSearchResults(results);
    })
    .fail(function(error) {
        console.error("Inline search failed:", error);
        self.inlineSearchResults([]);
    })
    .always(function() {
        self.isSearching(false);
    });
};

self.selectInlineResult = function(result) {
    self._keepSearchOpen = true;
    
    if (self.options.mode === "auto" && result.source === "pms") {
        // Auto-import
        self.importService.importEntity(result)
            .done(function(imported) {
                self.setSelectedEntity(imported);
                self.closeInlineSearch();
            })
            .fail(function(error) {
                alert("Failed to import: " + error);
                self._keepSearchOpen = false;
            });
    } else {
        self.setSelectedEntity(result);
        self.closeInlineSearch();
    }
};

self.closeInlineSearch = function() {
    self.isSearchActive(false);
    self.inlineSearchQuery("");
    self.inlineSearchResults([]);
    self._keepSearchOpen = false;
};

self.getSourceLabel = function(source) {
    var labels = self.options.labels || {};
    switch(source) {
        case "sharedo": return labels.sharedo || "ShareDo";
        case "pms": return labels.pms || "PMS";
        case "matched": return labels.matched || "Matched";
        default: return source;
    }
};
```

### 2.3 Update Widget CSS
**File**: Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.css

**Additions**:
```css
/* Inline Search Container */
.inline-search-container {
    margin-top: 4px;
}

.inline-search-input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    font-size: 13px;
    color: #495057;
    padding: 2px 0;
    border-bottom: 1px solid #dee2e6;
    transition: border-color 0.15s ease;
}

.inline-search-input:focus {
    border-bottom-color: #36b541;
}

/* Search Prompt */
.search-prompt {
    font-size: 13px;
    color: #6c757d;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s ease;
}

.search-prompt:hover {
    color: #495057;
}

/* Results Dropdown */
.inline-search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 2px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1050;
}

/* Result Items */
.search-result-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s ease;
    border-bottom: 1px solid #f0f0f0;
}

.search-result-item:hover {
    background: #f8f9fa;
}

.search-result-item:last-child {
    border-bottom: none;
}

/* Result Structure */
.result-icon {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    color: #6c757d;
}

.result-content {
    flex: 1;
    min-width: 0;
}

.result-name {
    font-size: 13px;
    color: #212529;
    font-weight: 500;
}

/* Source Labels */
.result-source {
    display: inline-block;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 8px;
    font-weight: 600;
    text-transform: uppercase;
}

.result-source.source-sharedo {
    background: #d4f5d6;
    color: #36b541;
}

.result-source.source-pms {
    background: #e0e7ff;
    color: #337ab7;
}

.result-source.source-matched {
    background: #fff3cd;
    color: #f39c12;
}

/* Source Indicators */
.result-indicators {
    display: flex;
    align-items: center;
    font-size: 8px;
}

.source-indicator-sharedo {
    color: #36b541;
}

.source-indicator-pms {
    color: #337ab7;
}

.source-indicator-matched {
    color: #f39c12;
}

/* Loading State */
.search-result-loading {
    padding: 20px;
    text-align: center;
    color: #6c757d;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

/* More Results Link */
.search-more-link {
    padding: 10px 12px;
    background: #f8f9fa;
    cursor: pointer;
    color: #36b541;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.15s ease;
}

.search-more-link:hover {
    background: #e9ecef;
    color: #2a9d3a;
}

/* Active Search State */
.card.entity-card.searching .status-section .fa:before {
    content: "\f002"; /* Search icon */
}
```

## Phase 3: Refactor Blade (2 hours)

### 3.1 Update Blade JavaScript
**File**: Blades/UnifiedOdsPmsSearch/blade.js

**Changes**:
```javascript
// Replace custom search logic with shared service
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch = function(element, configuration, stackModel) {
    var self = this;
    
    // Initialize shared services
    self.searchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({
        useMockPms: configuration.useMockPms,
        pmsProvider: configuration.pmsProvider || "pms",
        labels: configuration.labels || {},
        pmsTimeout: configuration.pmsTimeout || 5000
    });
    
    self.importService = new Alt.UnifiedDataSearch.Services.OdsImportService();
    
    // ... rest of blade initialization
    
    // Replace executeSearch method
    self.executeSearch = function() {
        var query = self.searchQuery();
        if (!query) return;
        
        self.isSearching(true);
        self.hasSearched(true);
        
        self.searchService.search(query, {
            pageSize: self.options.rowsPerPage,
            entityTypes: self.getSelectedEntityTypes()
        })
        .done(function(results) {
            self.searchResults(results);
        })
        .fail(function(error) {
            self.searchErrors.push("Search failed: " + error);
        })
        .always(function() {
            self.isSearching(false);
        });
    };
    
    // Replace import logic
    self.importPmsEntity = function(entity) {
        self.importService.importEntity(entity)
            .done(function(imported) {
                // Update entity with ODS ID
                entity.odsId = imported.odsId;
                entity.source = "sharedo";
                
                // Add as participant if needed
                if (self.options.mode === "addParticipant") {
                    self.addAsParticipant(entity);
                } else {
                    self.close();
                }
            })
            .fail(function(error) {
                alert("Failed to import entity: " + error);
            });
    };
};
```

## Phase 4: Testing & Polish (2 hours)

### 4.1 Test Matrix

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| Click "Click to search" | Input field appears | ⏳ |
| Type "jo" (2 chars) | Search starts after 500ms | ⏳ |
| Results appear | Shows max 10 with indicators | ⏳ |
| Click ShareDo result | Selects immediately | ⏳ |
| Click PMS result (auto mode) | Creates ODS record | ⏳ |
| Click PMS result (manual mode) | Opens blade | ⏳ |
| Source indicators | Correct colors and labels | ⏳ |
| Custom labels | Shows configured labels | ⏳ |
| Mock mode | Uses mock data | ⏳ |
| Real API mode | Uses actual APIs | ⏳ |
| Blade still works | All functionality intact | ⏳ |
| Events fire | Widget refresh works | ⏳ |

### 4.2 Configuration Testing

Test with various configurations:

```javascript
// Test 1: Basic
{
    label: "Client",
    required: true,
    mode: "auto",
    useMockPms: true
}

// Test 2: Custom Labels
{
    label: "Primary Owner",
    labels: {
        sharedo: "Case",
        pms: "Aderant",
        matched: "Linked"
    }
}

// Test 3: Manual Mode
{
    label: "Select Entity",
    mode: "manual",
    useMockPms: false,
    pmsProvider: "aderant"
}
```

## Phase 5: Documentation (1 hour)

### 5.1 Update Documentation
- [ ] Update CLAUDE.md with inline search
- [ ] Update widget README
- [ ] Add configuration examples
- [ ] Document shared services

### 5.2 Create Test Guide
- [ ] How to test inline search
- [ ] How to configure labels
- [ ] How to switch modes
- [ ] Troubleshooting guide

## Rollback Plan

If implementation causes issues:

1. **Immediate Rollback**:
   ```bash
   git checkout main
   git reset --hard [commit-before-changes]
   ```

2. **Partial Rollback**:
   - Keep shared services
   - Revert widget changes only
   - Keep blade as-is

3. **Recovery Steps**:
   - Test blade independently
   - Test widget without inline search
   - Verify OOB styling intact

## Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Search Response Time | < 1s | ⏳ |
| Code Sharing | > 80% | ⏳ |
| Test Coverage | 100% | ⏳ |
| User Clicks to Select | 2-3 | ⏳ |
| Error Rate | < 1% | ⏳ |

## Timeline

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 1: Shared Services | 2 hours | - | - | ⏳ |
| Phase 2: Widget Updates | 3 hours | - | - | ⏳ |
| Phase 3: Blade Refactor | 2 hours | - | - | ⏳ |
| Phase 4: Testing | 2 hours | - | - | ⏳ |
| Phase 5: Documentation | 1 hour | - | - | ⏳ |
| **Total** | **10 hours** | - | - | ⏳ |

## Next Steps

1. Review specification with team
2. Get approval for approach
3. Begin Phase 1 implementation
4. Test incrementally
5. Document as we go

## Notes

- Keep existing blade functionality intact
- Maintain OOB styling throughout
- Test both mock and real modes
- Ensure backward compatibility
- Focus on user experience