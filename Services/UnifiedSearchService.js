/**
 * UnifiedSearchService.js
 * 
 * Centralized search service that coordinates searches across ODS and PMS systems
 * Provides a single interface for both blade and widget to perform unified searches
 * 
 * @namespace Alt.UnifiedDataSearch.Services
 */

namespace("Alt.UnifiedDataSearch.Services");

/**
 * UnifiedSearchService Constructor
 * Handles orchestration of searches across multiple data sources
 */
Alt.UnifiedDataSearch.Services.UnifiedSearchService = function() {
    var self = this;
    
    // Service dependencies (lazy initialized)
    self.mockPmsService = null;
    self.resultMergerService = null;
    self.odsImportService = null;
    
    /**
     * Initialize dependent services using defensive pattern
     * Ensures services are available before use
     */
    self.initializeServices = function() {
        // Initialize MockPmsService
        if (!self.mockPmsService) {
            if (Alt.UnifiedDataSearch.Services.mockPmsService) {
                self.mockPmsService = Alt.UnifiedDataSearch.Services.mockPmsService;
            } else if (Alt.UnifiedDataSearch.Services.MockPmsService) {
                self.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();
                Alt.UnifiedDataSearch.Services.mockPmsService = self.mockPmsService;
            }
        }
        
        // Initialize ResultMergerService
        if (!self.resultMergerService) {
            if (Alt.UnifiedDataSearch.Services.resultMergerService) {
                self.resultMergerService = Alt.UnifiedDataSearch.Services.resultMergerService;
            } else if (Alt.UnifiedDataSearch.Services.ResultMergerService) {
                self.resultMergerService = new Alt.UnifiedDataSearch.Services.ResultMergerService();
                Alt.UnifiedDataSearch.Services.resultMergerService = self.resultMergerService;
            }
        }
        
        // Initialize OdsImportService
        if (!self.odsImportService) {
            if (Alt.UnifiedDataSearch.Services.odsImportService) {
                self.odsImportService = Alt.UnifiedDataSearch.Services.odsImportService;
            } else if (Alt.UnifiedDataSearch.Services.OdsImportService) {
                self.odsImportService = new Alt.UnifiedDataSearch.Services.OdsImportService();
                Alt.UnifiedDataSearch.Services.odsImportService = self.odsImportService;
            }
        }
    };
    
    /**
     * Main search method - coordinates searches across ODS and PMS
     * 
     * @param {Object} options - Search configuration
     * @param {string} options.query - Search query string
     * @param {string} options.entityType - "all", "person", or "organisation"
     * @param {number} options.page - Page number (0-based)
     * @param {number} options.pageSize - Results per page
     * @param {boolean} options.useMockPms - Use mock PMS service
     * @param {boolean} options.useMockOds - Use mock ODS service (for testing)
     * @param {number} options.timeout - PMS timeout in milliseconds
     * @param {Function} options.onOdsComplete - Callback when ODS search completes
     * @param {Function} options.onPmsComplete - Callback when PMS search completes
     * @param {Function} options.onOdsError - Callback on ODS error
     * @param {Function} options.onPmsError - Callback on PMS error
     * @returns {jQuery.Deferred} Promise resolving to merged results
     */
    self.search = function(options) {
        var deferred = $.Deferred();
        
        // Initialize services
        self.initializeServices();
        
        // Default options
        var defaults = {
            query: "",
            entityType: "all",
            page: 0,
            pageSize: 10,
            useMockPms: true,  // Default to mock PMS
            useMockOds: false, // Default to real ODS API
            timeout: 5000,
            onOdsComplete: null,
            onPmsComplete: null,
            onOdsError: null,
            onPmsError: null
        };
        
        var config = $.extend({}, defaults, options);
        
        console.log("UnifiedSearchService.search called with:", config);
        
        // Execute parallel searches
        var odsPromise = self.searchOds(config)
            .done(function(results) {
                console.log("ODS search completed:", results);
                if (config.onOdsComplete) {
                    config.onOdsComplete(results);
                }
            })
            .fail(function(error) {
                console.error("ODS search failed:", error);
                if (config.onOdsError) {
                    config.onOdsError(error);
                }
            });
        
        var pmsPromise = self.searchPmsWithTimeout(config)
            .done(function(results) {
                console.log("PMS search completed:", results);
                if (config.onPmsComplete) {
                    config.onPmsComplete(results);
                }
            })
            .fail(function(error) {
                console.error("PMS search failed:", error);
                if (config.onPmsError) {
                    config.onPmsError(error);
                }
            });
        
        // Wait for both searches to complete
        $.when(odsPromise, pmsPromise)
            .always(function(odsResponse, pmsResponse) {
                var odsResults = self.extractResults(odsResponse);
                var pmsResults = self.extractResults(pmsResponse);
                
                console.log("Both searches complete. ODS:", odsResults, "PMS:", pmsResults);
                
                // Merge results using ResultMergerService
                var merged = self.resultMergerService ? 
                    self.resultMergerService.mergeResults(odsResults, pmsResults) :
                    self.fallbackMerge(odsResults, pmsResults);
                
                deferred.resolve({
                    results: merged,
                    odsCount: odsResults.totalResults || (odsResults.results ? odsResults.results.length : 0),
                    pmsCount: pmsResults.totalResults || (pmsResults.results ? pmsResults.results.length : 0),
                    totalCount: merged.length
                });
            });
        
        return deferred.promise();
    };
    
    /**
     * Search ODS using ShareDo API
     * @private
     */
    self.searchOds = function(config) {
        console.log("searchOds called, useMockOds:", config.useMockOds);
        
        // Use mock if explicitly requested
        if (config.useMockOds) {
            return self.searchMockOds(config);
        }
        
        // Use real ShareDo ODS API
        if (!window.$ajax) {
            console.error("$ajax not available for ODS search");
            return $.Deferred().resolve({ results: [] }).promise();
        }
        
        // Build the search payload for ShareDo _search endpoint
        var payload = {
            query: config.query,
            page: config.page || 0,
            pageSize: config.pageSize || 10,
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
        
        // Add entity type filter
        if (config.entityType === "person") {
            payload.odsEntityTypes = ["person"];
        } else if (config.entityType === "organisation") {
            payload.odsEntityTypes = ["organisation"];
        } else {
            // For "all", include both types
            payload.odsEntityTypes = ["person", "organisation"];
        }
        
        console.log("Making ODS API call with payload:", payload);
        
        // Make the API call to ShareDo _search endpoint
        return $ajax.post("/api/ods/_search", payload)
            .then(function(data) {
                console.log("ODS API response:", data);
                
                // Parse ShareDo response format
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
                            
                            // Extract contact details from aspectData
                            if (entity.aspectData && entity.aspectData.ContactDetails) {
                                var contacts = entity.aspectData.ContactDetails;
                                
                                // Find email
                                var emailContact = contacts.find(function(c) {
                                    return c.contactTypeSystemName === "email";
                                });
                                if (emailContact) {
                                    entity.email = entity.email || emailContact.contactValue;
                                    entity.primaryEmail = emailContact.contactValue;
                                }
                                
                                // Find phone (mobile or direct-line for persons)
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
                            
                            // Extract address from locations
                            if (entity.locations && entity.locations.length > 0) {
                                var location = entity.locations[0];
                                entity.address = location.addressLine1;
                                entity.suburb = location.town;
                                entity.postcode = location.postCode;
                                entity.state = location.county;
                            }
                            
                            // Ensure we have an odsType
                            if (!entity.odsType) {
                                entity.odsType = entity.odsEntityType || 
                                    (entity.firstName || entity.lastName ? "person" : "organisation");
                            }
                            
                            results.push(entity);
                        } catch(e) {
                            console.error("Failed to parse ODS result row:", e, row);
                        }
                    });
                }
                
                return {
                    results: results,
                    totalResults: data.totalRows || results.length,
                    success: true
                };
            })
            .fail(function(error) {
                console.error("ODS API call failed:", error);
                return { results: [], totalResults: 0, success: false };
            });
    };
    
    /**
     * Search mock ODS (for testing)
     * @private
     */
    self.searchMockOds = function(config) {
        if (!self.mockPmsService) {
            return $.Deferred().resolve({ results: [] }).promise();
        }
        
        var type = config.entityType === "person" ? "persons" : 
                   config.entityType === "organisation" ? "organisations" : "all";
        
        if (type === "all") {
            // Search both types and merge
            var personsPromise = self.mockPmsService.search("persons", config.query, config.page);
            var orgsPromise = self.mockPmsService.search("organisations", config.query, config.page);
            
            return $.when(personsPromise, orgsPromise).then(function(persons, orgs) {
                return {
                    results: [].concat(persons.results || [], orgs.results || []),
                    totalResults: (persons.totalResults || 0) + (orgs.totalResults || 0),
                    success: true
                };
            });
        }
        
        return self.mockPmsService.search(type, config.query, config.page);
    };
    
    /**
     * Search PMS with timeout protection
     * @private
     */
    self.searchPmsWithTimeout = function(config) {
        var deferred = $.Deferred();
        var timeoutHandle;
        
        // Set timeout
        timeoutHandle = setTimeout(function() {
            deferred.reject({ error: "timeout", message: "PMS search timed out" });
        }, config.timeout);
        
        // Execute search
        self.searchPms(config)
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
    
    /**
     * Search PMS (mock or real)
     * @private
     */
    self.searchPms = function(config) {
        // For now, always use mock PMS
        // In future, this would check for real PMS provider
        if (!self.mockPmsService) {
            return $.Deferred().resolve({ results: [] }).promise();
        }
        
        // Handle "all" entity type
        if (config.entityType === "all") {
            var personsPromise = self.mockPmsService.search("persons", config.query, config.page);
            var orgsPromise = self.mockPmsService.search("organisations", config.query, config.page);
            
            return $.when(personsPromise, orgsPromise).then(function(personsResult, orgsResult) {
                return {
                    results: [].concat(personsResult.results || [], orgsResult.results || []),
                    totalResults: (personsResult.totalResults || 0) + (orgsResult.totalResults || 0),
                    success: true
                };
            });
        } else {
            var type = config.entityType === "person" ? "persons" : "organisations";
            return self.mockPmsService.search(type, config.query, config.page);
        }
    };
    
    /**
     * Extract results from various response formats
     * @private
     */
    self.extractResults = function(response) {
        if (!response) {
            return { results: [], totalResults: 0 };
        }
        
        // Handle jQuery ajax response format [data, textStatus, jqXHR]
        if (Array.isArray(response) && response[0]) {
            return response[0];
        }
        
        // Handle direct response object
        if (response.results !== undefined) {
            return response;
        }
        
        // Fallback
        return { results: [], totalResults: 0 };
    };
    
    /**
     * Fallback merge if ResultMergerService not available
     * @private
     */
    self.fallbackMerge = function(odsResults, pmsResults) {
        var merged = [];
        
        // Add ODS results
        if (odsResults && odsResults.results) {
            odsResults.results.forEach(function(item) {
                merged.push({
                    id: item.id || item.odsId,
                    source: "sharedo",
                    odsId: item.id || item.odsId,
                    displayName: self.getDisplayName(item),
                    data: item,
                    icon: self.getIcon(item),
                    primaryEmail: item.email || item.primaryEmail,
                    primaryPhone: item.phone || item.primaryPhone || item.mobile
                });
            });
        }
        
        // Add PMS results
        if (pmsResults && pmsResults.results) {
            pmsResults.results.forEach(function(item) {
                merged.push({
                    id: item.id,
                    source: "pms",
                    pmsId: item.id,
                    displayName: self.getDisplayName(item),
                    data: item,
                    icon: self.getIcon(item),
                    primaryEmail: item.email,
                    primaryPhone: item.phone || item.mobile
                });
            });
        }
        
        return merged;
    };
    
    /**
     * Get display name for entity
     * @private
     */
    self.getDisplayName = function(item) {
        if (item.firstName || item.lastName) {
            return [item.firstName, item.lastName].filter(Boolean).join(" ");
        }
        return item.name || item.organisationName || item.tradingName || "Unknown";
    };
    
    /**
     * Get icon class for entity
     * @private
     */
    self.getIcon = function(item) {
        if (item.odsType === "person" || item.odsEntityType === "person" || 
            item.firstName || item.lastName) {
            return "fa fa-user";
        }
        return "fa fa-building";
    };
    
    /**
     * Import PMS entity to ODS
     * @param {Object} entity - PMS entity to import
     * @returns {jQuery.Deferred} Promise resolving to created ODS entity
     */
    self.importToOds = function(entity) {
        if (!self.odsImportService) {
            console.error("ODS import service not available");
            return $.Deferred().reject({ error: "ODS import service not available" }).promise();
        }
        
        return self.odsImportService.importEntity(entity);
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.unifiedSearchService = new Alt.UnifiedDataSearch.Services.UnifiedSearchService();

console.log("UnifiedSearchService initialized:", Alt.UnifiedDataSearch.Services.unifiedSearchService);