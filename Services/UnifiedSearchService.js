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
        // MockPmsService removed - PMS functionality not available
        self.mockPmsService = null;
        
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
     * @param {boolean} options.useMockPms - DEPRECATED: Mock PMS removed
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
            useMockPms: false, // DEPRECATED: Mock PMS removed
            useMockOds: false, // Default to real ODS API
            timeout: 5000,
            onOdsComplete: null,
            onPmsComplete: null,
            onOdsError: null,
            onPmsError: null
        };
        
        var config = $.extend({}, defaults, options);
        
        console.log("🚀 UnifiedSearchService.search called with:", config);
        
        // Execute parallel searches
        console.log("🔍 Starting ODS search...");
        var odsPromise = self.searchOds(config)
            .done(function(results) {
                console.log("✅ ODS search completed:", results);
                if (config.onOdsComplete) {
                    config.onOdsComplete(results);
                }
            })
            .fail(function(error) {
                console.error("❌ ODS search failed:", error);
                if (config.onOdsError) {
                    config.onOdsError(error);
                }
            });
        
        console.log("🔍 Starting external provider search...");
        var externalPromise = self.searchPmsWithTimeout(config)
            .done(function(results) {
                console.log("✅ External provider search completed:", results);
                if (config.onPmsComplete) { // Keep callback name for backward compatibility
                    config.onPmsComplete(results);
                }
            })
            .fail(function(error) {
                console.error("❌ External provider search failed:", error);
                if (config.onPmsError) { // Keep callback name for backward compatibility
                    config.onPmsError(error);
                }
            });
        
        // Wait for both searches to complete
        $.when(odsPromise, externalPromise)
            .always(function(odsResponse, externalResponse) {
                var odsResults = self.extractResults(odsResponse);
                var externalResults = self.extractResults(externalResponse);
                
                console.log("Both searches complete. ODS:", odsResults, "External:", externalResults);
                
                // Merge results using ResultMergerService
                var merged = self.resultMergerService ? 
                    self.resultMergerService.mergeResults(odsResults, externalResults) :
                    self.fallbackMerge(odsResults, externalResults);
                
                deferred.resolve({
                    results: merged,
                    odsCount: odsResults.totalResults || (odsResults.results ? odsResults.results.length : 0),
                    pmsCount: externalResults.totalResults || (externalResults.results ? externalResults.results.length : 0), // Keep name for compatibility
                    externalCount: externalResults.totalResults || (externalResults.results ? externalResults.results.length : 0),
                    totalCount: merged.length
                });
            });
        
        return deferred.promise();
    };
    
    /**
     * Search ODS using centralized SearchApiService
     * @private
     */
    self.searchOds = function(config) {
        console.log("UnifiedSearchService.searchOds called with config:", config);
        
        // Use mock if explicitly requested (fallback only)
        if (config.useMockOds) {
            return self.searchMockOds(config);
        }
        
        // Ensure SearchApiService is available
        if (!Alt.UnifiedDataSearch.Services.searchApiService) {
            console.error("SearchApiService not available for ODS search");
            return $.Deferred().resolve({ 
                results: [], 
                totalResults: 0, 
                success: false 
            }).promise();
        }
        
        // Convert entity type config to array format
        var entityTypes = [];
        if (config.entityType === "person") {
            entityTypes = ["person"];
        } else if (config.entityType === "organisation") {
            entityTypes = ["organisation"];
        } else {
            // For "all", include both types
            entityTypes = ["person", "organisation"];
        }
        
        // Use the centralized SearchApiService
        return Alt.UnifiedDataSearch.Services.searchApiService
            .searchOds(config.query, entityTypes, config.pageSize, config.page);
    };
    
    /**
     * Search mock ODS (DEPRECATED - Mock services removed)
     * @private
     */
    self.searchMockOds = function(config) {
        console.warn("searchMockOds: Mock services have been removed");
        return $.Deferred().resolve({ 
            results: [], 
            totalResults: 0, 
            success: false,
            error: "Mock services removed"
        }).promise();
    };
    
    /**
     * Search external providers with timeout protection
     * @private
     */
    self.searchPmsWithTimeout = function(config) {
        var deferred = $.Deferred();
        var timeoutHandle;
        
        // Set timeout
        timeoutHandle = setTimeout(function() {
            deferred.reject({ error: "timeout", message: "External provider search timed out" });
        }, config.timeout);
        
        // Execute search
        self.searchExternalProviders(config)
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
     * Search external providers (replaces deprecated PMS search)
     * @private
     */
    self.searchExternalProviders = function(config) {
        var deferred = $.Deferred();
        
        console.log("🔍 UnifiedSearchService.searchExternalProviders START");
        console.log("  Config:", config);
        
        // Get SearchApiService
        var searchApiService = Alt.UnifiedDataSearch.Services.getSearchApiService();
        if (!searchApiService) {
            console.error("❌ SearchApiService not available for external provider search");
            return $.Deferred().resolve({ 
                results: [], 
                totalResults: 0, 
                success: false,
                error: "SearchApiService not available"
            }).promise();
        }
        
        console.log("✅ SearchApiService available, starting external provider search...");
        
        // Step 1: Check if external search is enabled
        console.log("📡 Step 1: Checking if external search is enabled...");
        searchApiService.checkExternalSearchEnabled()
            .then(function(enabledResponse) {
                console.log("📡 External search enabled response:", enabledResponse);
                
                if (!enabledResponse || !enabledResponse.isEnabled) {
                    console.log("❌ External search is disabled");
                    deferred.resolve({ 
                        results: [], 
                        totalResults: 0, 
                        success: false,
                        error: "External search is disabled"
                    });
                    return;
                }
                
                console.log("✅ External search is ENABLED, proceeding to get providers...");
                
                // Step 2: Get enabled providers
                console.log("📡 Step 2: Getting enabled external providers...");
                return searchApiService.getEnabledExternalProviders();
            })
            .then(function(providers) {
                console.log("📡 External providers response:", providers);
                
                if (!providers || providers.length === 0) {
                    console.log("❌ No external providers available");
                    deferred.resolve({ 
                        results: [], 
                        totalResults: 0, 
                        success: false,
                        error: "No external providers available"
                    });
                    return;
                }
                
                console.log("✅ Found", providers.length, "external providers");
                
                // Step 3: Filter providers by entity type capability
                console.log("🔽 Step 3: Filtering providers by entity type:", config.entityType);
                var capableProviders = self.filterProvidersByEntityType(providers, config.entityType);
                console.log("🔽 Capable providers:", capableProviders);
                
                if (capableProviders.length === 0) {
                    console.log("❌ No providers support requested entity types");
                    deferred.resolve({ 
                        results: [], 
                        totalResults: 0, 
                        success: false,
                        error: "No providers support requested entity types"
                    });
                    return;
                }
                
                console.log("✅ Found", capableProviders.length, "capable providers for entity type:", config.entityType);
                
                // Step 4: Execute searches across all capable providers
                console.log("🚀 Step 4: Executing provider searches...");
                return self.executeProviderSearches(capableProviders, config);
            })
            .then(function(mergedResults) {
                console.log("✅ External provider search COMPLETE, results:", mergedResults);
                deferred.resolve(mergedResults);
            })
            .fail(function(error) {
                console.error("❌ External provider search FAILED:", error);
                deferred.resolve({ 
                    results: [], 
                    totalResults: 0, 
                    success: false,
                    error: error.message || "External provider search failed"
                });
            });
        
        return deferred.promise();
    };
    
    /**
     * Filter providers by their capability to search requested entity types
     * @private
     */
    self.filterProvidersByEntityType = function(providers, entityType) {
        return providers.filter(function(provider) {
            if (entityType === "person") {
                return provider.canSearchPeople;
            } else if (entityType === "organisation") {
                return provider.canSearchOrganisations;
            } else {
                // For "all", provider needs to support at least one type
                return provider.canSearchPeople || provider.canSearchOrganisations;
            }
        });
    };
    
    /**
     * Execute searches across multiple providers and merge results
     * @private
     */
    self.executeProviderSearches = function(providers, config) {
        var deferred = $.Deferred();
        var searchApiService = Alt.UnifiedDataSearch.Services.getSearchApiService();
        var promises = [];
        
        console.log("🚀 executeProviderSearches START");
        console.log("  Providers:", providers);
        console.log("  Config:", config);
        
        // Determine entity types to search
        var entityTypesToSearch = [];
        if (config.entityType === "person") {
            entityTypesToSearch = ["people"]; // API uses plural
        } else if (config.entityType === "organisation") {
            entityTypesToSearch = ["organisations"]; // API uses plural
        } else {
            entityTypesToSearch = ["people", "organisations"];
        }
        
        console.log("📋 Entity types to search:", entityTypesToSearch);
        
        // Create search promises for each provider and entity type combination
        providers.forEach(function(provider) {
            console.log("🔍 Processing provider:", provider.systemName);
            console.log("  Can search people:", provider.canSearchPeople);
            console.log("  Can search organisations:", provider.canSearchOrganisations);
            
            entityTypesToSearch.forEach(function(entityType) {
                // Check provider capability
                var canSearch = (entityType === "people" && provider.canSearchPeople) ||
                               (entityType === "organisations" && provider.canSearchOrganisations);
                
                console.log("  Entity type:", entityType, "Can search:", canSearch);
                
                if (canSearch) {
                    console.log("📡 Creating search promise for", provider.systemName, entityType);
                    
                    var searchPromise = searchApiService.searchExternalProvider(
                        provider.systemName,
                        entityType,
                        config.query,
                        config.page
                    );
                    promises.push(searchPromise);
                    
                    console.log("✅ Added search promise, total promises:", promises.length);
                } else {
                    console.log("❌ Skipping", provider.systemName, entityType, "- capability not supported");
                }
            });
        });
        
        console.log("📊 Total search promises created:", promises.length);
        
        if (promises.length === 0) {
            console.log("❌ No searches could be executed");
            deferred.resolve({ 
                results: [], 
                totalResults: 0, 
                success: false,
                error: "No searches could be executed"
            });
            return deferred.promise();
        }
        
        console.log("⏳ Waiting for", promises.length, "external provider searches to complete...");
        
        // Wait for all searches to complete
        $.when.apply($, promises)
            .always(function() {
                console.log("📥 All external provider searches completed, processing results...");
                console.log("  Arguments received:", arguments.length);
                
                // Collect all results from the arguments
                var allResults = [];
                var totalCount = 0;
                
                // Process each response (arguments contains all promise results)
                for (var i = 0; i < arguments.length; i++) {
                    var response = arguments[i];
                    console.log("  Response", i + ":", response);
                    
                    if (response && response.results && response.results.length > 0) {
                        console.log("    Found", response.results.length, "results in response", i + 1);
                        allResults = allResults.concat(response.results);
                        totalCount += response.totalResults || response.results.length;
                    } else {
                        console.log("    No results in response", i + 1);
                    }
                }
                
                console.log("✅ External provider searches complete, total results:", allResults.length);
                
                deferred.resolve({
                    results: allResults,
                    totalResults: totalCount,
                    success: true
                });
            });
        
        return deferred.promise();
    };
    
    /**
     * Search PMS (DEPRECATED - Replaced by external providers)
     * @private
     */
    self.searchPms = function(config) {
        console.warn("searchPms: DEPRECATED - Use searchExternalProviders instead");
        return self.searchExternalProviders(config);
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
    self.fallbackMerge = function(odsResults, externalResults) {
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
        
        // Add external provider results
        if (externalResults && externalResults.results) {
            externalResults.results.forEach(function(item) {
                merged.push({
                    id: item.id,
                    source: item.source || "external",
                    externalId: item.id,
                    providersReference: item.providersReference,
                    providerSystemName: item.providerSystemName,
                    displayName: self.getDisplayName(item),
                    data: item,
                    icon: self.getIcon(item),
                    primaryEmail: item.email || item.primaryEmail,
                    primaryPhone: item.phone || item.primaryPhone || item.mobile
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