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
     * Build ODS search payload (updated to match OpenAPI spec)
     * Centralizes the payload construction logic
     * 
     * @param {String} query - Search query
     * @param {Array} entityTypes - Entity types to search
     * @param {Number} pageSize - Results per page
     * @param {Number} page - Page number (1-based for ShareDo API)
     * @returns {Object} Search payload for ODS API
     */
    self.buildOdsSearchPayload = function(query, entityTypes, pageSize, page) {
        // Default entity types
        entityTypes = entityTypes || ["person", "organisation"];
        pageSize = pageSize || 20;
        page = page || 0;
        
        // Convert 0-based to 1-based page numbers for ShareDo API
        var startPage = page + 1;
        
        var payload = {
            startPage: startPage,
            endPage: startPage,
            rowsPerPage: pageSize,
            searchString: query || "",
            odsEntityTypes: entityTypes,
            availability: {
                isAvailable: null,
                isOutOfOffice: null,
                isNotAvailable: null
            },
            location: {
                postcode: null,
                range: 10
            },
            connection: {
                systemName: null,
                label: null,
                otherOdsIds: []
            },
            competencies: [],
            teams: [],
            roles: [],
            odsTypes: [],
            wallManagement: false
        };
        
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
    
    /**
     * Check if external search feature is enabled
     * @returns {jQuery.Deferred} Promise resolving to {isEnabled: boolean}
     */
    self.checkExternalSearchEnabled = function() {
        var deferred = $.Deferred();
        
        console.log("🌐 SearchApiService.checkExternalSearchEnabled START");
        
        if (!window.$ajax) {
            console.error("❌ SearchApiService: $ajax not available for external search check");
            deferred.resolve({ isEnabled: false });
            return deferred.promise();
        }
        
        console.log("📡 Making API call: GET /api/featureFramework/ods-external-search/isEnabled");
        
        $ajax.get("/api/featureFramework/ods-external-search/isEnabled")
            .done(function(data) {
                console.log("✅ SearchApiService: External search enabled check SUCCESS:", data);
                deferred.resolve(data);
            })
            .fail(function(error) {
                console.warn("❌ SearchApiService: External search feature check FAILED:", error);
                console.warn("   Status:", error.status);
                console.warn("   Response:", error.responseText);
                deferred.resolve({ isEnabled: false });
            });
        
        return deferred.promise();
    };
    
    /**
     * Get enabled external search providers
     * @returns {jQuery.Deferred} Promise resolving to array of provider objects
     */
    self.getEnabledExternalProviders = function() {
        var deferred = $.Deferred();
        
        console.log("🏢 SearchApiService.getEnabledExternalProviders START");
        
        if (!window.$ajax) {
            console.error("❌ SearchApiService: $ajax not available for provider lookup");
            deferred.resolve([]);
            return deferred.promise();
        }
        
        console.log("📡 Making API call: GET /api/ods/externalSearch/providers/enabled");
        
        $ajax.get("/api/ods/externalSearch/providers/enabled")
            .done(function(providers) {
                console.log("✅ SearchApiService: External providers SUCCESS:", providers);
                console.log("   Provider count:", providers ? providers.length : 0);
                if (providers && providers.length > 0) {
                    providers.forEach(function(provider, index) {
                        console.log("   Provider", index + 1 + ":", provider.systemName, 
                                  "| People:", provider.canSearchPeople, 
                                  "| Orgs:", provider.canSearchOrganisations);
                    });
                }
                deferred.resolve(providers || []);
            })
            .fail(function(error) {
                console.warn("❌ SearchApiService: External provider lookup FAILED:", error);
                console.warn("   Status:", error.status);
                console.warn("   Response:", error.responseText);
                deferred.resolve([]);
            });
        
        return deferred.promise();
    };
    
    /**
     * Search external provider for entities
     * @param {String} systemName - Provider system name
     * @param {String} entityType - "people" or "organisations" (plural form for API)
     * @param {String} query - Search query
     * @param {Number} page - Page number (0-based)
     * @returns {jQuery.Deferred} Promise resolving to search results
     */
    self.searchExternalProvider = function(systemName, entityType, query, page) {
        var deferred = $.Deferred();
        
        console.log("🔍 SearchApiService.searchExternalProvider START");
        console.log("   System Name:", systemName);
        console.log("   Entity Type:", entityType);
        console.log("   Query:", query);
        console.log("   Page:", page);
        
        if (!window.$ajax) {
            console.error("❌ SearchApiService: $ajax not available for external provider search");
            deferred.resolve({
                success: false,
                results: [],
                totalResults: 0,
                error: "$ajax service not available"
            });
            return deferred.promise();
        }
        
        // Build the API URL with query parameters
        var url = "/api/ods/externalSearch/providers/" + 
                  encodeURIComponent(systemName) + "/" + 
                  encodeURIComponent(entityType) + 
                  "?page=" + (page || 0) + 
                  "&q=" + encodeURIComponent(query || "");
        
        console.log("📡 Making API call: GET", url);
        
        $ajax.get(url)
            .done(function(data) {
                console.log("✅ SearchApiService: External provider response SUCCESS:", data);
                console.log("   Results count:", data && data.results ? data.results.length : 0);
                console.log("   Total results:", data ? data.totalResults : 0);
                
                // Normalize external provider response
                var normalized = self.parseExternalProviderResponse(data, systemName);
                console.log("🔄 Normalized response:", normalized);
                
                deferred.resolve(normalized);
            })
            .fail(function(error) {
                console.error("❌ SearchApiService: External provider search FAILED:", error);
                console.error("   Status:", error.status);
                console.error("   Response:", error.responseText);
                console.error("   URL was:", url);
                
                deferred.resolve({
                    success: false,
                    results: [],
                    totalResults: 0,
                    error: error.responseText || "External provider search failed"
                });
            });
        
        return deferred.promise();
    };
    
    /**
     * Parse and normalize external provider API response
     * @param {Object} data - Raw external provider response
     * @param {String} systemName - Provider system name for tracking
     * @returns {Object} Normalized response
     */
    self.parseExternalProviderResponse = function(data, systemName) {
        var results = [];
        
        if (data.results && Array.isArray(data.results)) {
            data.results.forEach(function(item) {
                try {
                    // Normalize external result to match internal format
                    var entity = {
                        id: item.providersReference || item.affinityClientId || item.affinityClientCode,
                        source: "external",
                        providerSystemName: systemName,
                        providersReference: item.providersReference,
                        
                        // Person fields
                        firstName: item.firstName,
                        surname: item.surname,
                        title: item.title,
                        dateOfBirth: item.dateOfBirth,
                        
                        // Organisation fields  
                        name: item.name,
                        
                        // Contact details
                        contactDetails: item.contactDetails || [],
                        locations: item.locations || [],
                        
                        // Custom properties
                        customProperties: item.customProperties,
                        odsPartyTypes: item.odsPartyTypes,
                        
                        // Metadata
                        sourceType: item.sourceType,
                        requiresExpansion: item.requiresExpansion,
                        
                        // Legacy PMS fields for backward compatibility
                        affinityClientId: item.affinityClientId,
                        affinityClientCode: item.affinityClientCode
                    };
                    
                    // Extract contact details for easier access
                    self.extractContactDetailsFromExternal(entity);
                    
                    // Extract address details from locations
                    self.extractAddressDetailsFromExternal(entity);
                    
                    // Add display helpers
                    entity.displayName = self.getDisplayName(entity);
                    entity.icon = self.getEntityIcon(entity);
                    
                    // Determine entity type
                    entity.odsType = (entity.firstName || entity.surname) ? "person" : "organisation";
                    entity.odsEntityType = entity.odsType;
                    
                    results.push(entity);
                } catch(e) {
                    console.error("SearchApiService: Failed to parse external result:", e, item);
                }
            });
        }
        
        return {
            success: true,
            results: results,
            totalResults: data.totalResults || results.length,
            rowsPerPage: data.rowsPerPage,
            currentPage: data.currentPage || 0,
            hasMore: results.length > 0 && (data.totalResults || 0) > results.length
        };
    };
    
    /**
     * Extract contact details from external provider result
     * @param {Object} entity - External entity object
     */
    self.extractContactDetailsFromExternal = function(entity) {
        if (entity.contactDetails && entity.contactDetails.length > 0) {
            // Find primary email
            var emailContact = entity.contactDetails.find(function(c) {
                return c.contactTypeSystemName === "email" || 
                       c.contactType === "email" ||
                       (c.contactValue && c.contactValue.indexOf("@") > -1);
            });
            if (emailContact) {
                entity.email = entity.email || emailContact.contactValue;
                entity.primaryEmail = emailContact.contactValue;
            }
            
            // Find primary phone
            var phoneContact = entity.contactDetails.find(function(c) {
                return c.contactTypeSystemName === "mobile" || 
                       c.contactTypeSystemName === "direct-line" ||
                       c.contactTypeSystemName === "phone" ||
                       c.contactType === "phone" ||
                       c.contactType === "mobile";
            });
            if (phoneContact) {
                entity.phone = entity.phone || phoneContact.contactValue;
                entity.primaryPhone = phoneContact.contactValue;
            }
        }
    };
    
    /**
     * Extract address details from external provider locations
     * @param {Object} entity - External entity object
     */
    self.extractAddressDetailsFromExternal = function(entity) {
        if (entity.locations && entity.locations.length > 0) {
            var location = entity.locations[0]; // Use first location
            entity.address = location.addressLine1;
            entity.suburb = location.town;
            entity.postcode = location.postCode;
            entity.state = location.county;
        }
    };
    
    /**
     * Check if person reference is duplicate in ODS
     * @param {String} reference - Person reference to check
     * @returns {jQuery.Deferred} Promise resolving to boolean
     */
    self.checkPersonDuplicate = function(reference) {
        var deferred = $.Deferred();
        
        if (!window.$ajax || !reference) {
            deferred.resolve(false);
            return deferred.promise();
        }
        
        $ajax.get("/api/ods/externalSearch/isPersonDuplicate/" + encodeURIComponent(reference))
            .done(function(isDuplicate) {
                console.log("SearchApiService: Person duplicate check for", reference, ":", isDuplicate);
                deferred.resolve(isDuplicate);
            })
            .fail(function(error) {
                console.warn("SearchApiService: Person duplicate check failed:", error);
                deferred.resolve(false);
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