/**
 * SearchApiService.js
 * 
 * Centralized service for all search API operations.
 * Consolidates duplicated ODS search logic from blade and widget.
 * 
 * @namespace Alt.UnifiedDataSearch.Services
 * @class SearchApiService
 * @version 1.0.0
 * @author Alterspective
 * 
 * Key Features:
 * - Single point of ODS API interaction
 * - Consistent contact detail extraction
 * - Unified response parsing
 * - Error handling and fallback logic
 * - Entity type detection and icon assignment
 * 
 * Dependencies:
 * - jQuery for AJAX calls
 * - namespace.js for namespace management
 * - ShareDo $ajax service for API calls
 */

namespace("Alt.UnifiedDataSearch.Services");

/**
 * SearchApiService Constructor
 * Creates a centralized service for search operations
 */
Alt.UnifiedDataSearch.Services.SearchApiService = function() {
    var self = this;
    
    /**
     * Search ODS using ShareDo API with normalized response
     * Consolidates the duplicated logic from blade and widget
     * 
     * @param {String} query - Search query string
     * @param {Array} entityTypes - Array of entity types to search ["person", "organisation"]
     * @param {Number} pageSize - Number of results per page (default: 20)
     * @param {Number} page - Page number (0-based, default: 0)
     * @returns {jQuery.Deferred} Promise resolving to normalized search results
     */
    self.searchOds = function(query, entityTypes, pageSize, page) {
        var deferred = $.Deferred();
        
        // Validate inputs
        if (!window.$ajax) {
            console.error("SearchApiService: $ajax not available for ODS search");
            deferred.resolve({
                success: false,
                results: [],
                totalResults: 0,
                error: "$ajax service not available"
            });
            return deferred.promise();
        }
        
        // Build the search payload for ShareDo _search endpoint
        var payload = self.buildOdsSearchPayload(query, entityTypes, pageSize, page);
        
        console.log("SearchApiService: Making ODS API call with payload:", payload);
        
        // Make the API call to ShareDo _search endpoint
        $ajax.post("/api/ods/_search", payload)
            .done(function(data) {
                console.log("SearchApiService: ODS API response:", data);
                
                // Parse and normalize the response
                var normalized = self.parseOdsResponse(data);
                console.log("SearchApiService: Normalized ODS response:", normalized);
                
                deferred.resolve(normalized);
            })
            .fail(function(error) {
                console.error("SearchApiService: ODS API call failed:", error);
                deferred.resolve({
                    success: false,
                    results: [],
                    totalResults: 0,
                    error: error.responseText || "ODS API call failed"
                });
            });
        
        return deferred.promise();
    };
    
    /**
     * Build ODS search payload
     * Centralizes the payload construction logic
     * 
     * @param {String} query - Search query
     * @param {Array} entityTypes - Entity types to search
     * @param {Number} pageSize - Results per page
     * @param {Number} page - Page number
     * @returns {Object} Search payload for ODS API
     */
    self.buildOdsSearchPayload = function(query, entityTypes, pageSize, page) {
        // Default entity types
        entityTypes = entityTypes || ["person", "organisation"];
        pageSize = pageSize || 20;
        page = page || 0;
        
        var payload = {
            query: query || "",
            page: page,
            pageSize: pageSize,
            searchType: "quick",
            searchParticipants: {
                enabled: false
            },
            searchOds: {
                enabled: true,
                associatedWithMatterOwner: false,
                label: null,
                otherOdsIds: []
            },
            competencies: [],
            teams: [],
            roles: [],
            odsTypes: [],
            wallManagement: false
        };
        
        // Set entity type filters
        if (entityTypes.length === 1 && entityTypes[0] === "person") {
            payload.odsEntityTypes = ["person"];
        } else if (entityTypes.length === 1 && entityTypes[0] === "organisation") {
            payload.odsEntityTypes = ["organisation"];
        } else {
            // For "all" or multiple types, include both
            payload.odsEntityTypes = ["person", "organisation"];
        }
        
        return payload;
    };
    
    /**
     * Parse and normalize ODS API response
     * Extracts entities and normalizes the data structure
     * 
     * @param {Object} data - Raw ODS API response
     * @returns {Object} Normalized response with results array
     */
    self.parseOdsResponse = function(data) {
        var results = [];
        
        if (data.rows && Array.isArray(data.rows)) {
            data.rows.forEach(function(row) {
                try {
                    // Parse the JSON string in the result property
                    var entity = JSON.parse(row.result);
                    
                    // Ensure IDs are set
                    entity.id = entity.id || row.id;
                    entity.odsId = entity.id || row.id;
                    entity.odsEntityType = entity.odsEntityType || row.odsEntityType;
                    
                    // Extract and normalize contact details
                    self.extractContactDetails(entity);
                    
                    // Extract and normalize address information
                    self.extractAddressDetails(entity);
                    
                    // Ensure we have an odsType for consistency
                    if (!entity.odsType) {
                        entity.odsType = entity.odsEntityType || 
                            (entity.firstName || entity.lastName ? "person" : "organisation");
                    }
                    
                    // Add display helpers
                    entity.displayName = self.getDisplayName(entity);
                    entity.icon = self.getEntityIcon(entity);
                    
                    results.push(entity);
                } catch(e) {
                    console.error("SearchApiService: Failed to parse ODS result row:", e, row);
                }
            });
        }
        
        return {
            success: true,
            results: results,
            totalResults: data.totalRows || results.length,
            page: data.page || 0,
            hasMore: results.length > 0 && (data.totalRows || 0) > results.length
        };
    };
    
    /**
     * Extract contact details from ShareDo entity
     * Centralizes contact detail parsing logic
     * 
     * @param {Object} entity - ShareDo entity object
     */
    self.extractContactDetails = function(entity) {
        if (entity.aspectData && entity.aspectData.ContactDetails) {
            var contacts = entity.aspectData.ContactDetails;
            
            // Find primary email
            var emailContact = contacts.find(function(c) {
                return c.contactTypeSystemName === "email";
            });
            if (emailContact) {
                entity.email = entity.email || emailContact.contactValue;
                entity.primaryEmail = emailContact.contactValue;
            }
            
            // Find primary phone (mobile or direct-line for persons, main phone for orgs)
            var phoneContact = contacts.find(function(c) {
                return c.contactTypeSystemName === "mobile" || 
                       c.contactTypeSystemName === "direct-line" ||
                       c.contactTypeSystemName === "phone";
            });
            if (phoneContact) {
                entity.phone = entity.phone || phoneContact.contactValue;
                entity.primaryPhone = phoneContact.contactValue;
            }
        }
    };
    
    /**
     * Extract address details from ShareDo entity
     * Centralizes address parsing logic
     * 
     * @param {Object} entity - ShareDo entity object
     */
    self.extractAddressDetails = function(entity) {
        if (entity.locations && entity.locations.length > 0) {
            var location = entity.locations[0]; // Use first location
            entity.address = location.addressLine1;
            entity.suburb = location.town;
            entity.postcode = location.postCode;
            entity.state = location.county;
        }
    };
    
    /**
     * Get display name for entity
     * Handles both persons and organisations consistently
     * 
     * @param {Object} entity - Entity object
     * @returns {String} Display name
     */
    self.getDisplayName = function(entity) {
        // For persons, check both lastName and surname (ShareDo uses 'surname')
        if (entity.firstName || entity.lastName || entity.surname) {
            var parts = [];
            if (entity.firstName) parts.push(entity.firstName);
            // ShareDo uses 'surname' field, PMS might use 'lastName'
            if (entity.surname || entity.lastName) {
                parts.push(entity.surname || entity.lastName);
            }
            return parts.join(" ") || "Unknown Person";
        }
        
        // For organisations, check multiple name fields
        return entity.name || 
               entity.organisationName || 
               entity.registeredName || 
               entity.tradingName || 
               "Unknown Organisation";
    };
    
    /**
     * Get appropriate icon class for entity
     * 
     * @param {Object} entity - Entity object
     * @returns {String} FontAwesome icon class
     */
    self.getEntityIcon = function(entity) {
        // Check odsEntityType (ShareDo) or odsType, plus name fields
        if (entity.odsEntityType === "person" || 
            entity.odsType === "person" || 
            entity.firstName || 
            entity.lastName || 
            entity.surname) {
            return "fa-user";
        }
        return "fa-building";
    };
    
    /**
     * Create a simple search result object for non-ODS entities
     * Useful for PMS results or other data sources
     * 
     * @param {Object} entity - Raw entity data
     * @param {String} source - Source identifier (e.g., "pms", "external")
     * @returns {Object} Normalized search result
     */
    self.createSearchResult = function(entity, source) {
        return {
            id: entity.id,
            source: source || "unknown",
            displayName: self.getDisplayName(entity),
            icon: self.getEntityIcon(entity),
            primaryEmail: entity.email || "",
            primaryPhone: entity.phone || entity.mobile || "",
            data: entity,
            odsType: entity.odsType || 
                     (entity.firstName || entity.lastName ? "person" : "organisation")
        };
    };
    
    /**
     * Load ODS entity by ID - CENTRALIZED
     * Consolidates the duplicated loadEntityById logic from Widget
     * 
     * @param {String} entityId - ODS entity ID
     * @returns {jQuery.Deferred} Promise resolving to entity or null
     */
    self.loadEntityById = function(entityId) {
        var deferred = $.Deferred();
        
        if (!entityId) {
            deferred.resolve(null);
            return deferred.promise();
        }
        
        if (!window.$ajax) {
            console.error("SearchApiService: $ajax not available for entity loading");
            deferred.resolve(null);
            return deferred.promise();
        }
        
        console.log("SearchApiService: Loading entity by ID:", entityId);
        
        // Try person first
        $ajax.get("/api/ods/person/" + entityId)
            .done(function(person) {
                console.log("SearchApiService: Loaded person:", person);
                person.odsType = "person";
                person.source = "sharedo";
                person.displayName = self.getDisplayName(person);
                person.icon = self.getEntityIcon(person);
                deferred.resolve(person);
            })
            .fail(function() {
                // Try organisation
                $ajax.get("/api/ods/organisation/" + entityId)
                    .done(function(org) {
                        console.log("SearchApiService: Loaded organisation:", org);
                        org.odsType = "organisation";
                        org.source = "sharedo";
                        org.displayName = self.getDisplayName(org);
                        org.icon = self.getEntityIcon(org);
                        deferred.resolve(org);
                    })
                    .fail(function(error) {
                        console.warn("SearchApiService: Could not load entity with ID:", entityId, error);
                        deferred.resolve(null);
                    });
            });
        
        return deferred.promise();
    };
    
    /**
     * Create ODS entity - CENTRALIZED
     * Consolidates entity creation logic from Blade and OdsImportService
     * 
     * @param {Object} entityData - Entity data to create
     * @param {String} entityType - "person" or "organisation"
     * @param {String} apiMode - "simple" (basic ODS) or "aspects" (full aspect API)
     * @returns {jQuery.Deferred} Promise resolving to created entity
     */
    self.createOdsEntity = function(entityData, entityType, apiMode) {
        var deferred = $.Deferred();
        
        if (!window.$ajax) {
            console.error("SearchApiService: $ajax not available for entity creation");
            deferred.reject({ error: "$ajax service not available" });
            return deferred.promise();
        }
        
        // Support both simple ODS and aspects API endpoints
        var endpoint;
        if (apiMode === "aspects") {
            // Aspects API uses plural form
            endpoint = entityType === "person" ? 
                "/api/aspects/ods/people/" :
                "/api/aspects/ods/organisations/";
        } else {
            // Simple ODS API uses singular form
            endpoint = "/api/ods/" + entityType;
        }
        
        console.log("SearchApiService: Creating ODS entity");
        console.log("  Type:", entityType);
        console.log("  API Mode:", apiMode || "simple");
        console.log("  Endpoint:", endpoint);
        console.log("  Data:", entityData);
        
        var apiCall = $ajax.post(endpoint, entityData);
        
        apiCall
            .done(function(created) {
                console.log("SearchApiService: Entity created successfully:", created);
                created.odsType = entityType;
                created.source = "sharedo";
                created.displayName = self.getDisplayName(created);
                created.icon = self.getEntityIcon(created);
                deferred.resolve(created);
            })
            .fail(function(error) {
                console.error("SearchApiService: Entity creation failed:", error);
                deferred.reject(error);
            });
        
        return deferred.promise();
    };
};

