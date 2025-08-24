namespace("Alt.UnifiedDataSearch.Widgets");

/**
 * UnifiedOdsEntityPickerDesigner Widget
 * Configuration designer for the UnifiedOdsEntityPicker widget
 * 
 * @param {HTMLElement} element - The Html DOM element to which this widget will bind
 * @param {Object} configuration - The configuration passed in from the designer/config
 * @param {Object} baseModel - The base widget model (contains unique id etc)
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPickerDesigner = function(element, configuration, baseModel) {
    var self = this;
    
    self.element = element;
    self.baseModel = baseModel;
    
    // Initialize configuration with defaults
    var defaults = {
        label: "Select Entity",
        placeholder: "Click to search and select...",
        required: false,
        allowMultiple: false,
        allowClear: true,
        entityTypes: ["person", "organisation"],
        searchMode: "unified",
        useMockPms: true,
        useMockOds: false,
        mode: "select",
        showIcon: true,
        showEmail: true,
        showPhone: false,
        showSource: true,
        showAddress: false,
        pmsTimeout: 5000,
        displayMode: "simple",
        useShareDoComponent: false,
        fieldName: null,
        returnField: "odsId"
    };
    
    // Merge with existing configuration
    self.config = $.extend(true, {}, defaults, configuration);
    
    // Create observables for all configuration options
    self.label = ko.observable(self.config.label);
    self.placeholder = ko.observable(self.config.placeholder);
    self.required = ko.observable(self.config.required);
    self.allowMultiple = ko.observable(self.config.allowMultiple);
    self.allowClear = ko.observable(self.config.allowClear);
    
    // Entity types
    self.allowPerson = ko.observable(self.config.entityTypes.indexOf("person") > -1);
    self.allowOrganisation = ko.observable(self.config.entityTypes.indexOf("organisation") > -1);
    
    // Search configuration
    self.searchMode = ko.observable(self.config.searchMode);
    self.useMockPms = ko.observable(self.config.useMockPms);
    self.useMockOds = ko.observable(self.config.useMockOds);
    self.pmsTimeout = ko.observable(self.config.pmsTimeout);
    
    // Mode
    self.mode = ko.observable(self.config.mode);
    
    // Display options
    self.showIcon = ko.observable(self.config.showIcon);
    self.showEmail = ko.observable(self.config.showEmail);
    self.showPhone = ko.observable(self.config.showPhone);
    self.showSource = ko.observable(self.config.showSource);
    self.showAddress = ko.observable(self.config.showAddress);
    
    // Advanced options
    self.displayMode = ko.observable(self.config.displayMode);
    self.useShareDoComponent = ko.observable(self.config.useShareDoComponent);
    self.fieldName = ko.observable(self.config.fieldName);
    self.returnField = ko.observable(self.config.returnField);
    
    // ShareDo component specific
    self.roleSystemName = ko.observable(self.config.roleSystemName || "participant");
    self.roleLabel = ko.observable(self.config.roleLabel);
    self.viewMode = ko.observable(self.config.viewMode || "card");
    
    // Work item context
    self.sharedoId = ko.observable(self.config.sharedoId);
    self.sharedoTypeSystemName = ko.observable(self.config.sharedoTypeSystemName);
    self.forRoleSystemName = ko.observable(self.config.forRoleSystemName);
    
    // Computed for entity types array
    self.entityTypes = ko.computed(function() {
        var types = [];
        if (self.allowPerson()) types.push("person");
        if (self.allowOrganisation()) types.push("organisation");
        return types;
    });
    
    // Watch for ShareDo component mode changes
    self.useShareDoComponent.subscribe(function(useComponent) {
        if (useComponent) {
            self.displayMode("component");
        } else {
            self.displayMode("simple");
        }
    });
    
    // Available options for dropdowns
    self.searchModeOptions = [
        { value: "unified", text: "Unified (ODS + PMS)" },
        { value: "odsOnly", text: "ODS Only" },
        { value: "pmsOnly", text: "PMS Only" }
    ];
    
    self.modeOptions = [
        { value: "select", text: "Select Only (Return entity)" },
        { value: "auto", text: "Auto Import (Create ODS if from PMS)" }
    ];
    
    self.returnFieldOptions = [
        { value: "odsId", text: "ODS ID" },
        { value: "entity", text: "Full Entity Object" },
        { value: "custom", text: "Custom Field" }
    ];
    
    self.viewModeOptions = [
        { value: "card", text: "Card View" },
        { value: "list", text: "List View" }
    ];
    
    // Validation
    self.isValid = ko.computed(function() {
        return self.label() && self.label().trim().length > 0 &&
               self.entityTypes().length > 0;
    });
    
    // Help text computeds
    self.modeHelpText = ko.computed(function() {
        if (self.mode() === "auto") {
            return "PMS entities will be automatically imported to ShareDo ODS when selected.";
        } else {
            return "Selected entity will be returned without creating ODS records.";
        }
    });
    
    self.searchModeHelpText = ko.computed(function() {
        switch(self.searchMode()) {
            case "unified":
                return "Search both ShareDo ODS and PMS systems simultaneously.";
            case "odsOnly":
                return "Search only in ShareDo ODS database.";
            case "pmsOnly":
                return "Search only in Practice Management System.";
            default:
                return "";
        }
    });
};

/**
 * Get the configuration object
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPickerDesigner.prototype.getConfiguration = function() {
    var self = this;
    
    var config = {
        label: self.label(),
        placeholder: self.placeholder(),
        required: self.required(),
        allowMultiple: self.allowMultiple(),
        allowClear: self.allowClear(),
        entityTypes: self.entityTypes(),
        searchMode: self.searchMode(),
        useMockPms: self.useMockPms(),
        useMockOds: self.useMockOds(),
        pmsTimeout: parseInt(self.pmsTimeout()) || 5000,
        mode: self.mode(),
        showIcon: self.showIcon(),
        showEmail: self.showEmail(),
        showPhone: self.showPhone(),
        showSource: self.showSource(),
        showAddress: self.showAddress(),
        displayMode: self.displayMode(),
        useShareDoComponent: self.useShareDoComponent(),
        fieldName: self.fieldName(),
        returnField: self.returnField()
    };
    
    // Add ShareDo component specific config if enabled
    if (self.useShareDoComponent()) {
        config.roleSystemName = self.roleSystemName();
        config.roleLabel = self.roleLabel();
        config.viewMode = self.viewMode();
    }
    
    // Add work item context if provided
    if (self.sharedoId()) {
        config.sharedoId = self.sharedoId();
    }
    if (self.sharedoTypeSystemName()) {
        config.sharedoTypeSystemName = self.sharedoTypeSystemName();
    }
    if (self.forRoleSystemName()) {
        config.forRoleSystemName = self.forRoleSystemName();
    }
    
    return config;
};

/**
 * Validate the configuration
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPickerDesigner.prototype.validate = function() {
    var self = this;
    return self.isValid();
};

/**
 * Called when the designer is being destroyed
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPickerDesigner.prototype.onDestroy = function() {
    var self = this;
    
    // Clean up computeds
    if (self.entityTypes) self.entityTypes.dispose();
    if (self.isValid) self.isValid.dispose();
    if (self.modeHelpText) self.modeHelpText.dispose();
    if (self.searchModeHelpText) self.searchModeHelpText.dispose();
};

/**
 * Called after initial creation and binding
 */
Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPickerDesigner.prototype.loadAndBind = function() {
    var self = this;
    // Any initialization after binding
};