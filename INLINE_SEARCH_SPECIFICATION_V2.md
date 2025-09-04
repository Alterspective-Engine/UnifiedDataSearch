# Inline Search Specification V2 - With Correct Script Loading

## Updates Based on ShareDo Knowledge Base Review

This specification supersedes V1 with corrections for ShareDo script loading patterns.

## Script Loading Architecture

### Chosen Pattern: Individual Component Loading

Based on ShareDo patterns, each component (blade/widget) will load all required scripts independently. While this causes some duplication, it ensures components work standalone and follows established ShareDo patterns.

### Script Registration Requirements

#### For the Blade (`UnifiedOdsPmsSearchBlade.panel.json`):
```json
{
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/UnifiedSearchService.js",     // NEW
        "/_ideFiles/Alt/UnifiedDataSearch/Services/OdsImportService.js",        // NEW
        "/_ideFiles/Alt/UnifiedDataSearch/Blades/UnifiedOdsPmsSearch/blade.js"
    ]
}
```

#### For the Widget (`UnifiedOdsEntityPicker.widget.json`):
```json
{
    "scripts": [
        "/_ideFiles/Alt/UnifiedDataSearch/Helpers/namespace.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/MockPmsService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ResultMergerService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/ConflictDetectorService.js",
        "/_ideFiles/Alt/UnifiedDataSearch/Services/UnifiedSearchService.js",     // NEW
        "/_ideFiles/Alt/UnifiedDataSearch/Services/OdsImportService.js",        // NEW
        "/_ideFiles/Alt/UnifiedDataSearch/Widgets/UnifiedOdsEntityPicker/UnifiedOdsEntityPicker.js"
    ]
}
```

**Important Notes:**
- ✅ NO `dependencies` array (jquery/knockout are globally available)
- ✅ Scripts load in order: namespace → services → component
- ✅ Each component loads all dependencies (ShareDo pattern)
- ⚠️ Services will be loaded multiple times but ShareDo handles this

## Updated Service Implementation Pattern

### UnifiedSearchService.js

```javascript
namespace("Alt.UnifiedDataSearch.Services");

/**
 * Unified Search Service - Shared between widget and blade
 * Handles parallel search across ShareDo ODS and PMS systems
 */
Alt.UnifiedDataSearch.Services.UnifiedSearchService = function(config) {
    var self = this;
    
    // Configuration with defaults
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
    
    // Get service instances (they should already be loaded)
    self.mockPmsService = Alt.UnifiedDataSearch.Services.mockPmsService;
    self.resultMergerService = Alt.UnifiedDataSearch.Services.resultMergerService;
    
    /**
     * Main search method
     * @param {string} query - Search query
     * @param {object} options - Override options
     * @returns {jQuery.Deferred} - Promise with merged results
     */
    self.search = function(query, options) {
        var opts = $.extend({}, self.config, options);
        var deferred = $.Deferred();
        
        // Execute parallel searches
        var searches = [];
        
        // ShareDo ODS search
        var odsSearch = self.searchShareDo(query, opts);
        searches.push(odsSearch);
        
        // PMS search with timeout protection
        var pmsSearch = self.searchPMSWithTimeout(query, opts);
        searches.push(pmsSearch);
        
        // Wait for both to complete
        $.when.apply($, searches)
            .done(function() {
                // Extract results from arguments
                var odsResults = arguments[0];
                var pmsResults = arguments[1];
                
                // Merge results
                var merged = self.resultMergerService.mergeResults(
                    odsResults,
                    pmsResults,
                    opts.labels
                );
                
                deferred.resolve(merged);
            })
            .fail(function(error) {
                console.error("Search failed:", error);
                deferred.reject(error);
            });
        
        return deferred.promise();
    };
    
    /**
     * Search ShareDo ODS
     */
    self.searchShareDo = function(query, options) {
        return $ajax.get("/api/ods/search", {
            q: query,
            pageSize: options.pageSize,
            entityTypes: options.entityTypes
        });
    };
    
    /**
     * Search PMS with timeout
     */
    self.searchPMSWithTimeout = function(query, options) {
        var deferred = $.Deferred();
        var timeoutHandle;
        
        // Set timeout
        timeoutHandle = setTimeout(function() {
            deferred.resolve({ results: [], timeout: true });
        }, options.pmsTimeout);
        
        // Execute search
        self.searchPMS(query, options)
            .done(function(results) {
                clearTimeout(timeoutHandle);
                deferred.resolve(results);
            })
            .fail(function(error) {
                clearTimeout(timeoutHandle);
                // Don't fail overall search if PMS fails
                deferred.resolve({ results: [], error: error });
            });
        
        return deferred.promise();
    };
    
    /**
     * Search PMS (mock or real)
     */
    self.searchPMS = function(query, options) {
        if (options.useMockPms) {
            // Use mock service
            var entityType = options.entityTypes[0] === "person" ? "persons" : "organisations";
            return self.mockPmsService.search(entityType, query, 0);
        }
        
        // Real PMS API
        return $ajax.get("/api/ods/externalSearch/providers/" + options.pmsProvider + "/search", {
            q: query,
            pageSize: options.pageSize
        });
    };
};

// DO NOT create singleton - let components instantiate with their config
```

