/**
 * ResultMergerService.js
 * 
 * Service responsible for merging search results from ODS (ShareDo) and PMS (Practice Management System).
 * Handles duplicate detection, conflict identification, and reference field matching.
 * 
 * @namespace Alt.UnifiedDataSearch.Services
 * @class ResultMergerService
 * @version 1.0.0
 * @author Alterspective
 * 
 * Key Features:
 * - Merges results from multiple data sources
 * - Detects matches using both data comparison and reference field lookup
 * - Identifies data conflicts between matched records
 * - Enriches results with display formatting
 * 
 * Dependencies:
 * - jQuery for utilities
 * - namespace.js for namespace management
 */

namespace("Alt.UnifiedDataSearch.Services");

/**
 * ResultMergerService Constructor
 * Creates a service instance for merging ODS and PMS search results
 */
Alt.UnifiedDataSearch.Services.ResultMergerService = function() {
    var self = this;
    
    /**
     * Merges search results from ODS and PMS systems
     * 
     * @param {Object} odsResults - Results from ShareDo ODS search
     * @param {Object} odsResults.results - Array of ODS entities
     * @param {Object} pmsResults - Results from PMS search
     * @param {Object} pmsResults.results - Array of PMS entities
     * @param {Object} labels - Optional custom labels for sources
     * @param {String} labels.sharedo - Label for ShareDo source
     * @param {String} labels.pms - Label for PMS source
     * @param {String} labels.matched - Label for matched records
     * @returns {Array} Merged array of results with conflict detection
     */
    self.mergeResults = function(odsResults, pmsResults, labels) {
        var merged = [];
        var matchMap = {};      // Maps entities by generated match keys for data-based matching
        var referenceMap = {};   // Maps ODS records by their Reference field for PMS ID lookup
        
        // STEP 1: Process ODS results first to establish baseline
        if (odsResults && (odsResults.results || odsResults.length)) {
            var odsData = odsResults.results || odsResults;
            
            // Ensure it's an array (handle single result edge case)
            if (!Array.isArray(odsData)) {
                odsData = [odsData];
            }
            
            // Process each ODS entity
            odsData.forEach(function(item) {
                var key = self.generateMatchKey(item);
                var result = {
                    id: "merged-" + (merged.length + 1),
                    source: "sharedo",
                    sourceLabel: labels && labels.sharedo || "ShareDo",
                    odsId: item.id || item.odsId,
                    displayName: self.getDisplayName(item),
                    data: item,
                    matchKey: key,
                    icon: self.getIcon(item),
                    hasConflicts: false,
                    conflicts: [],
                    reference: item.reference || item.Reference || null
                };
                matchMap[key] = result;
                
                // IMPORTANT: Track by Reference field for PMS ID matching
                // This allows us to find ODS records that were previously imported from PMS
                if (result.reference) {
                    referenceMap[result.reference] = result;
                }
                
                merged.push(result);
            });
        }
        
        // STEP 2: Process PMS results and identify matches
        if (pmsResults && pmsResults.results) {
            pmsResults.results.forEach(function(item) {
                var key = self.generateMatchKey(item);
                var matchedByKey = matchMap[key];
                var matchedByReference = referenceMap[item.id]; // Check if PMS ID is in an ODS Reference field
                
                // Determine which match to use (Reference match takes priority)
                var matchedRecord = matchedByReference || matchedByKey;
                
                if (matchedRecord) {
                    // Found a match - update existing record
                    matchedRecord.source = "matched";
                    matchedRecord.sourceLabel = labels && labels.matched || "Matched";
                    matchedRecord.pmsId = item.id;
                    matchedRecord.pmsData = item;
                    
                    // Check for conflicts
                    var conflicts = self.getConflictDetails(matchedRecord.data, item);
                    matchedRecord.hasConflicts = conflicts.length > 0;
                    matchedRecord.conflicts = conflicts;
                    
                    if (conflicts.length > 0) {
                        console.log("%c⚡ Data conflicts detected:", "color: #f59e0b", conflicts);
                    }
                    
                    // If matched by reference but not by key, add a note
                    if (matchedByReference && !matchedByKey) {
                        matchedRecord.matchType = "reference";
                        console.log("%c🔗 Matched by Reference field:", "color: #059212; font-weight: bold", 
                                   "ODS:", matchedRecord.odsId, "→ PMS:", item.id);
                    } else if (matchedByReference && matchedByKey && matchedByReference !== matchedByKey) {
                        // Reference and key match point to different records - log warning
                        console.warn("%c⚠️ Match Conflict:", "color: #f59e0b; font-weight: bold", 
                                    "PMS record", item.id, "matches different ODS records by key and reference");
                    } else if (matchedByKey) {
                        console.log("%c🔍 Matched by data:", "color: #3730a3", 
                                   "Key:", key, "| PMS:", item.id);
                    }
                } else {
                    // PMS only record
                    merged.push({
                        id: "merged-" + (merged.length + 1),
                        source: "pms",
                        sourceLabel: labels && labels.pms || "PMS",
                        pmsId: item.id,
                        displayName: self.getDisplayName(item),
                        data: item,
                        pmsData: item,
                        matchKey: key,
                        icon: self.getIcon(item),
                        hasConflicts: false,
                        conflicts: []
                    });
                }
            });
        }
        
        return merged;
    };
    
    /**
     * Generates a unique key for entity matching
     * Uses different strategies for persons vs organisations
     * 
     * @param {Object} item - Entity to generate key for
     * @returns {String} Unique match key in format "type:field1:field2:..."
     */
    self.generateMatchKey = function(item) {
        // Determine entity type and generate appropriate key
        if (item.odsEntityType === "person" || item.odsType === "person" || 
            item.firstName || item.lastName || item.surname) {
            // Person matching - ShareDo uses 'surname', mock PMS uses 'lastName'
            var first = (item.firstName || "").toLowerCase().trim();
            var last = (item.surname || item.lastName || "").toLowerCase().trim();
            var dob = item.dateOfBirth || "";
            
            // If we have DOB, use it for precise matching
            if (dob) {
                return "person:" + first + ":" + last + ":" + dob;
            }
            
            // Otherwise use name and email
            var email = (item.email || "").toLowerCase().trim();
            return "person:" + first + ":" + last + ":" + email;
        } else {
            // Organisation matching
            var name = (item.name || item.organisationName || item.registeredName || "").toLowerCase().trim();
            var abn = (item.abn || item.companyNumber || "").replace(/\s/g, "");
            
            // If we have ABN/company number, use it for precise matching
            if (abn) {
                return "org:abn:" + abn;
            }
            
            // Otherwise use name
            return "org:name:" + name;
        }
    };
    
    self.getDisplayName = function(item) {
        // For persons, check both lastName and surname (ShareDo uses 'surname')
        if (item.firstName || item.lastName || item.surname) {
            var parts = [];
            if (item.firstName) parts.push(item.firstName);
            // ShareDo uses 'surname' field, PMS might use 'lastName'
            if (item.surname || item.lastName) parts.push(item.surname || item.lastName);
            return parts.join(" ") || "Unknown Person";
        }
        // For organisations, check multiple name fields
        return item.name || item.organisationName || item.registeredName || item.tradingName || "Unknown Organisation";
    };
    
    self.getIcon = function(item) {
        // Check odsEntityType (ShareDo) or odsType, plus name fields
        if (item.odsEntityType === "person" || item.odsType === "person" || 
            item.firstName || item.lastName || item.surname) {
            return "fa-user";
        }
        return "fa-building";
    };
    
    self.getConflictDetails = function(odsData, pmsData) {
        var conflicts = [];
        var conflictFields = [
            { field: 'email', label: 'Email' },
            { field: 'phone', label: 'Phone' },
            { field: 'address', label: 'Address' },
            { field: 'postcode', label: 'Postcode' },
            { field: 'suburb', label: 'Suburb' },
            { field: 'dateOfBirth', label: 'Date of Birth' },
            { field: 'abn', label: 'ABN' },
            { field: 'tradingName', label: 'Trading Name' }
        ];
        
        conflictFields.forEach(function(fieldDef) {
            var field = fieldDef.field;
            var odsValue = odsData[field];
            var pmsValue = pmsData[field];
            
            // Both values must exist and be different to be a conflict
            if (odsValue && pmsValue) {
                // Normalize for comparison
                var odsNorm = String(odsValue).toLowerCase().trim();
                var pmsNorm = String(pmsValue).toLowerCase().trim();
                
                if (odsNorm !== pmsNorm) {
                    conflicts.push({
                        field: field,
                        label: fieldDef.label,
                        odsValue: odsValue,
                        pmsValue: pmsValue
                    });
                }
            }
        });
        
        return conflicts;
    };
    
    // Helper method to enrich results with additional display data
    self.enrichResults = function(results) {
        return results.map(function(result) {
            var data = result.data || result.pmsData || {};
            
            // Add formatted display fields
            result.primaryEmail = data.email || "";
            result.primaryPhone = data.phone || "";
            
            // Format address
            var addressParts = [];
            if (data.address) addressParts.push(data.address);
            if (data.suburb) addressParts.push(data.suburb);
            if (data.postcode) addressParts.push(data.postcode);
            result.formattedAddress = addressParts.join(", ");
            
            // Add source class for styling
            switch(result.source) {
                case "sharedo":
                    result.sourceClass = "badge-primary";
                    break;
                case "pms":
                    result.sourceClass = "badge-info";
                    break;
                case "matched":
                    result.sourceClass = "badge-success";
                    break;
                default:
                    result.sourceClass = "badge-default";
            }
            
            return result;
        });
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.resultMergerService = new Alt.UnifiedDataSearch.Services.ResultMergerService();