namespace("Alt.UnifiedDataSearch.Services");

Alt.UnifiedDataSearch.Services.ConflictDetectorService = function() {
    var self = this;
    
    // Define conflict severity levels
    self.SEVERITY = {
        HIGH: "high",
        MEDIUM: "medium",
        LOW: "low",
        INFO: "info"
    };
    
    // Define field importance for conflict severity
    self.fieldImportance = {
        // High importance fields
        email: self.SEVERITY.HIGH,
        phone: self.SEVERITY.HIGH,
        dateOfBirth: self.SEVERITY.HIGH,
        abn: self.SEVERITY.HIGH,
        
        // Medium importance fields
        address: self.SEVERITY.MEDIUM,
        suburb: self.SEVERITY.MEDIUM,
        postcode: self.SEVERITY.MEDIUM,
        tradingName: self.SEVERITY.MEDIUM,
        
        // Low importance fields
        middleName: self.SEVERITY.LOW,
        preferredName: self.SEVERITY.LOW,
        title: self.SEVERITY.LOW
    };
    
    // Detect conflicts between two data records
    self.detectConflicts = function(odsData, pmsData) {
        var conflicts = [];
        
        if (!odsData || !pmsData) {
            return conflicts;
        }
        
        // Check all fields for conflicts
        var allFields = self.getAllFields(odsData, pmsData);
        
        allFields.forEach(function(field) {
            var conflict = self.compareField(field, odsData[field], pmsData[field]);
            if (conflict) {
                conflicts.push(conflict);
            }
        });
        
        return conflicts;
    };
    
    // Get all unique fields from both records
    self.getAllFields = function(odsData, pmsData) {
        var fields = {};
        
        // Add ODS fields
        Object.keys(odsData || {}).forEach(function(field) {
            fields[field] = true;
        });
        
        // Add PMS fields
        Object.keys(pmsData || {}).forEach(function(field) {
            fields[field] = true;
        });
        
        // Filter out system fields
        var systemFields = ['id', 'odsId', 'pmsId', 'source', 'created', 'modified', 'odsType'];
        systemFields.forEach(function(field) {
            delete fields[field];
        });
        
        return Object.keys(fields);
    };
    
    // Compare a single field between ODS and PMS
    self.compareField = function(fieldName, odsValue, pmsValue) {
        // Skip if either value is null/undefined/empty
        if (!odsValue || !pmsValue) {
            return null;
        }
        
        // Normalize values for comparison
        var odsNorm = self.normalizeValue(odsValue);
        var pmsNorm = self.normalizeValue(pmsValue);
        
        // If normalized values are the same, no conflict
        if (odsNorm === pmsNorm) {
            return null;
        }
        
        // Create conflict object
        return {
            field: fieldName,
            label: self.getFieldLabel(fieldName),
            odsValue: odsValue,
            pmsValue: pmsValue,
            severity: self.fieldImportance[fieldName] || self.SEVERITY.INFO,
            canAutoResolve: self.canAutoResolve(fieldName, odsValue, pmsValue)
        };
    };
    
    // Normalize value for comparison
    self.normalizeValue = function(value) {
        if (value === null || value === undefined) {
            return "";
        }
        
        // Convert to string and normalize
        var normalized = String(value).toLowerCase().trim();
        
        // Remove common variations
        normalized = normalized
            .replace(/[\s\-\(\)\.]/g, "") // Remove spaces, hyphens, parentheses, dots
            .replace(/^0+/, ""); // Remove leading zeros
        
        return normalized;
    };
    
    // Get human-readable label for field
    self.getFieldLabel = function(fieldName) {
        var labels = {
            firstName: "First Name",
            lastName: "Last Name",
            middleName: "Middle Name",
            preferredName: "Preferred Name",
            dateOfBirth: "Date of Birth",
            email: "Email Address",
            phone: "Phone Number",
            address: "Street Address",
            suburb: "Suburb",
            postcode: "Postcode",
            state: "State",
            country: "Country",
            abn: "ABN",
            acn: "ACN",
            tradingName: "Trading Name",
            organisationName: "Organisation Name"
        };
        
        return labels[fieldName] || fieldName.replace(/([A-Z])/g, ' $1').trim();
    };
    
    // Check if a conflict can be automatically resolved
    self.canAutoResolve = function(fieldName, odsValue, pmsValue) {
        // Phone numbers can be auto-resolved if they're the same after normalization
        if (fieldName === 'phone') {
            var odsPhone = odsValue.replace(/[\s\-\(\)]/g, '');
            var pmsPhone = pmsValue.replace(/[\s\-\(\)]/g, '');
            return odsPhone === pmsPhone;
        }
        
        // Postcodes can be auto-resolved if one has leading zeros
        if (fieldName === 'postcode') {
            return odsValue.replace(/^0+/, '') === pmsValue.replace(/^0+/, '');
        }
        
        // Email addresses - check if they're the same ignoring case
        if (fieldName === 'email') {
            return odsValue.toLowerCase() === pmsValue.toLowerCase();
        }
        
        return false;
    };
    
    // Analyze conflicts and provide resolution recommendations
    self.analyzeConflicts = function(conflicts) {
        if (!conflicts || conflicts.length === 0) {
            return {
                hasConflicts: false,
                severity: null,
                autoResolvable: false,
                requiresReview: false
            };
        }
        
        var analysis = {
            hasConflicts: true,
            totalConflicts: conflicts.length,
            highSeverity: 0,
            mediumSeverity: 0,
            lowSeverity: 0,
            autoResolvable: 0,
            requiresReview: false
        };
        
        conflicts.forEach(function(conflict) {
            // Count by severity
            switch(conflict.severity) {
                case self.SEVERITY.HIGH:
                    analysis.highSeverity++;
                    break;
                case self.SEVERITY.MEDIUM:
                    analysis.mediumSeverity++;
                    break;
                case self.SEVERITY.LOW:
                    analysis.lowSeverity++;
                    break;
            }
            
            // Count auto-resolvable
            if (conflict.canAutoResolve) {
                analysis.autoResolvable++;
            }
        });
        
        // Determine overall severity
        if (analysis.highSeverity > 0) {
            analysis.severity = self.SEVERITY.HIGH;
            analysis.requiresReview = true;
        } else if (analysis.mediumSeverity > 0) {
            analysis.severity = self.SEVERITY.MEDIUM;
            analysis.requiresReview = true;
        } else if (analysis.lowSeverity > 0) {
            analysis.severity = self.SEVERITY.LOW;
        } else {
            analysis.severity = self.SEVERITY.INFO;
        }
        
        // Check if all conflicts are auto-resolvable
        analysis.allAutoResolvable = (analysis.autoResolvable === analysis.totalConflicts);
        
        return analysis;
    };
    
    // Generate conflict resolution options
    self.getResolutionOptions = function(conflict) {
        var options = [];
        
        // Always offer to keep ODS value
        options.push({
            action: "keepOds",
            label: "Keep ShareDo value",
            value: conflict.odsValue,
            description: "Use the value from ShareDo ODS"
        });
        
        // Always offer to use PMS value
        options.push({
            action: "usePms",
            label: "Use PMS value",
            value: conflict.pmsValue,
            description: "Update ShareDo with the PMS value"
        });
        
        // If values are similar, offer merge option
        if (self.canMergeValues(conflict.field, conflict.odsValue, conflict.pmsValue)) {
            var mergedValue = self.mergeValues(conflict.field, conflict.odsValue, conflict.pmsValue);
            options.push({
                action: "merge",
                label: "Merge values",
                value: mergedValue,
                description: "Combine both values"
            });
        }
        
        // Offer manual edit option for high severity conflicts
        if (conflict.severity === self.SEVERITY.HIGH) {
            options.push({
                action: "manual",
                label: "Enter manually",
                value: null,
                description: "Specify a custom value"
            });
        }
        
        return options;
    };
    
    // Check if values can be merged
    self.canMergeValues = function(fieldName, odsValue, pmsValue) {
        // Addresses can potentially be merged
        if (fieldName === 'address') {
            return true;
        }
        
        // Names with one being subset of another
        if (fieldName === 'firstName' || fieldName === 'lastName') {
            return odsValue.indexOf(pmsValue) > -1 || pmsValue.indexOf(odsValue) > -1;
        }
        
        return false;
    };
    
    // Merge two values
    self.mergeValues = function(fieldName, odsValue, pmsValue) {
        // For addresses, use the longer/more complete one
        if (fieldName === 'address') {
            return odsValue.length > pmsValue.length ? odsValue : pmsValue;
        }
        
        // For names, use the longer version
        if (fieldName === 'firstName' || fieldName === 'lastName') {
            return odsValue.length > pmsValue.length ? odsValue : pmsValue;
        }
        
        // Default to ODS value
        return odsValue;
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.conflictDetectorService = new Alt.UnifiedDataSearch.Services.ConflictDetectorService();