### OdsImportService.js

```javascript
namespace("Alt.UnifiedDataSearch.Services");

/**
 * ODS Import Service - Handles importing PMS entities to ShareDo ODS
 */
Alt.UnifiedDataSearch.Services.OdsImportService = function() {
    var self = this;
    
    /**
     * Import a PMS entity to ShareDo ODS
     * @param {object} entity - Entity to import
     * @returns {jQuery.Deferred} - Promise with imported entity
     */
    self.importEntity = function(entity) {
        var deferred = $.Deferred();
        
        // Check if already in ShareDo
        if (entity.source === "sharedo" || entity.source === "matched") {
            deferred.resolve(entity);
            return deferred.promise();
        }
        
        // Determine entity type
        var entityType = self.determineEntityType(entity);
        
        // Build payload
        var payload = entityType === "person" ? 
            self.buildPersonPayload(entity) : 
            self.buildOrganisationPayload(entity);
        
        // Create in ShareDo
        var endpoint = entityType === "person" ? 
            "/api/aspects/ods/people/" : 
            "/api/aspects/ods/organisations/";
        
        // Use ShareDo's $ajax utility
        if (window.$ajax) {
            $ajax.post(endpoint, payload)
                .done(function(created) {
                    // Update entity with ODS ID
                    entity.odsId = created.id;
                    entity.source = "sharedo";
                    deferred.resolve(entity);
                })
                .fail(function(error) {
                    console.error("Failed to import entity:", error);
                    deferred.reject(error);
                });
        } else {
            // Fallback to jQuery ajax
            $.ajax({
                url: endpoint,
                type: "POST",
                data: JSON.stringify(payload),
                contentType: "application/json",
                dataType: "json"
            })
            .done(function(created) {
                entity.odsId = created.id;
                entity.source = "sharedo";
                deferred.resolve(entity);
            })
            .fail(function(error) {
                deferred.reject(error);
            });
        }
        
        return deferred.promise();
    };
    
    /**
     * Determine entity type from entity data
     */
    self.determineEntityType = function(entity) {
        if (entity.odsType) return entity.odsType;
        if (entity.firstName || entity.lastName) return "person";
        if (entity.organisationName || entity.abn) return "organisation";
        return "person"; // Default
    };
    
    /**
     * Build person payload for ShareDo API
     */
    self.buildPersonPayload = function(entity) {
        var contactDetails = [];
        
        // Add email
        if (entity.email) {
            contactDetails.push({
                contactTypeCategoryId: 2100,
                contactTypeSystemName: "email",
                contactValue: entity.email,
                isActive: true,
                isPrimary: true
            });
        }
        
        // Add phone (mobile for persons)
        if (entity.phone) {
            contactDetails.push({
                contactTypeCategoryId: 2101,
                contactTypeSystemName: "mobile", // Critical: "mobile" not "phone" for persons
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
                        firstNationsPerson: false,
                        "gdpr-communication-consent-details-sms-consent": false,
                        "gdpr-communication-consent-details-email-consent": false
                    },
                    formIds: [],
                    formId: null
                }),
                contactDetails: JSON.stringify(contactDetails),
                contactPreferences: JSON.stringify({
                    contactHoursFrom: null,
                    contactHoursTo: null
                })
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
    
    /**
     * Build organisation payload for ShareDo API
     */
    self.buildOrganisationPayload = function(entity) {
        var contactDetails = [];
        
        // Add email
        if (entity.email) {
            contactDetails.push({
                contactTypeCategoryId: 2100,
                contactTypeSystemName: "email",
                contactValue: entity.email,
                isActive: true,
                isPrimary: true
            });
        }
        
        // Add phone (phone for organisations)
        if (entity.phone) {
            contactDetails.push({
                contactTypeCategoryId: 2102, // Different category for orgs
                contactTypeSystemName: "phone", // "phone" for organisations
                contactValue: entity.phone,
                isActive: true,
                isPrimary: !entity.email
            });
        }
        
        return {
            tags: ["client"],
            aspectData: {
                formBuilder: JSON.stringify({
                    formData: {},
                    formIds: [],
                    formId: null
                }),
                contactDetails: JSON.stringify(contactDetails)
            },
            reference: entity.id || entity.pmsId,
            externalReference: entity.id || entity.pmsId,
            organisationName: entity.name || entity.organisationName,
            tradingName: entity.tradingName,
            abn: entity.abn,
            acn: entity.acn,
            postalAddress: entity.address,
            postalSuburb: entity.suburb,
            postalState: entity.state,
            postalPostcode: entity.postcode,
            postalCountry: entity.country || "Australia"
        };
    };
    
    /**
     * Convert date to ShareDo PureDate format (YYYYMMDD as integer)
     */
    self.convertDateToShareDoFormat = function(dateString) {
        if (!dateString) return null;
        
        // Handle various date formats
        var date;
        if (dateString.indexOf('-') > -1) {
            // Format: "YYYY-MM-DD"
            var parts = dateString.split('-');
            date = {
                year: parts[0],
                month: parts[1].padStart(2, '0'),
                day: parts[2].padStart(2, '0')
            };
        } else if (dateString.indexOf('/') > -1) {
            // Format: "DD/MM/YYYY" or "MM/DD/YYYY"
            var parts = dateString.split('/');
            // Assume DD/MM/YYYY for Australian format
            date = {
                year: parts[2],
                month: parts[1].padStart(2, '0'),
                day: parts[0].padStart(2, '0')
            };
        } else {
            return null;
        }
        
        // Return as integer
        return parseInt(date.year + date.month + date.day, 10);
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.odsImportService = new Alt.UnifiedDataSearch.Services.OdsImportService();
```