/**
 * Guaranteed Service Initialization
 * Ensures SearchApiService is always available for both Widget and Blade
 */
Alt.UnifiedDataSearch.Services.initializeSearchApiService = function() {
    if (!Alt.UnifiedDataSearch.Services.searchApiService) {
        console.log("🔧 Initializing SearchApiService singleton...");
        Alt.UnifiedDataSearch.Services.searchApiService = 
            new Alt.UnifiedDataSearch.Services.SearchApiService();
        console.log("✅ SearchApiService singleton created");
    }
    return Alt.UnifiedDataSearch.Services.searchApiService;
};

/**
 * Get SearchApiService instance with guaranteed initialization
 * This is the SINGLE entry point both Widget and Blade should use
 * 
 * @returns {SearchApiService} Guaranteed service instance
 */
Alt.UnifiedDataSearch.Services.getSearchApiService = function() {
    // Ensure the service namespace exists
    if (!Alt.UnifiedDataSearch.Services.initializeSearchApiService) {
        console.warn("initializeSearchApiService not available, creating manually");
        if (!Alt.UnifiedDataSearch.Services.searchApiService && Alt.UnifiedDataSearch.Services.SearchApiService) {
            Alt.UnifiedDataSearch.Services.searchApiService = 
                new Alt.UnifiedDataSearch.Services.SearchApiService();
        }
        return Alt.UnifiedDataSearch.Services.searchApiService;
    }
    return Alt.UnifiedDataSearch.Services.initializeSearchApiService();
};

// Initialize singleton instance immediately
Alt.UnifiedDataSearch.Services.searchApiService = 
    new Alt.UnifiedDataSearch.Services.SearchApiService();

console.log("✅ SearchApiService initialized as singleton:", !!Alt.UnifiedDataSearch.Services.searchApiService);