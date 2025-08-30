# Inline Search Specification for UnifiedOdsEntityPicker Widget

## Executive Summary

This specification outlines the implementation of inline search functionality for the UnifiedOdsEntityPicker widget, enabling real-time search across both ShareDo ODS and external PMS systems directly within the widget while maintaining ShareDo's OOB card styling.

## Core Requirements

### 1. Inline Search Functionality

#### 1.1 User Experience
- **Activation**: Click on "Click to search" text to activate inline search mode
- **Search Input**: Transform the text into an inline input field that accepts typed queries
- **Real-time Results**: Display results in a dropdown below the widget as user types
- **Minimum Characters**: Start searching after 2 characters typed
- **Debounce**: 500ms delay after typing stops before initiating search
- **Result Limit**: Show maximum 10 results in dropdown, with "More results..." link

#### 1.2 Visual Design (Maintaining OOB Style)
```html
<!-- Active Search State -->
<div class="card entity-card searching">
    <div class="status-section">
        <span class="fa fa-2x fa-search"></span> <!-- Changes to search icon -->
    </div>
    <div class="content-section card-message">
        <span class="card-message-text">Select Entity</span>
        <div class="inline-search-container">
            <input type="text" class="inline-search-input" 
                   placeholder="Type to search..." 
                   data-bind="textInput: inlineSearchQuery, hasFocus: isSearchActive" />
        </div>
    </div>
    <div class="menu-section">
        <a href="#" class="fa fa-chevron-right text-primary"></a>
    </div>
</div>

<!-- Results Dropdown -->
<div class="inline-search-results">
    <!-- Loading State -->
    <div class="search-result-loading">
        <i class="fa fa-spinner fa-spin"></i> Searching...
    </div>
    
    <!-- Result Items -->
    <div class="search-result-item" data-bind="click: selectInlineResult">
        <div class="result-icon">
            <i class="fa fa-user"></i>
        </div>
        <div class="result-content">
            <span class="result-name">John Smith</span>
            <span class="result-source source-pms">Aderant</span> <!-- Configurable label -->
        </div>
        <div class="result-indicators">
            <i class="fa fa-circle source-indicator-pms" title="PMS Record"></i>
        </div>
    </div>
</div>
```

### 2. Search Implementation

#### 2.1 Dual System Search
- **Parallel Execution**: Search both ShareDo ODS and PMS simultaneously
- **Result Merging**: Combine and deduplicate results based on matching logic
- **Performance**: Use Promise.all() with timeout protection (5 seconds max)

#### 2.2 API Usage
```javascript
// ShareDo ODS Search
function searchShareDoODS(query) {
    return $ajax.get("/api/ods/search", {
        q: query,
        pageSize: 10,
        entityTypes: self.options.entityTypes
    });
}

// PMS Search (with mock fallback)
function searchPMS(query) {
    if (self.options.useMockPms) {
        return self.searchService.searchMockPMS(query);
    }
    
    // Real PMS API endpoint
    return $ajax.get("/api/ods/externalSearch/providers/" + self.options.pmsProvider + "/search", {
        q: query,
        pageSize: 10
    });
}
```

### 3. Source Indicators

#### 3.1 Visual Indicators
Each result must clearly show its source:

| Source | Icon | Color | Label (Configurable) |
|--------|------|-------|---------------------|
| ShareDo Only | `fa-database` | Green (#36b541) | "Case" / "ShareDo" |
| PMS Only | `fa-briefcase` | Blue (#337ab7) | "Aderant" / "PMS" |
| Matched | `fa-link` | Gold (#f39c12) | "Matched" |

#### 3.2 Configuration
```javascript
{
    // Label configuration
    labels: {
        sharedo: "Case",        // Default: "ShareDo"
        pms: "Aderant",        // Default: "PMS"
        matched: "Matched"      // Default: "Matched"
    },
    
    // Icon configuration  
    icons: {
        sharedo: "fa-database",
        pms: "fa-briefcase",
        matched: "fa-link"
    },
    
    // Color configuration
    colors: {
        sharedo: "#36b541",
        pms: "#337ab7",
        matched: "#f39c12"
    }
}
```

### 4. Code Sharing Architecture

#### 4.1 Shared Services Structure
```
Services/
├── UnifiedSearchService.js       # Core search logic
├── ResultMergerService.js        # Result merging and deduplication
├── MockPmsService.js             # Mock PMS data for testing
├── OdsImportService.js           # Auto-add PMS to ODS logic
└── SearchConfigService.js        # Configuration management
```

#### 4.2 UnifiedSearchService (NEW)
Shared service used by both widget and blade:

```javascript
namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.UnifiedSearchService = function(config) {
    var self = this;
    
    self.config = $.extend({
        useMockPms: false,
        pmsProvider: "pms",
        pmsTimeout: 5000,
        pageSize: 10,
        entityTypes: ["person", "organisation"],
        labels: {
            sharedo: "ShareDo",
            pms: "PMS",
            matched: "Matched"
        }
    }, config);
    
    // Core search method used by both widget and blade
    self.search = function(query, options) {
        var opts = $.extend({}, self.config, options);
        var deferred = $.Deferred();
        
        // Parallel search
        var searches = [
            self.searchShareDo(query, opts),
            self.searchPMS(query, opts)
        ];
        
        $.when.apply($, searches)
            .done(function(shareDoResults, pmsResults) {
                var merged = self.mergeResults(shareDoResults[0], pmsResults[0]);
                deferred.resolve(merged);
            })
            .fail(function(error) {
                deferred.reject(error);
            });
        
        return deferred.promise();
    };
    
    self.searchShareDo = function(query, options) {
        return $ajax.get("/api/ods/search", {
            q: query,
            pageSize: options.pageSize,
            entityTypes: options.entityTypes
        });
    };
    
    self.searchPMS = function(query, options) {
        if (options.useMockPms) {
            return Alt.UnifiedDataSearch.Services.mockPmsService.search(
                options.entityTypes[0] === "person" ? "persons" : "organisations",
                query,
                0
            );
        }
        
        return $ajax.get("/api/ods/externalSearch/providers/" + options.pmsProvider + "/search", {
            q: query,
            pageSize: options.pageSize
        });
    };
    
    self.mergeResults = function(shareDoResults, pmsResults) {
        return Alt.UnifiedDataSearch.Services.resultMergerService.mergeResults(
            shareDoResults,
            pmsResults
        );
    };
};
```

#### 4.3 OdsImportService (NEW)
Handles auto-adding PMS records to ShareDo:

```javascript
namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.OdsImportService = function() {
    var self = this;
    
    self.importEntity = function(entity) {
        var deferred = $.Deferred();
        
        if (entity.source === "sharedo" || entity.source === "matched") {
            // Already in ShareDo
            deferred.resolve(entity);
            return deferred.promise();
        }
        
        // Determine entity type
        var entityType = self.determineEntityType(entity);
        var payload = self.buildPayload(entity, entityType);
        
        // Create in ShareDo
        var endpoint = entityType === "person" ? 
            "/api/aspects/ods/people/" : 
            "/api/aspects/ods/organisations/";
        
        $ajax.post(endpoint, payload)
            .done(function(created) {
                entity.odsId = created.id;
                entity.source = "sharedo";
                deferred.resolve(entity);
            })
            .fail(function(error) {
                deferred.reject(error);
            });
        
        return deferred.promise();
    };
    
    self.determineEntityType = function(entity) {
        if (entity.odsType) return entity.odsType;
        if (entity.firstName || entity.lastName) return "person";
        if (entity.organisationName || entity.abn) return "organisation";
        return "person"; // Default
    };
    
    self.buildPayload = function(entity, entityType) {
        if (entityType === "person") {
            return self.buildPersonPayload(entity);
        } else {
            return self.buildOrganisationPayload(entity);
        }
    };
    
    self.buildPersonPayload = function(entity) {
        var contactDetails = [];
        
        if (entity.email) {
            contactDetails.push({
                contactTypeCategoryId: 2100,
                contactTypeSystemName: "email",
                contactValue: entity.email,
                isActive: true,
                isPrimary: true
            });
        }
        
        if (entity.phone) {
            contactDetails.push({
                contactTypeCategoryId: 2101,
                contactTypeSystemName: "mobile",
                contactValue: entity.phone,
                isActive: true,
                isPrimary: !entity.email
            });
        }
        
        return {
            tags: ["client"],
            aspectData: {
                formBuilder: JSON.stringify({
                    formData: {
                        firstNationsPerson: false
                    },
                    formIds: [],
                    formId: null
                }),
                contactDetails: JSON.stringify(contactDetails),
                contactPreferences: JSON.stringify({})
            },
            reference: entity.id || entity.pmsId,
            externalReference: entity.id || entity.pmsId,
            firstName: entity.firstName,
            surname: entity.lastName,
            middleNameOrInitial: entity.middleName,
            preferredName: entity.preferredName || entity.firstName,
            dateOfBirth: entity.dateOfBirth ? self.convertDateToShareDoFormat(entity.dateOfBirth) : null,
            postalAddress: entity.address,
            postalSuburb: entity.suburb,
            postalState: entity.state,
            postalPostcode: entity.postcode,
            postalCountry: entity.country || "Australia"
        };
    };
    
    self.buildOrganisationPayload = function(entity) {
        // Similar structure for organisations
        // ... implementation
    };
    
    self.convertDateToShareDoFormat = function(dateString) {
        if (!dateString) return null;
        var parts = dateString.split('-');
        var year = parts[0];
        var month = parts[1].padStart(2, '0');
        var day = parts[2].padStart(2, '0');
        return parseInt(year + month + day, 10);
    };
};
```

### 5. Widget Implementation Updates

#### 5.1 Widget JavaScript Structure
```javascript
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker = function(element, configuration, baseModel) {
    var self = this;
    
    // Initialize shared services
    self.searchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({
        useMockPms: configuration.useMockPms,
        pmsProvider: configuration.pmsProvider || "pms",
        labels: configuration.labels || {},
        pmsTimeout: configuration.pmsTimeout || 5000
    });
    
    self.importService = new Alt.UnifiedDataSearch.Services.OdsImportService();
    
    // Inline search observables
    self.isSearchActive = ko.observable(false);
    self.inlineSearchQuery = ko.observable("").extend({ rateLimit: 500 });
    self.inlineSearchResults = ko.observableArray([]);
    self.isSearching = ko.observable(false);
    
    // Subscribe to search query changes
    self.inlineSearchQuery.subscribe(function(query) {
        if (query && query.length >= 2) {
            self.performInlineSearch(query);
        } else {
            self.inlineSearchResults([]);
        }
    });
};

// Inline search method
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.performInlineSearch = function(query) {
    var self = this;
    
    self.isSearching(true);
    
    self.searchService.search(query, { pageSize: 10 })
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

// Handle inline result selection
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.selectInlineResult = function(result) {
    var self = this;
    
    if (self.options.mode === "auto" && result.source === "pms") {
        // Auto-import PMS record to ShareDo
        self.importService.importEntity(result)
            .done(function(imported) {
                self.setSelectedEntity(imported);
                self.closeInlineSearch();
            })
            .fail(function(error) {
                alert("Failed to import entity: " + error);
            });
    } else {
        // Direct selection
        self.setSelectedEntity(result);
        self.closeInlineSearch();
    }
};
```

### 6. Blade Refactoring

The existing blade will be refactored to use the same shared services:

```javascript
Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch = function(element, configuration, stackModel) {
    var self = this;
    
    // Use shared search service
    self.searchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({
        useMockPms: configuration.useMockPms,
        pmsProvider: configuration.pmsProvider || "pms",
        labels: configuration.labels || {},
        pmsTimeout: configuration.pmsTimeout || 5000
    });
    
    self.importService = new Alt.UnifiedDataSearch.Services.OdsImportService();
    
    // Rest of blade implementation remains the same, 
    // but now uses searchService.search() instead of custom logic
};
```

### 7. Configuration Schema

```javascript
{
    // Basic configuration
    "label": "Client",
    "required": true,
    "allowMultiple": false,
    
    // Search configuration
    "entityTypes": ["person", "organisation"],
    "useMockPms": false,  // Set to true for testing
    "pmsProvider": "aderant",  // Name of PMS provider
    "pmsTimeout": 5000,
    
    // Mode configuration
    "mode": "auto",  // "auto" = auto-import, "manual" = open blade
    
    // Label configuration (customizable)
    "labels": {
        "sharedo": "Case",      // Custom label for ShareDo
        "pms": "Aderant",      // Custom label for PMS
        "matched": "Linked",    // Custom label for matched
        "searching": "Searching...",
        "noResults": "No results found",
        "moreResults": "View all results..."
    },
    
    // Visual configuration
    "icons": {
        "sharedo": "fa-database",
        "pms": "fa-briefcase",
        "matched": "fa-link"
    },
    
    // Inline search configuration
    "inlineSearch": {
        "enabled": true,
        "minCharacters": 2,
        "debounceMs": 500,
        "maxResults": 10,
        "showSourceIndicators": true,
        "showIcons": true
    }
}
```

### 8. CSS Styling

```css
/* Inline Search Styles - Maintaining OOB Look */
.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .inline-search-container {
    margin-top: 4px;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .inline-search-input {
    border: none;
    outline: none;
    background: transparent;
    width: 100%;
    font-size: 13px;
    color: #495057;
    padding: 2px 0;
    border-bottom: 1px solid #dee2e6;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .inline-search-input:focus {
    border-bottom-color: #36b541;
}

/* Search Results Dropdown */
.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .inline-search-results {
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
.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .search-result-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s ease;
    border-bottom: 1px solid #f0f0f0;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .search-result-item:hover {
    background: #f8f9fa;
}

/* Source Indicators */
.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .result-source {
    display: inline-block;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 3px;
    margin-left: 8px;
    font-weight: 600;
    text-transform: uppercase;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .result-source.source-sharedo {
    background: #d4f5d6;
    color: #36b541;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .result-source.source-pms {
    background: #e0e7ff;
    color: #337ab7;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .result-source.source-matched {
    background: #fff3cd;
    color: #f39c12;
}

/* Source Indicator Icons */
.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .source-indicator-sharedo {
    color: #36b541;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .source-indicator-pms {
    color: #337ab7;
}

.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker .source-indicator-matched {
    color: #f39c12;
}
```

## Implementation Priority

### Phase 1: Core Infrastructure (Day 1)
1. Create shared services (UnifiedSearchService, OdsImportService)
2. Refactor MockPmsService to be reusable
3. Update ResultMergerService for inline search needs

### Phase 2: Widget Updates (Day 2)
1. Add inline search HTML structure
2. Implement inline search JavaScript logic
3. Add CSS styling for inline search
4. Test inline search with mock data

### Phase 3: Blade Refactoring (Day 3)
1. Refactor blade to use shared services
2. Ensure no functionality is lost
3. Test blade with shared services

### Phase 4: Configuration & Polish (Day 4)
1. Implement configurable labels
2. Add source indicators
3. Test auto-import functionality
4. Final styling adjustments

## Testing Checklist

- [ ] Inline search activates on click
- [ ] Search starts after 2 characters
- [ ] Results show within 500ms debounce
- [ ] Source indicators display correctly
- [ ] Labels are configurable
- [ ] Mock mode works correctly
- [ ] Real API mode works correctly
- [ ] Auto-import creates ODS records
- [ ] Selected entity displays in card format
- [ ] Blade still functions correctly
- [ ] Events fire for widget refresh
- [ ] Multiple selection works (if enabled)

## Success Criteria

1. **User Experience**: Seamless inline search without opening blade
2. **Visual Consistency**: Maintains ShareDo OOB styling
3. **Performance**: Results appear within 1 second
4. **Reliability**: Handles API failures gracefully
5. **Configurability**: Labels and modes fully configurable
6. **Code Reuse**: 80% of search logic shared between widget and blade
7. **Testing**: Works in both mock and real modes

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API Performance | Implement timeout and loading states |
| Duplicate Results | Use ResultMergerService deduplication |
| Import Failures | Show clear error messages, allow retry |
| Style Conflicts | Scope all CSS with widget class |
| Browser Compatibility | Test in IE11, Chrome, Firefox, Edge |

## Dependencies

- ShareDo ODS Search API
- External Search Provider API (when configured)
- jQuery for AJAX calls
- Knockout.js for data binding
- ShareDo $ajax utility

## Notes

- This specification maintains backward compatibility with existing blade
- No backend changes required
- All functionality is client-side JavaScript
- Mock mode allows testing without PMS integration
- Configuration can be stored in ShareDo settings or passed directly