## Updated Widget Implementation

The widget must handle script initialization properly:

```javascript
namespace("Alt.UnifiedDataSearch.Widgets");

Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker = function(element, configuration, baseModel) {
    var self = this;
    
    // Store configuration
    self.options = $.extend(true, {}, self.getDefaults(), configuration);
    
    // Initialize services with configuration
    self.initializeServices();
    
    // Initialize observables
    self.initializeObservables();
    
    // Setup subscriptions
    self.setupSubscriptions();
};

Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.initializeServices = function() {
    var self = this;
    
    // Create configured search service instance
    self.searchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({
        useMockPms: self.options.useMockPms,
        pmsProvider: self.options.pmsProvider || "pms",
        pmsTimeout: self.options.pmsTimeout || 5000,
        labels: self.options.labels || {}
    });
    
    // Use singleton import service
    self.importService = Alt.UnifiedDataSearch.Services.odsImportService;
    
    // Get other singleton services
    self.resultMergerService = Alt.UnifiedDataSearch.Services.resultMergerService;
};
```

## Updated Configuration Schema

Include configurable labels at the widget level:

```javascript
{
    // Basic configuration
    "label": "Client",
    "required": true,
    
    // Mode configuration
    "mode": "auto",  // "auto" or "manual"
    "useMockPms": false,
    "pmsProvider": "aderant",
    
    // Label configuration
    "labels": {
        "sharedo": "Case",        // Configurable
        "pms": "Aderant",        // Configurable
        "matched": "Linked",      // Configurable
        "searching": "Searching...",
        "noResults": "No results found",
        "moreResults": "View all results..."
    },
    
    // Inline search configuration
    "inlineSearch": {
        "enabled": true,
        "minCharacters": 2,
        "debounceMs": 500,
        "maxResults": 10
    }
}
```

## Testing Considerations

### Script Loading Verification

Add this to widget/blade initialization:

```javascript
// Verify services are loaded
if (!Alt.UnifiedDataSearch.Services.MockPmsService) {
    console.error("MockPmsService not loaded");
}
if (!Alt.UnifiedDataSearch.Services.ResultMergerService) {
    console.error("ResultMergerService not loaded");
}
```

### Browser Console Tests

```javascript
// Test service availability
Alt.UnifiedDataSearch.Services.UnifiedSearchService // Should be function
Alt.UnifiedDataSearch.Services.OdsImportService // Should be function
Alt.UnifiedDataSearch.Services.odsImportService // Should be object (instance)

// Test search
var search = new Alt.UnifiedDataSearch.Services.UnifiedSearchService({
    useMockPms: true,
    labels: { sharedo: "Case", pms: "Aderant" }
});
search.search("john").done(function(results) {
    console.log("Results:", results);
});
```

## Implementation Checklist

- [ ] Create Services/UnifiedSearchService.js
- [ ] Create Services/OdsImportService.js
- [ ] Update panel.json to include new services
- [ ] Update widget.json to include new services
- [ ] Remove dependencies arrays from JSON files
- [ ] Set isConfigurable: false in widget.json
- [ ] Update widget to use new services
- [ ] Update blade to use new services
- [ ] Test script loading in browser
- [ ] Test inline search functionality
- [ ] Test auto-import functionality
- [ ] Verify labels are configurable

## Key Differences from V1

1. **Script Loading**: Each component loads all dependencies (ShareDo pattern)
2. **No Global Include**: Avoiding global.json for now
3. **Service Pattern**: Some services are singletons, some instantiated
4. **Configuration**: Labels passed to service constructor
5. **Error Handling**: PMS failures don't fail overall search

This approach ensures compatibility with ShareDo's script loading patterns while maintaining the shared code architecture.