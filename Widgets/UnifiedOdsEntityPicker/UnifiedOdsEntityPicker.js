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
        useMockPms: true,
        useMockOds: false,  // Changed to false - use real ODS when available
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
        allowInlineSearch: false,
        inlineSearchDelay: 500,
        minSearchLength: 2,
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
        allowInlineSearch: false // Disable inline search (we use our blade)
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
    
    // Inline search observables
    self.inlineSearchQuery = ko.observable("");
    self.quickSearchResults = ko.observableArray([]);
    self.showQuickResults = ko.observable(false);
    self.isPerformingQuickSearch = ko.observable(false);
    self.quickSearchTimeout = null;
    
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
        allowInlineSearch: false,
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
        useMockPms: self.options.useMockPms,
        useMockOds: self.options.useMockOds,
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
        return true;
    }
    
    // Debounce the search
    self.quickSearchTimeout = setTimeout(function() {
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
    
    if (!query || query.length < self.options.minSearchLength) {
        return;
    }
    
    self.isPerformingQuickSearch(true);
    
    // Build search parameters
    var searchPromises = [];
    
    // Search ODS if enabled
    if (self.options.searchMode === "unified" || self.options.searchMode === "odsOnly") {
        if (!self.options.useMockOds && window.$ajax) {
            var odsPromise = $ajax.get("/api/ods/search", {
                q: query,
                page: 0,
                pageSize: self.options.maxQuickResults,
                entityTypes: self.options.entityTypes
            });
            searchPromises.push(odsPromise);
        }
    }
    
    // Search PMS if enabled
    if (self.options.searchMode === "unified" || self.options.searchMode === "pmsOnly") {
        if (self.options.useMockPms && Alt.UnifiedDataSearch.Services.mockPmsService) {
            var type = self.options.entityTypes.indexOf("person") > -1 ? "persons" : "organisations";
            var pmsPromise = Alt.UnifiedDataSearch.Services.mockPmsService.search(type, query, 0);
            searchPromises.push(pmsPromise);
        }
    }
    
    // Wait for all searches to complete
    $.when.apply($, searchPromises).done(function() {
        var allResults = [];
        
        // Process each result set
        for (var i = 0; i < arguments.length; i++) {
            var response = arguments[i];
            if (response && response[0]) {
                var data = response[0];
                if (data.results) {
                    allResults = allResults.concat(data.results);
                } else if (Array.isArray(data)) {
                    allResults = allResults.concat(data);
                }
            }
        }
        
        // Limit results
        allResults = allResults.slice(0, self.options.maxQuickResults);
        
        // Process and display results
        self.quickSearchResults(allResults);
        self.showQuickResults(allResults.length > 0);
        self.isPerformingQuickSearch(false);
    }).fail(function() {
        self.isPerformingQuickSearch(false);
        self.showQuickResults(false);
    });
};

/**
 * Select a quick search result
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.selectQuickResult = function(entity) {
    var self = this;
    
    // Clear inline search
    self.inlineSearchQuery("");
    self.showQuickResults(false);
    self.quickSearchResults([]);
    
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
};

/**
 * Format address for display
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker.prototype.formatAddress = function(entity) {
    if (!entity) return "";
    
    var parts = [];
    if (entity.address || entity.postalAddress) {
        parts.push(entity.address || entity.postalAddress);
    }
    if (entity.suburb || entity.postalSuburb) {
        parts.push(entity.suburb || entity.postalSuburb);
    }
    if (entity.state || entity.postalState) {
        parts.push(entity.state || entity.postalState);
    }
    if (entity.postcode || entity.postalPostcode) {
        parts.push(entity.postcode || entity.postalPostcode);
    }
    
    return parts.join(", ");
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
        useMockPms: self.options.useMockPms,
        useMockOds: self.options.useMockOds,
        allowMultiple: self.options.allowMultiple,
        currentSelection: self.selectedEntities(),
        mode: self.options.mode
    };
    
    // Open the blade using ShareDo's UI stack
    if (window.$ui && window.$ui.stacks && window.$ui.stacks.openPanel) {
        $ui.stacks.openPanel(self.options.bladeName, bladeConfig, {
            width: self.options.bladeWidth,
            closing: function(result) {
                if (result && result.selectedEntities) {
                    // Update our selection with the results from the blade
                    self.selectedEntities(result.selectedEntities);
                }
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