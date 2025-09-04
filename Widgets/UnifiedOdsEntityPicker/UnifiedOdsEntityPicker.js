namespace("Alt.UnifiedDataSearch.Widgets");

/**
 * UnifiedOdsEntityPicker Widget
 * A widget that opens the unified search blade instead of the standard ODS search
 * Can be used as a drop-in replacement for OdsEntityPicker
 * 
 * @param {HTMLElement} element - The Html DOM element to which this widget will bind
 * @param {Object} configuration - The configuration passed in from the designer/config
 * @param {Object} baseModel - The base widget model (contains unique id etc)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker = function(element, configuration, baseModel) {
    var self = this;
    
    // Default configuration
    var defaults = {
        // Parameters from the host (for aspect widgets)
        _host: {
            model: null,
            blade: null,
            enabled: false
        },
        
        // Widget configuration
        label: "Select Entity",
        placeholder: "Click to search and select...",
        required: false,
        allowMultiple: false,
        allowClear: true,
        
        // Entity type configuration
        entityTypes: ["person", "organisation"], // What types to search
        
        // Search blade configuration
        searchMode: "unified", // "unified", "odsOnly", "pmsOnly"
        useMockPms: true,  // Use mock for PMS data
        useMockOds: false,  // Use real ShareDo API for ODS data
        pmsTimeout: 5000,
        
        // Participant configuration (when used in work item context)
        sharedoId: null,
        parentSharedoId: null,
        sharedoTypeSystemName: null,
        addNewParticipantsToSharedoId: null,
        forRoleSystemName: null,
        allowedParticipantRoles: [],
        
        // Display options
        showIcon: true,
        showEmail: true,
        showPhone: false,
        showSource: true,
        showAddress: false,
        showReference: false,
        hideLabel: false,
        
        // Inline search options
        allowInlineSearch: true,  // Enable inline search by default
        inlineSearchDelay: 500,
        minSearchLength: 2,
        
        // Display configuration - which fields to show
        displayFields: ['email', 'phone', 'address'], // Default fields to show
        showSourceBadge: false, // Don't show ODS/PMS badges by default
        maxQuickResults: 5,
        
        // Additional UI options
        allowEdit: true,
        allowAddNew: false,
        searchButtonText: "Search ODS & PMS",
        requiredMessage: "This field is required",
        helpText: null,
        viewMode: "card", // "card" or "list"
        
        // Blade configuration
        bladeName: "Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch",
        bladeWidth: 750,
        
        // Mode: "select" (just return) or "auto" (auto-import PMS to ODS)
        mode: "select",
        
        // Field mapping for aspect binding
        fieldName: null, // The field in the host model to bind to
        returnField: "odsId", // What to store: "odsId", "entity", or custom field
        
        // Display mode options
        displayMode: "simple", // "simple" (our custom UI) or "component" (use ShareDo component)
        
        // ShareDo component configuration (when displayMode is "component")
        useShareDoComponent: false, // Use ShareDo OdsEntityPicker for display
        roleSystemName: null, // Role system name for ShareDo component
        roleLabel: null, // Custom label for the role
        viewMode: "card", // "card" or "list" for ShareDo component
        showSearchOds: false, // Hide standard ODS search (we override it)
        allowInlineSearch: true // Enable inline search for better UX
    };
    
    self.options = $.extend(true, {}, defaults, configuration);
    self.element = element;
    self.baseModel = baseModel;
    self._host = self.options._host;
    
    // Initialize observables
    self.selectedEntities = ko.observableArray([]);
    self.displayValue = ko.observable("");
    self.isSearching = ko.observable(false);
    self.hasValue = ko.observable(false);
    
    // Bind keyboard navigation to result items
    self.isResultSelected = function(index) {
        return ko.computed(function() {
            return self.selectedResultIndex() === index;
        });
    };
    
    // Inline search observables
    self.isSearchActive = ko.observable(false);  // Track if showing results
    self.hasFocus = ko.observable(false);  // Track input focus state
    self.searchHasFocus = ko.observable(false);  // For input binding
    self.hasBeenFocused = ko.observable(false);  // For validation
    self.inlineSearchQuery = ko.observable("").extend({ rateLimit: 500 });
    self.inlineSearchResults = ko.observableArray([]);  // Primary results array for display
    self.quickSearchResults = ko.observableArray([]);    // Kept for backward compatibility
    self.showQuickResults = ko.observable(false);
    self.isPerformingQuickSearch = ko.observable(false);
    self.quickSearchTimeout = null;
    self.searchError = ko.observable(null);
    self.selectedResultIndex = ko.observable(-1);
    
    // Initialize selected entity/entities based on configuration
    if (self.options.allowMultiple) {
        self.selectedEntity = ko.computed({
            read: function() {
                return self.selectedEntities();
            },
            write: function(value) {
                if (Array.isArray(value)) {
                    self.selectedEntities(value);
                } else if (value) {
                    self.selectedEntities([value]);
                } else {
                    self.selectedEntities([]);
                }
            }
        });
    } else {
        self.selectedEntity = ko.computed({
            read: function() {
                var entities = self.selectedEntities();
                return entities.length > 0 ? entities[0] : null;
            },
            write: function(value) {
                if (value) {
                    self.selectedEntities([value]);
                } else {
                    self.selectedEntities([]);
                }
            }
        });
    }
    
    // Computed display value
    self.displayValue = ko.computed(function() {
        var entities = self.selectedEntities();
        
        if (entities.length === 0) {
            return self.options.placeholder;
        }
        
        if (entities.length === 1) {
            return self.getEntityDisplayName(entities[0]);
        }
        
        return entities.length + " entities selected";
    });
    
    // Computed for validation
    self.isValid = ko.computed(function() {
        if (!self.options.required) {
            return true;
        }
        return self.selectedEntities().length > 0;
    });
    
    // Subscribe to changes
    self.selectedEntities.subscribe(function(entities) {
        self.hasValue(entities && entities.length > 0);
        
        // Update host model if in aspect mode
        if (self._host.model && self.options.fieldName) {
            self.updateHostModel(entities);
        }
        
        // Publish change event
        if (window.$ui && window.$ui.events && window.$ui.events.publish) {
            $ui.events.publish("Alt.UnifiedDataSearch.EntitySelected", {
                widgetId: self.baseModel ? self.baseModel.id : null,
                entities: entities,
                mode: self.options.mode
            });
        }
    });
    
    // Expose validation error count for aspect forms
    self.validationErrorCount = ko.pureComputed(function() {
        return self.options.required && !self.isValid() ? 1 : 0;
    });
    
    // CSS classes for input
    self.inputCssClasses = ko.computed(function() {
        var classes = ["form-control", "unified-entity-picker-input"];
        
        if (!self.isValid()) {
            classes.push("is-invalid");
        }
        
        if (self.hasValue()) {
            classes.push("has-value");
        }
        
        if (self._host.enabled === false) {
            classes.push("disabled");
        }
        
        return classes.join(" ");
    });
    
    // Computed for checking if has value
    self.hasValue = ko.computed(function() {
        if (self.options.allowMultiple) {
            return self.selectedEntities().length > 0;
        }
        return self.selectedEntity() !== null && self.selectedEntity() !== undefined;
    });
    
    // Computed for showing search results dropdown
    self.showSearchResults = ko.computed(function() {
        return self.isSearchActive() && 
               (self.inlineSearchResults().length > 0 || 
                self.isPerformingQuickSearch() ||
                (self.inlineSearchQuery() && self.inlineSearchQuery().length > 0));
    });
    
    // Initialize services
    self.initializeServices();
    
    // Setup inline search subscriptions
    self.setupInlineSearchSubscriptions();
    
    // If in host mode (aspect widget), bind to host model
    if (self._host.model && self.options.fieldName) {
        self.bindToHostModel();
    }
    
    // Build ShareDo component configuration if needed
    if (self.options.useShareDoComponent) {
        self.buildShareDoComponentConfig();
    }
};

/**
 * Build configuration for ShareDo OdsEntityPicker component
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.buildShareDoComponentConfig = function() {
    var self = this;
    
    // Build role configuration model
    var roleConfig = {
        roleSystemName: self.options.roleSystemName || "participant",
        label: self.options.roleLabel || self.options.label,
        displayName: self.options.label,
        viewMode: self.options.viewMode || "card",
        disabled: ko.computed(function() {
            return self._host.enabled === false;
        }),
        supportMultiple: self.options.allowMultiple,
        showSearchOds: false, // We'll override the search
        allowInlineSearch: true,  // Enable inline search
        allowAddNew: false, // We handle this in our blade
        requirementLevel: self.options.required ? "mandatory" : "optional",
        showReference: false
    };
    
    // Build the component configuration
    self.shareDoComponentConfig = {
        sharedoId: self.options.sharedoId,
        parentSharedoId: self.options.parentSharedoId,
        sharedoTypeSystemName: self.options.sharedoTypeSystemName,
        roleConfigModels: [roleConfig],
        hideLabel: true, // We show our own label
        participantMode: false, // Store locally
        disabled: ko.computed(function() {
            return self._host.enabled === false;
        }),
        blade: self._host.blade
    };
    
    // Override the search handler if component is available
    self.overrideShareDoSearch();
};

/**
 * Override ShareDo component search to use our unified blade
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.overrideShareDoSearch = function() {
    var self = this;
    
    // Subscribe to ShareDo component events to intercept search clicks
    if (window.$ui && window.$ui.events && window.$ui.events.subscribe) {
        // Listen for ODS entity picker search events
        self.searchInterceptSubscription = $ui.events.subscribe(
            "Sharedo.Core.Case.Components.OdsEntityPicker.searchInitiated",
            function(data) {
                // Cancel the default search
                if (data && data.cancel) {
                    data.cancel();
                }
                
                // Open our unified search blade instead
                self.openSearchBlade();
            },
            self
        );
    }
};

/**
 * Bind to host model for aspect widgets
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.bindToHostModel = function() {
    var self = this;
    var hostModel = self.options._host.model;
    
    // Look for common field names in host model
    var fieldNames = ['odsId', 'participantId', 'entityId', 'selectedEntity', 'participant'];
    
    for (var i = 0; i < fieldNames.length; i++) {
        var fieldName = fieldNames[i];
        if (hostModel[fieldName]) {
            // Bind to host field
            if (ko.isObservable(hostModel[fieldName])) {
                // Two-way binding
                hostModel[fieldName].subscribe(function(value) {
                    if (value && typeof value === 'string') {
                        // Load entity by ID
                        self.loadEntityById(value);
                    } else if (value && typeof value === 'object') {
                        self.selectedEntity(value);
                    }
                });
                
                self.selectedEntity.subscribe(function(entity) {
                    if (entity) {
                        // Update host model with entity ID or full entity
                        if (typeof hostModel[fieldName]() === 'string') {
                            hostModel[fieldName](entity.odsId || entity.id);
                        } else {
                            hostModel[fieldName](entity);
                        }
                    } else {
                        hostModel[fieldName](null);
                    }
                });
            }
            break;
        }
    }
};

/**
 * Open the search blade
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.openSearchBlade = function() {
    var self = this;
    
    if (self.isSearching()) {
        return;
    }
    
    self.isSearching(true);
    
    // Build blade configuration
    var bladeConfig = {
        mode: self.options.mode || "select", // Use configured mode, default to "select" for backward compatibility
        entityTypes: self.options.entityTypes,
        searchMode: self.options.searchMode,
        useMockPms: true,  // Always use mock for PMS
        useMockOds: false,  // Always use real ShareDo API for ODS
        pmsTimeout: self.options.pmsTimeout,
        allowMultiple: self.options.allowMultiple,
        sharedoId: self.options.sharedoId,
        parentSharedoId: self.options.parentSharedoId,
        sharedoTypeSystemName: self.options.sharedoTypeSystemName
    };
    
    // Open the blade
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        var panelInstance = $ui.stacks.openPanel(self.options.bladeName, bladeConfig);
        
        // Handle the panel close callback
        if (panelInstance && panelInstance.closed) {
            panelInstance.closed.then(function(result) {
                self.isSearching(false);
                
                // Handle result
                if (result && result.selectedEntity) {
                    if (self.options.allowMultiple) {
                        // Add to existing selection
                        var current = self.selectedEntities();
                        var exists = current.some(function(e) {
                            return (e.odsId || e.id) === (result.selectedEntity.odsId || result.selectedEntity.id);
                        });
                        
                        if (!exists) {
                            current.push(result.selectedEntity);
                            self.selectedEntities(current);
                        }
                    } else {
                        // Replace selection
                        self.selectedEntity(result.selectedEntity);
                    }
                }
            });
        } else {
            // Fallback if promise not available
            self.isSearching(false);
        }
    } else {
        self.isSearching(false);
        console.error("Cannot open search blade - $ui.stacks.openPanel not available");
    }
};

/**
 * Clear the current selection
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.clearSelection = function() {
    var self = this;
    self.selectedEntities([]);
};

/**
 * Remove a specific entity from selection
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.removeEntity = function(entity) {
    var self = this;
    
    var current = self.selectedEntities();
    var filtered = current.filter(function(e) {
        return (e.odsId || e.id) !== (entity.odsId || entity.id);
    });
    
    self.selectedEntities(filtered);
};

/**
 * Get display name for an entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getEntityDisplayName = function(entity) {
    var self = this;
    
    if (!entity) {
        return "";
    }
    
    // Person
    if (entity.firstName || entity.lastName) {
        var parts = [];
        if (entity.firstName) parts.push(entity.firstName);
        if (entity.lastName) parts.push(entity.lastName);
        return parts.join(" ");
    }
    
    // Organisation
    if (entity.name || entity.organisationName) {
        return entity.name || entity.organisationName;
    }
    
    // Fallback
    return entity.displayName || entity.title || "Unknown Entity";
};

/**
 * Get icon for an entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getEntityIcon = function(entity) {
    if (!entity) {
        return "fa-question";
    }
    
    if (entity.icon) {
        return entity.icon;
    }
    
    if (entity.odsType === "person" || entity.firstName || entity.lastName) {
        return "fa-user";
    }
    
    if (entity.odsType === "organisation" || entity.organisationName || entity.name) {
        return "fa-building";
    }
    
    return "fa-circle";
};

/**
 * Get source badge for entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getSourceBadge = function(entity) {
    if (!entity || !entity.source) {
        return "";
    }
    
    switch(entity.source) {
        case "sharedo":
            return '<span class="source-badge source-sharedo"><i class="fa fa-database"></i> ODS</span>';
        case "pms":
            return '<span class="source-badge source-pms"><i class="fa fa-briefcase"></i> PMS</span>';
        case "matched":
            return '<span class="source-badge source-matched"><i class="fa fa-link"></i> Matched</span>';
        default:
            return "";
    }
};

/**
 * Handle search input focus
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.handleSearchFocus = function() {
    var self = this;
    console.log("[UnifiedOdsEntityPicker] Search input focused");
    self.hasFocus(true);
    self.hasBeenFocused(true);
    self.searchHasFocus(true);
    // Only show results if we have a query
    if (self.inlineSearchQuery() && self.inlineSearchQuery().length >= 2) {
        self.isSearchActive(true);
    }
};

/**
 * Clear search query and results
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.clearSearch = function() {
    var self = this;
    self.inlineSearchQuery("");
    self.inlineSearchResults([]);
    self.quickSearchResults([]);
    self.selectedResultIndex(-1);
    self.isSearchActive(false);
    self.searchError(null);
    // Refocus the input
    setTimeout(function() {
        $(self.element).find('.search-input').focus();
    }, 50);
};

/**
 * View entity details (following ShareDo OdsEntityPicker.openOdsEntity pattern)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.viewEntity = function() {
    var self = this;
    var entities = self.selectedEntities();
    
    if (!entities || entities.length === 0) {
        return;
    }
    
    var entity = entities[0]; // Get first selected entity
    
    if (!entity || !entity.odsId) {
        return;
    }
    
    var bladeType;
    
    // Determine blade type based on entity type (EXACTLY like ShareDo OdsEntityPicker)
    var participantType = entity.data.odsType || entity.data.odsEntityType;
    if (!participantType) {
        // Infer type from entity properties
        if (entity.firstName || entity.lastName) {
            participantType = "person";
        } else if (entity.name || entity.organisationName) {
            participantType = "organisation";
        }
    }
    
    switch (participantType) {
        case "person":
            bladeType = "Sharedo.Core.Case.Panels.Ods.AddEditPerson";
            break;
        case "organisation":
            bladeType = "Sharedo.Core.Case.Panels.Ods.AddEditOrganisation";
            break;
        default:
            return;
    }
    
    // Cancel after current blade if we have a blade reference (like ShareDo does)
    if (self._host && self._host.blade) {
        $ui.stacks.cancelAfter(self._host.blade);
    }
    
    // Open the blade (EXACTLY like ShareDo OdsEntityPicker)
    $ui.stacks.openPanel(bladeType, {
        id: entity.odsId
    });
};

/**
 * Handle search blur event
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.handleSearchBlur = function() {
    var self = this;
    // Delay to allow click events on results
    setTimeout(function() {
        if (!self._preventBlur && !self._keepSearchOpen) {
            self.hasFocus(false);
            self.searchHasFocus(false);
            self.isSearchActive(false);
            // Don't clear the query - keep for user convenience
            // Only hide results
            if (!self.inlineSearchQuery() || self.inlineSearchQuery().length < 2) {
                self.inlineSearchResults([]);
                self.quickSearchResults([]);
            }
            self.selectedResultIndex(-1);
        }
        self._preventBlur = false;
        self._keepSearchOpen = false;
    }, 200);
};

/**
 * Handle keyboard navigation in search
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.handleSearchKeydown = function(data, event) {
    var self = this;
    var results = self.inlineSearchResults();
    var currentIndex = self.selectedResultIndex();
    
    switch(event.keyCode) {
        case 40: // Arrow Down
            event.preventDefault();
            if (results.length > 0) {
                if (currentIndex < results.length - 1) {
                    self.selectedResultIndex(currentIndex + 1);
                } else {
                    self.selectedResultIndex(0); // Wrap to first
                }
            }
            break;
            
        case 38: // Arrow Up
            event.preventDefault();
            if (results.length > 0) {
                if (currentIndex > 0) {
                    self.selectedResultIndex(currentIndex - 1);
                } else if (currentIndex === -1) {
                    self.selectedResultIndex(results.length - 1); // Start from bottom
                } else {
                    self.selectedResultIndex(results.length - 1); // Wrap to last
                }
            }
            break;
            
        case 13: // Enter
            event.preventDefault();
            if (currentIndex >= 0 && currentIndex < results.length) {
                self.selectInlineResult(results[currentIndex]);
            } else if (results.length === 1) {
                // Auto-select single result
                self.selectInlineResult(results[0]);
            } else if (results.length === 0 && self.inlineSearchQuery().length > 2) {
                // Open full search if no results
                self.openSearchBlade();
            }
            break;
            
        case 27: // Escape
            event.preventDefault();
            self.isSearchActive(false);
            self.inlineSearchQuery("");
            self.inlineSearchResults([]);
            self.selectedResultIndex(-1);
            break;
            
        case 9: // Tab
            // Let tab work normally to move to next field
            self.isSearchActive(false);
            break;
    }
    
    return true;
};

/**
 * Prevent blur when clicking on results
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.preventBlur = function() {
    var self = this;
    self._preventBlur = true;
    return true; // Allow event to continue
};

/**
 * Handle inline search input
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.handleInlineSearch = function(data, event) {
    var self = this;
    
    // Clear previous timeout
    if (self.quickSearchTimeout) {
        clearTimeout(self.quickSearchTimeout);
    }
    
    var query = self.inlineSearchQuery();
    
    // Hide results if query is too short
    if (!query || query.length < self.options.minSearchLength) {
        self.showQuickResults(false);
        self.quickSearchResults([]);
        self.inlineSearchResults([]);
        return true;
    }
    
    // Debounce the search
    self.quickSearchTimeout = setTimeout(function() {
        // Always use executeInlineSearch which has the working API call implementation
        self.executeInlineSearch();
    }, self.options.inlineSearchDelay);
    
    // Handle Enter key
    if (event && event.keyCode === 13) {
        clearTimeout(self.quickSearchTimeout);
        if (self.quickSearchResults().length === 1) {
            // Auto-select if only one result
            self.selectQuickResult(self.quickSearchResults()[0]);
        } else {
            // Open full search blade
            self.openSearchBlade();
        }
        return false;
    }
    
    // Handle Escape key
    if (event && event.keyCode === 27) {
        self.showQuickResults(false);
        return false;
    }
    
    return true;
};

/**
 * Execute inline search
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.executeInlineSearch = function() {
    var self = this;
    var query = self.inlineSearchQuery();
    
    console.log("executeInlineSearch called with query:", query);
    console.log("Options:", self.options);
    
    if (!query || query.length < self.options.minSearchLength) {
        console.log("Query too short, minLength:", self.options.minSearchLength);
        return;
    }
    
    self.isPerformingQuickSearch(true);
    console.log("Starting search...");
    
    // Build search parameters
    var searchPromises = [];
    
    console.log("Search mode:", self.options.searchMode);
    console.log("Mock PMS Service available:", !!Alt.UnifiedDataSearch.Services.mockPmsService);
    
    // Search ODS if enabled (EXACTLY like blade)
    if (self.options.searchMode === "unified" || self.options.searchMode === "odsOnly") {
        console.log("Making ODS search with query:", query);
        
        // Build search payload for ShareDo ODS _search endpoint (EXACTLY like blade)
        var payload = {
            startPage: 1,  // ShareDo uses 1-based pages
            endPage: 1,
            rowsPerPage: self.options.maxQuickResults || 10,  // Match blade default
            searchString: query || "",
            odsEntityTypes: [],
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
        
        // Add entity type filter (EXACTLY like blade)
        var entityTypes = self.options.entityTypes || ["person", "organisation"];
        if (entityTypes.length === 1 && entityTypes[0] === "person") {
            payload.odsEntityTypes = ["person"];
        } else if (entityTypes.length === 1 && entityTypes[0] === "organisation") {
            payload.odsEntityTypes = ["organisation"];
        } else {
            // For "all" or multiple types, include both
            payload.odsEntityTypes = ["person", "organisation"];
        }
        
        console.log("ODS API payload:", payload);
        
        // Create deferred to handle fallback (EXACTLY like blade)
        var odsDeferred = $.Deferred();
        
        // Try real API first using POST to _search endpoint (EXACTLY like blade)
        var apiCall = window.$ajax && window.$ajax.post ? 
            $ajax.post("/api/ods/_search", payload) :
            $.ajax({
                url: "/api/ods/_search",
                method: "POST",
                data: JSON.stringify(payload),
                contentType: "application/json",
                dataType: "json"
            });
        
        apiCall
            .done(function(data) {
                console.log("ODS API raw response:", data);
                
                // Parse ShareDo response format (EXACTLY like blade)
                var results = [];
                
                // ShareDo returns data in rows property with result as JSON string
                if (data.rows && Array.isArray(data.rows)) {
                    data.rows.forEach(function(row) {
                        try {
                            // Parse the JSON string in the result property
                            var entity = JSON.parse(row.result);
                            // Add the ID and entity type from the row
                            entity.id = entity.id || row.id;
                            entity.odsId = entity.id || row.id;
                            entity.odsEntityType = entity.odsEntityType || row.odsEntityType;
                            
                            // Extract contact details if they're in aspectData
                            if (entity.aspectData && entity.aspectData.ContactDetails) {
                                var contacts = entity.aspectData.ContactDetails;
                                // Find primary email
                                var emailContact = contacts.find(function(c) {
                                    return c.contactTypeSystemName === "email" && c.isPrimary;
                                }) || contacts.find(function(c) {
                                    return c.contactTypeSystemName === "email";
                                });
                                if (emailContact) {
                                    entity.email = emailContact.contactValue;
                                }
                                
                                // Find primary phone
                                var phoneContact = contacts.find(function(c) {
                                    return (c.contactTypeSystemName === "mobile" || c.contactTypeSystemName === "direct-line") && c.isPrimary;
                                }) || contacts.find(function(c) {
                                    return c.contactTypeSystemName === "mobile";
                                }) || contacts.find(function(c) {
                                    return c.contactTypeSystemName === "direct-line";
                                });
                                if (phoneContact) {
                                    entity.phone = phoneContact.contactValue;
                                }
                            }
                            
                            // Extract location/address if available
                            if (entity.locations && entity.locations.length > 0) {
                                var location = entity.locations[0];
                                entity.address = location.addressLine1;
                                entity.suburb = location.town;
                                entity.postcode = location.postCode;
                                entity.state = location.county;
                                entity.country = location.country;
                            }
                            
                            results.push(entity);
                        } catch(e) {
                            console.error("Failed to parse ODS result row:", e, row);
                        }
                    });
                } else if (data.results) {
                    // Handle if results are already parsed
                    results = data.results;
                } else if (Array.isArray(data)) {
                    // Handle if data is directly an array
                    results = data;
                }
                
                // Transform the response to match our expected format
                var transformed = {
                    success: true,
                    results: results,
                    totalResults: data.totalRows || data.totalCount || results.length,
                    page: 0,
                    hasMore: data.totalPages ? (data.endPage < data.totalPages) : false,
                    totalPages: data.totalPages || 1
                };
                
                console.log("ODS API transformed response:", transformed);
                odsDeferred.resolve(transformed);
            })
            .fail(function(error) {
                console.warn("ODS API failed, falling back to mock data:", error);
                // Fallback to mock data (EXACTLY like blade)
                self.getMockOdsData(query)
                    .done(function(mockData) {
                        odsDeferred.resolve(mockData);
                    })
                    .fail(function(mockError) {
                        odsDeferred.reject(mockError);
                    });
            });
        
        searchPromises.push(odsDeferred.promise());
        console.log("ODS search initiated");
    }
    
    // Search PMS if enabled (EXACTLY like blade - always use mock)
    if (self.options.searchMode === "unified" || self.options.searchMode === "pmsOnly") {
        console.log("Making PMS search with query:", query);
        
        // Ensure mock service is available (EXACTLY like blade)
        if (!self.mockPmsService) {
            console.error("Mock PMS service not initialized");
            // Try to get it from the global namespace
            self.mockPmsService = Alt.UnifiedDataSearch.Services.mockPmsService;
            
            // If still not available, try to create it
            if (!self.mockPmsService && Alt.UnifiedDataSearch.Services.MockPmsService) {
                console.warn("Creating mock PMS service on demand");
                self.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();
                Alt.UnifiedDataSearch.Services.mockPmsService = self.mockPmsService;
            }
        }
        
        var entityTypes = self.options.entityTypes || ["person", "organisation"];
        
        // For "all" or multiple types, we need to search both types and merge (EXACTLY like blade)
        if (entityTypes.length > 1 || (entityTypes.indexOf("person") > -1 && entityTypes.indexOf("organisation") > -1)) {
            // Search both persons and organisations
            var personsPromise = self.searchPmsType("persons", query, 0);
            var orgsPromise = self.searchPmsType("organisations", query, 0);
            
            // Merge results from both searches (EXACTLY like blade)
            var combinedPromise = $.when(personsPromise, orgsPromise).then(function(personsResult, orgsResult) {
                var combinedResults = {
                    success: true,
                    results: [],
                    totalResults: 0,
                    page: 0,
                    hasMore: false
                };
                
                // Add persons results
                if (personsResult && personsResult.results) {
                    combinedResults.results = combinedResults.results.concat(personsResult.results);
                    combinedResults.totalResults += personsResult.totalResults || personsResult.results.length;
                }
                
                // Add organisations results
                if (orgsResult && orgsResult.results) {
                    combinedResults.results = combinedResults.results.concat(orgsResult.results);
                    combinedResults.totalResults += orgsResult.totalResults || orgsResult.results.length;
                }
                
                combinedResults.hasMore = (personsResult && personsResult.hasMore) || (orgsResult && orgsResult.hasMore);
                
                return combinedResults;
            });
            
            searchPromises.push(combinedPromise);
        } else if (entityTypes[0] === "person") {
            // Search only persons
            searchPromises.push(self.searchPmsType("persons", query, 0));
        } else if (entityTypes[0] === "organisation") {
            // Search only organisations
            searchPromises.push(self.searchPmsType("organisations", query, 0));
        }
        
        console.log("PMS search initiated");
    }
    
    console.log("Total search promises created:", searchPromises.length);
    
    if (searchPromises.length === 0) {
        console.warn("No search promises created!");
        self.isPerformingQuickSearch(false);
        self.quickSearchResults([]);
        self.inlineSearchResults([]);
        return;
    }
    
    // Wait for all searches to complete
    $.when.apply($, searchPromises).done(function() {
        console.log("=== WIDGET SEARCH COMPLETE ===");
        console.log("Search promises count:", searchPromises.length);
        console.log("Arguments received:", arguments);
        
        // Separate ODS and PMS results for merging (like blade does)
        var odsResults = null;
        var pmsResults = null;
        
        // Process based on search mode and number of promises
        if (self.options.searchMode === "unified") {
            console.log("Unified search mode - expecting both ODS and PMS results");
            
            if (searchPromises.length === 2) {
                // We have both ODS and PMS promises
                // ODS promise was added first, then PMS
                console.log("Two promises detected - ODS and PMS");
                odsResults = arguments[0];
                pmsResults = arguments[1];
            } else if (searchPromises.length === 1) {
                // Only one promise - need to determine type
                console.log("Single promise detected - determining type");
                var result = arguments[0];
                
                // Check if this looks like mock PMS data
                if (result && result.success !== undefined && result.results) {
                    // Mock PMS service returns {success: true, results: [...]}
                    console.log("Detected mock PMS format");
                    pmsResults = result;
                } else if (result && result.results) {
                    // ODS returns {results: [...], totalResults: n}
                    console.log("Detected ODS format");
                    odsResults = result;
                }
            }
        } else if (self.options.searchMode === "odsOnly") {
            console.log("ODS only mode");
            odsResults = arguments[0];
        } else if (self.options.searchMode === "pmsOnly") {
            console.log("PMS only mode");
            pmsResults = arguments[0];
        }
        
        // Ensure we have valid result structures
        odsResults = odsResults || { results: [] };
        pmsResults = pmsResults || { results: [] };
        
        console.log("=== PRE-MERGE DATA ===");
        console.log("ODS Results to merge:", odsResults);
        console.log("  - Count:", odsResults.results ? odsResults.results.length : 0);
        console.log("PMS Results to merge:", pmsResults);
        console.log("  - Count:", pmsResults.results ? pmsResults.results.length : 0);
        
        // Use ResultMergerService to merge results (EXACTLY like blade)
        var mergedResults = [];
        if (Alt.UnifiedDataSearch.Services && Alt.UnifiedDataSearch.Services.resultMergerService) {
            console.log("Using ResultMergerService for merging");
            mergedResults = Alt.UnifiedDataSearch.Services.resultMergerService.mergeResults(odsResults, pmsResults);
            console.log("=== POST-MERGE DATA ===");
            console.log("Merged results count:", mergedResults.length);
            console.log("Merged results:", mergedResults);
            
            // Log source distribution
            var sourceCounts = {
                sharedo: 0,
                pms: 0,
                matched: 0
            };
            mergedResults.forEach(function(r) {
                sourceCounts[r.source] = (sourceCounts[r.source] || 0) + 1;
            });
            console.log("Source distribution:", sourceCounts);
        } else {
            // Fallback to simple concatenation if service not available
            console.error("!!! ResultMergerService NOT AVAILABLE !!!");
            console.log("Alt.UnifiedDataSearch.Services:", Alt.UnifiedDataSearch.Services);
            var allResults = [];
            if (odsResults.results) allResults = allResults.concat(odsResults.results);
            if (pmsResults.results) allResults = allResults.concat(pmsResults.results);
            mergedResults = allResults;
        }
        
        // Process results to add proper display information
        if (mergedResults && mergedResults.length > 0) {
            // Ensure each result has proper display fields (enrich like blade does)
            mergedResults = mergedResults.map(function(item) {
                // Create a display object with all necessary fields
                var result = {
                    id: item.id || item.odsId,
                    odsId: item.odsId || item.id,
                    displayName: item.displayName || self.getEntityDisplayName(item),
                    icon: item.icon || self.getEntityIcon(item),
                    data: item,
                    // Set source based on ID format or existing source
                    source: item.source || (item.id && item.id.indexOf("PMS") > -1 ? "pms" : "sharedo"),
                    sourceLabel: "",
                    // Copy over contact details
                    email: item.email || (item.data && item.data.email),
                    phone: item.phone || (item.data && item.data.phone),
                    primaryEmail: item.email || (item.data && item.data.email),
                    primaryPhone: item.phone || (item.data && item.data.phone)
                };
                
                // Set source label based on source
                switch(result.source) {
                    case "pms":
                        result.sourceLabel = self.options.labels && self.options.labels.pms || "PMS";
                        break;
                    case "sharedo":
                    case "ods":
                        result.sourceLabel = self.options.labels && self.options.labels.sharedo || "ShareDo";
                        break;
                    case "matched":
                        result.sourceLabel = self.options.labels && self.options.labels.matched || "MATCHED";
                        break;
                    default:
                        result.sourceLabel = result.source.toUpperCase();
                }
                
                return result;
            });
        }
        
        // Limit results
        mergedResults = mergedResults.slice(0, self.options.maxQuickResults || 10);
        
        console.log("Final results to display:", mergedResults);
        
        // Process and display results
        self.quickSearchResults(mergedResults);
        self.inlineSearchResults(mergedResults);  // Update both arrays for compatibility
        self.isPerformingQuickSearch(false);
        console.log("Search complete, results set");
    }).fail(function(error) {
        console.error("Search failed:", error);
        self.isPerformingQuickSearch(false);
        self.quickSearchResults([]);
        self.inlineSearchResults([]);
    });
};

/**
 * Select a quick search result
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.selectQuickResult = function(entity) {
    var self = this;
    
    console.log("Selecting quick result:", entity);
    
    // Prevent the blur handler from clearing
    self._preventBlur = true;
    
    // Clear inline search
    self.isSearchActive(false);
    self.inlineSearchQuery("");
    self.showQuickResults(false);
    self.quickSearchResults([]);
    self.inlineSearchResults([]);
    
    // Set the selected entity
    if (self.options.allowMultiple) {
        var current = self.selectedEntities();
        var exists = current.some(function(e) {
            return (e.odsId || e.id) === (entity.odsId || entity.id);
        });
        
        if (!exists) {
            current.push(entity);
            self.selectedEntities(current);
        }
    } else {
        self.selectedEntity(entity);
    }
    
    // If in host mode, update the host model
    if (self._host && self._host.model && self.options.fieldName) {
        var value = self.getReturnValue(entity);
        if (self._host.model[self.options.fieldName]) {
            self._host.model[self.options.fieldName](value);
        }
    }
    
    // Reset prevent blur flag after a delay
    setTimeout(function() {
        self._preventBlur = false;
    }, 300);
};

/**
 * Format address for display - first line only for compact display
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.formatAddress = function(entity) {
    if (!entity) return "";
    
    var address = entity.address || entity.postalAddress;
    
    if (address) {
        // Get first line only (up to first comma or newline)
        var firstLine = address.split(/[,\n]/)[0].trim();
        
        // Add suburb if available for context
        var suburb = entity.suburb || entity.postalSuburb;
        if (suburb) {
            return firstLine + ", " + suburb;
        }
        return firstLine;
    }
    
    // Fallback to suburb only if no address
    var suburb = entity.suburb || entity.postalSuburb;
    if (suburb) {
        var state = entity.state || entity.postalState;
        if (state) {
            return suburb + ", " + state;
        }
        return suburb;
    }
    
    return "";
};

/**
 * Check if a field should be displayed based on configuration
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.shouldShowField = function(fieldName) {
    var self = this;
    
    // Default fields to show if not configured
    if (!self.options.displayFields) {
        return ['email', 'phone', 'address'].indexOf(fieldName) > -1;
    }
    
    // Check if field is in configured list
    return self.options.displayFields.indexOf(fieldName) > -1;
};

/**
 * Format date of birth for display
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.formatDateOfBirth = function(dateOfBirth) {
    if (!dateOfBirth) return "";
    
    // Handle ShareDo PureDate format (YYYYMMDD as integer)
    if (typeof dateOfBirth === 'number') {
        var dateStr = dateOfBirth.toString();
        if (dateStr.length === 8) {
            var year = dateStr.substring(0, 4);
            var month = dateStr.substring(4, 6);
            var day = dateStr.substring(6, 8);
            return day + "/" + month + "/" + year;
        }
    }
    
    // Handle string date formats
    if (typeof dateOfBirth === 'string') {
        // If already in DD/MM/YYYY format
        if (dateOfBirth.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            return dateOfBirth;
        }
        // If in YYYY-MM-DD format
        if (dateOfBirth.match(/^\d{4}-\d{2}-\d{2}/)) {
            var parts = dateOfBirth.split('-');
            return parts[2] + "/" + parts[1] + "/" + parts[0];
        }
    }
    
    return dateOfBirth.toString();
};

/**
 * Edit the selected entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.editEntity = function(entity) {
    var self = this;
    var entityToEdit = entity || self.selectedEntity();
    
    if (!entityToEdit) return;
    
    // Open appropriate edit blade based on entity type
    var bladeName;
    if (entityToEdit.odsType === "person" || entityToEdit.firstName || entityToEdit.lastName) {
        bladeName = "Sharedo.Core.Case.Panels.Ods.AddEditPerson";
    } else {
        bladeName = "Sharedo.Core.Case.Panels.Ods.AddEditOrganisation";
    }
    
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        $ui.stacks.openPanel(bladeName, {
            id: entityToEdit.odsId || entityToEdit.id
        });
    }
};

/**
 * Add a new entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.addNewEntity = function() {
    var self = this;
    
    // Determine entity type to add
    var bladeName;
    if (self.options.entityTypes.length === 1) {
        if (self.options.entityTypes[0] === "person") {
            bladeName = "Sharedo.Core.Case.Panels.Ods.AddEditPerson";
        } else {
            bladeName = "Sharedo.Core.Case.Panels.Ods.AddEditOrganisation";
        }
    } else {
        // Let user choose - open search blade in add mode
        self.openSearchBlade();
        return;
    }
    
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        var panel = $ui.stacks.openPanel(bladeName, { mode: "add" });
        
        if (panel && panel.closed) {
            panel.closed.then(function(result) {
                if (result && result.entity) {
                    self.selectedEntity(result.entity);
                }
            });
        }
    }
};

/**
 * Load entity by ID (for initial binding)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.loadEntityById = function(entityId) {
    var self = this;
    
    if (!entityId) {
        return;
    }
    
    // Try to load from ODS
    if (window.$ajax && window.$ajax.get) {
        // Try person first
        $ajax.get("/api/ods/person/" + entityId)
            .done(function(person) {
                person.odsType = "person";
                person.source = "sharedo";
                self.selectedEntity(person);
            })
            .fail(function() {
                // Try organisation
                $ajax.get("/api/ods/organisation/" + entityId)
                    .done(function(org) {
                        org.odsType = "organisation";
                        org.source = "sharedo";
                        self.selectedEntity(org);
                    })
                    .fail(function() {
                        console.warn("Could not load entity with ID: " + entityId);
                    });
            });
    }
};

/**
 * Called by the UI framework when this widget is being unloaded
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up subscriptions
    if (self.selectedEntity && self.selectedEntity.dispose) {
        self.selectedEntity.dispose();
    }
    
    if (self.displayValue && self.displayValue.dispose) {
        self.displayValue.dispose();
    }
    
    if (self.isValid && self.isValid.dispose) {
        self.isValid.dispose();
    }
};

/**
 * Called by the UI framework after initial creation and binding
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.loadAndBind = function() {
    var self = this;
    
    // If we have an initial value in configuration, load it
    if (self.options.initialEntityId) {
        self.loadEntityById(self.options.initialEntityId);
    }
    
    // Subscribe to inline search query changes
    self.inlineSearchQuery.subscribe(function(newValue) {
        console.log("Inline search query changed:", newValue);
        if (newValue && newValue.length >= self.options.minSearchLength) {
            // Show results when we have enough characters
            self.isSearchActive(true);
            console.log("Triggering executeInlineSearch");
            self.executeInlineSearch();
        } else if (newValue && newValue.length > 0) {
            // Have text but not enough to search
            self.isSearchActive(false);
            self.quickSearchResults([]);
            self.inlineSearchResults([]);
        } else {
            // No text at all
            console.log("Clearing results - empty query");
            self.isSearchActive(false);
            self.quickSearchResults([]);
            self.inlineSearchResults([]);
        }
    });
    
    // Subscribe to refresh events if in participant mode
    if (self.options.mode === "addParticipant" && self.options.sharedoId) {
        if (window.$ui && window.$ui.events && window.$ui.events.subscribe) {
            self.participantUpdateSubscription = $ui.events.subscribe(
                "Sharedo.Core.Case.Participants.Updated",
                function(data) {
                    if (data.sharedoId === self.options.sharedoId) {
                        // Could refresh the widget here if needed
                        console.log("Participants updated for: " + data.sharedoId);
                    }
                },
                self
            );
        }
    }
};

/**
 * Validation method
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.validate = function() {
    var self = this;
    return self.isValid();
};

/**
 * Get the current value(s)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getValue = function() {
    var self = this;
    
    if (self.options.allowMultiple) {
        return self.selectedEntities();
    } else {
        return self.selectedEntity();
    }
};

/**
 * Set the value(s)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.setValue = function(value) {
    var self = this;
    
    if (self.options.allowMultiple) {
        if (Array.isArray(value)) {
            self.selectedEntities(value);
        } else if (value) {
            self.selectedEntities([value]);
        } else {
            self.selectedEntities([]);
        }
    } else {
        self.selectedEntity(value);
    }
};

/**
 * Update host model with selected entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.updateHostModel = function(entities) {
    var self = this;
    var hostModel = self._host.model;
    var fieldName = self.options.fieldName;
    
    if (!hostModel || !fieldName || !hostModel[fieldName]) {
        return;
    }
    
    var entity = entities && entities.length > 0 ? entities[0] : null;
    
    if (ko.isObservable(hostModel[fieldName])) {
        if (entity) {
            // Determine what to store based on returnField option
            switch(self.options.returnField) {
                case "odsId":
                    hostModel[fieldName](entity.odsId || entity.id);
                    break;
                case "entity":
                    hostModel[fieldName](entity);
                    break;
                default:
                    // Store specific field
                    hostModel[fieldName](entity[self.options.returnField] || entity.odsId || entity.id);
            }
        } else {
            hostModel[fieldName](null);
        }
    }
};

/**
 * Called by the aspect IDE adapter before the model is saved
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.onBeforeSave = function(model) {
    var self = this;
    // Validate before save
    return self.isValid();
};

/**
 * Called by the aspect IDE adapter when the model is saved
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.onSave = function(model) {
    var self = this;
    // Update model with current selection
    if (self.options.fieldName && model) {
        var entity = self.selectedEntity();
        if (entity) {
            switch(self.options.returnField) {
                case "odsId":
                    model[self.options.fieldName] = entity.odsId || entity.id;
                    break;
                case "entity":
                    model[self.options.fieldName] = entity;
                    break;
                default:
                    model[self.options.fieldName] = entity[self.options.returnField] || entity.odsId || entity.id;
            }
        } else {
            model[self.options.fieldName] = null;
        }
    }
};

/**
 * Called by the aspect IDE adapter after the model has been saved
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.onAfterSave = function(model) {
    var self = this;
    // Could show success notification here
};

/**
 * Called by the aspect IDE adapter when it reloads aspect data
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.onReload = function(model) {
    var self = this;
    // Reload entity from model if needed
    if (self.options.fieldName && model && model[self.options.fieldName]) {
        var value = model[self.options.fieldName];
        if (typeof value === 'string') {
            self.loadEntityById(value);
        } else if (typeof value === 'object') {
            self.selectedEntity(value);
        }
    }
};

/**
 * Open the unified search blade
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.openUnifiedSearchBlade = function() {
    var self = this;
    
    // Configuration for the unified search blade
    var bladeConfig = {
        searchMode: self.options.searchMode,
        entityTypes: self.options.entityTypes,
        useMockPms: true,  // Always use mock for PMS
        useMockOds: false,  // Always use real ShareDo API for ODS
        allowMultiple: self.options.allowMultiple,
        currentSelection: self.selectedEntities(),
        mode: self.options.mode
    };
    
    // Open the blade using ShareDo's UI stack
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        var panelInstance = $ui.stacks.openPanel(self.options.bladeName, bladeConfig, {
            width: self.options.bladeWidth,
            closing: function(result) {
                console.log("Blade closing with result:", result);
                
                // Handle the result - blade returns selectedEntity (singular)
                if (result && result.selectedEntity) {
                    if (self.options.allowMultiple) {
                        // Add to existing selection
                        var current = self.selectedEntities();
                        var exists = current.some(function(e) {
                            return (e.odsId || e.id) === (result.selectedEntity.odsId || result.selectedEntity.id);
                        });
                        
                        if (!exists) {
                            current.push(result.selectedEntity);
                            self.selectedEntities(current);
                        }
                    } else {
                        // Replace selection
                        self.selectedEntity(result.selectedEntity);
                    }
                } else if (result && result.selectedEntities) {
                    // Also handle plural form for backward compatibility
                    self.selectedEntities(result.selectedEntities);
                }
                
                self.isSearching(false);
            }
        });
    } else {
        console.error("ShareDo UI stack not available for opening blade");
    }
};

/**
 * Clear the current selection
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.clearSelection = function() {
    var self = this;
    self.selectedEntities([]);
};

/**
 * Open search blade (alias for openUnifiedSearchBlade for backward compatibility)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.openSearchBlade = function() {
    var self = this;
    self.openUnifiedSearchBlade();
};

/**
 * Initialize services for inline search
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.initializeServices = function() {
    var self = this;
    
    // Use the singleton UnifiedSearchService if available
    if (Alt.UnifiedDataSearch.Services && Alt.UnifiedDataSearch.Services.unifiedSearchService) {
        self.searchService = Alt.UnifiedDataSearch.Services.unifiedSearchService;
        console.log("Using UnifiedSearchService singleton for inline search");
    } else {
        console.warn("UnifiedSearchService not available, will use direct API calls");
    }
    
    // Use singleton import service if available
    if (Alt.UnifiedDataSearch.Services && Alt.UnifiedDataSearch.Services.odsImportService) {
        self.importService = Alt.UnifiedDataSearch.Services.odsImportService;
    }
};

/**
 * Setup inline search subscriptions
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.setupInlineSearchSubscriptions = function() {
    var self = this;
    
    // Computed for showing inline results
    self.showInlineResults = ko.computed(function() {
        return self.isSearchActive() && 
               (self.inlineSearchResults().length > 0 || 
                self.isSearching() || 
                self.inlineSearchQuery().length >= 2);
    });
    
    self.hasMoreResults = ko.computed(function() {
        return self.inlineSearchResults().length >= 10;
    });
    
    // Subscribe to search query changes with debouncing
    var searchTimeout;
    self.inlineSearchQuery.subscribe(function(query) {
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        if (query && query.length >= 2) {
            // Debounce the search
            searchTimeout = setTimeout(function() {
                // Use executeInlineSearch directly
                self.executeInlineSearch();
            }, 300);  // 300ms debounce
        } else {
            self.inlineSearchResults([]);
            self.quickSearchResults([]);
        }
    });
};



/**
 * Prevent blur when clicking on results
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.preventBlur = function() {
    var self = this;
    self._keepSearchOpen = true;
    setTimeout(function() {
        self._keepSearchOpen = false;
    }, 300);
};

/**
 * Perform inline search
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.performInlineSearch = function(query) {
    var self = this;
    
    console.log("performInlineSearch called with query:", query);
    
    // Just use executeInlineSearch which has the working implementation
    self.executeInlineSearch();
};

/**
 * Select inline search result
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.selectInlineResult = function(result) {
    // CRITICAL FIX: The context (this) is being overwritten somewhere,
    // so we need to get the widget instance from the parent scope
    var widget = this;
    
    // If 'this' contains result data instead of widget instance, we need to find the widget
    if (this && this.id && this.source && this.displayName) {
        // 'this' is actually the result object, not the widget!
        // We need to find the widget instance from the binding context
        console.error("CRITICAL BUG: selectInlineResult called with wrong context!");
        console.log("'this' contains result data:", this);
        console.log("Expected widget, got result. Attempting to recover...");
        
        // Try to find the widget from the DOM element or binding context
        // This is a fallback - the real fix is in the HTML binding
        widget = null;
        
        // Try to get widget from jQuery data or other sources
        var elements = $('.Alt-UnifiedDataSearch-Widgets-UnifiedOdsEntityPicker');
        if (elements.length > 0) {
            var element = elements[0];
            widget = ko.dataFor(element);
            console.log("Recovered widget from DOM:", widget);
        }
        
        if (!widget) {
            console.error("Could not recover widget instance. Selection will fail.");
            return false;
        }
        
        // In this case, 'this' is actually the result, so use it as the result
        result = this;
    }
    
    console.log("selectInlineResult called with result:", result);
    console.log("Widget instance:", widget);
    
    // Prevent blur from closing the search
    if (widget._preventBlur !== undefined) {
        widget._preventBlur = true;
    }
    
    // Ensure we have the data object
    var entityData = result.data || result;
    
    if (widget.options && widget.options.mode === "auto" && result.source === "pms") {
        // Auto-import PMS record to ShareDo
        if (widget.importService && widget.importService.importEntity) {
            if (widget.isSearching) widget.isSearching(true);
            
            widget.importService.importEntity(result)
                .done(function(imported) {
                    console.log("Entity imported:", imported);
                    widget.setSelectedEntity(imported);
                    widget.closeInlineSearch();
                })
                .fail(function(error) {
                    console.error("Failed to import entity:", error);
                    alert("Failed to import entity: " + (error.message || error));
                    if (widget._preventBlur !== undefined) widget._preventBlur = false;
                    if (widget.isSearching) widget.isSearching(false);
                });
        } else {
            // No import service available, just select the PMS entity directly
            console.warn("Import service not available, selecting PMS entity directly");
            widget.setSelectedEntity(entityData);
            widget.closeInlineSearch();
        }
    } else {
        // Direct selection for ShareDo entities
        console.log("Selecting ShareDo entity directly");
        widget.setSelectedEntity(entityData);
        widget.closeInlineSearch();
    }
    
    // Reset prevent blur after a delay
    setTimeout(function() {
        if (widget._preventBlur !== undefined) {
            widget._preventBlur = false;
        }
    }, 500);
    
    return true;  // Allow event to bubble
};

/**
 * Set selected entity
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.setSelectedEntity = function(entity) {
    var self = this;
    
    console.log("setSelectedEntity called with:", entity);
    
    // Ensure entity has all required fields
    var normalizedEntity = {
        id: entity.id || entity.odsId,
        odsId: entity.odsId || entity.id,
        firstName: entity.firstName,
        lastName: entity.lastName,
        name: entity.name || entity.organisationName,
        email: entity.email || entity.primaryEmail,
        phone: entity.phone || entity.primaryPhone || entity.mobile,
        displayName: entity.displayName || self.getEntityDisplayName(entity),
        odsType: entity.odsType || entity.odsEntityType,
        source: entity.source || "sharedo",
        data: entity.data || entity
    };
    
    if (self.options.allowMultiple) {
        var current = self.selectedEntities();
        var exists = current.some(function(e) {
            return (e.odsId || e.id) === (normalizedEntity.odsId || normalizedEntity.id);
        });
        
        if (!exists) {
            current.push(normalizedEntity);
            self.selectedEntities(current);
        }
    } else {
        // For single selection, update the observable array
        self.selectedEntities([normalizedEntity]);
    }
    
    // Update host model if in aspect mode
    if (self._host && self._host.model && self.options.fieldName) {
        var value = self.getReturnValue(normalizedEntity);
        console.log("Updating host model field:", self.options.fieldName, "with value:", value);
        
        if (self._host.model[self.options.fieldName]) {
            self._host.model[self.options.fieldName](value);
        } else {
            console.warn("Host model field not found:", self.options.fieldName);
        }
    }
    
    console.log("Entity selected. Current selection:", self.selectedEntities());
};

/**
 * Close inline search
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.closeInlineSearch = function() {
    var self = this;
    
    console.log("[closeInlineSearch] Closing dropdown and clearing search");
    
    // Clear the search state
    self.isSearchActive(false);
    self.searchHasFocus(false);
    self.inlineSearchQuery("");
    self.inlineSearchResults([]);
    self.quickSearchResults([]);
    self.selectedResultIndex(-1);
    self._keepSearchOpen = false;
    self._preventBlur = false;
    
    // Blur the search input to ensure dropdown closes
    var searchInput = $(self.element).find('.search-input');
    if (searchInput.length > 0) {
        searchInput.blur();
    }
};

/**
 * Get return value for host model based on configuration
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getReturnValue = function(entity) {
    var self = this;
    
    if (!entity) {
        return null;
    }
    
    // Determine what value to return based on configuration
    var returnField = self.options.returnField || "odsId";
    
    switch (returnField) {
        case "odsId":
            return entity.odsId || entity.id;
        case "id":
            return entity.id || entity.odsId;
        case "entity":
            return entity;
        case "data":
            return entity.data || entity;
        default:
            // Try to get the field from the entity
            return entity[returnField] || entity.odsId || entity.id;
    }
};

/**
 * Helper method to search specific PMS entity type (EXACTLY like blade)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.searchPmsType = function(type, query, page) {
    var self = this;
    
    // Ensure mock service is available
    if (!self.mockPmsService) {
        console.error("Mock PMS service not initialized");
        // Try to get it from the global namespace
        self.mockPmsService = Alt.UnifiedDataSearch.Services.mockPmsService;
        
        // If still not available, try to create it
        if (!self.mockPmsService && Alt.UnifiedDataSearch.Services.MockPmsService) {
            console.warn("Creating mock PMS service on demand");
            self.mockPmsService = new Alt.UnifiedDataSearch.Services.MockPmsService();
            Alt.UnifiedDataSearch.Services.mockPmsService = self.mockPmsService;
        }
    }
    
    // Check if service is available and has search method
    if (self.mockPmsService && typeof self.mockPmsService.search === 'function') {
        return self.mockPmsService.search(type, query, page);
    } else {
        console.error("Mock PMS service search method not available");
        // Return empty results as fallback
        return $.Deferred().resolve({ 
            success: true, 
            results: [], 
            totalResults: 0,
            page: page || 0,
            hasMore: false 
        }).promise();
    }
};

/**
 * Get mock ODS data (EXACTLY like blade - fallback when real API fails)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.getMockOdsData = function(query, page) {
    var self = this;
    var deferred = $.Deferred();
    
    // Mock ODS data
    var mockOdsPersons = [
        {
            id: "ODS-P001",
            odsId: "ODS-P001",
            odsType: "person",
            firstName: "Sarah",
            lastName: "Anderson",
            email: "sarah.anderson@lawfirm.com",
            phone: "0412111222",
            dateOfBirth: "1982-04-15",
            address: "100 Legal St",
            suburb: "Sydney",
            postcode: "2000"
        },
        {
            id: "ODS-P002",
            odsId: "ODS-P002",
            odsType: "person",
            firstName: "David",
            lastName: "Chen",
            email: "david.chen@example.com",
            phone: "0423333444",
            address: "200 Court Ave",
            suburb: "Melbourne",
            postcode: "3000"
        },
        {
            id: "ODS-P003",
            odsId: "ODS-P003",
            odsType: "person",
            firstName: "Maria",
            lastName: "Garcia",
            email: "m.garcia@business.com",
            phone: "0434444555"
        },
        {
            id: "ODS-P004",
            odsId: "ODS-P004",
            odsType: "person",
            firstName: "Igor",
            lastName: "Jericevich",
            email: "igor@alterspective.com",
            phone: "0445555666",
            address: "300 Tech Park",
            suburb: "Brisbane",
            postcode: "4000"
        }
    ];
    
    var mockOdsOrganisations = [
        {
            id: "ODS-O001",
            odsId: "ODS-O001",
            odsType: "organisation",
            name: "Legal Solutions Pty Ltd",
            organisationName: "Legal Solutions Pty Ltd",
            tradingName: "Legal Solutions",
            abn: "11223344556",
            email: "info@legalsolutions.com.au",
            phone: "0298887777"
        },
        {
            id: "ODS-O002",
            odsId: "ODS-O002",
            odsType: "organisation",
            name: "Corporate Advisory Services",
            organisationName: "Corporate Advisory Services",
            abn: "22334455667",
            email: "contact@cas.com.au"
        }
    ];
    
    // Simulate async delay
    setTimeout(function() {
        var results = [];
        var searchTerm = (query || "").toLowerCase();
        
        // Determine what to search based on entity types
        var entityTypes = self.options.entityTypes || ["person", "organisation"];
        var searchPersons = entityTypes.indexOf("person") > -1;
        var searchOrgs = entityTypes.indexOf("organisation") > -1;
        
        // Search persons
        if (searchPersons) {
            mockOdsPersons.forEach(function(person) {
                if (!searchTerm || 
                    (person.firstName && person.firstName.toLowerCase().indexOf(searchTerm) > -1) ||
                    (person.lastName && person.lastName.toLowerCase().indexOf(searchTerm) > -1) ||
                    (person.email && person.email.toLowerCase().indexOf(searchTerm) > -1)) {
                    results.push(person);
                }
            });
        }
        
        // Search organisations
        if (searchOrgs) {
            mockOdsOrganisations.forEach(function(org) {
                if (!searchTerm ||
                    (org.name && org.name.toLowerCase().indexOf(searchTerm) > -1) ||
                    (org.tradingName && org.tradingName.toLowerCase().indexOf(searchTerm) > -1) ||
                    (org.abn && org.abn.indexOf(searchTerm) > -1)) {
                    results.push(org);
                }
            });
        }
        
        // Limit results
        var limitedResults = results.slice(0, self.options.maxQuickResults || 10);
        
        deferred.resolve({
            success: true,
            results: limitedResults,
            totalResults: results.length,
            page: page || 0,
            hasMore: results.length > limitedResults.length
        });
    }, 200); // Simulate network delay
    
    return deferred.promise();
};