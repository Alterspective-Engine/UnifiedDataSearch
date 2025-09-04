/**
 * OdsImportService.js
 * 
 * Service responsible for importing PMS (Practice Management System) entities into ShareDo ODS.
 * Handles all the complex ShareDo API requirements including proper endpoint usage,
 * contact detail formatting, date conversions, and foreign key constraints.
 * 
 * @namespace Alt.UnifiedDataSearch.Services
 * @class OdsImportService
 * @version 1.0.0
 * @author Alterspective
 * 
 * CRITICAL ShareDo API Requirements:
 * 1. Endpoints: /api/aspects/ods/people/ (plural) and /api/aspects/ods/organisations/ (plural)
 * 2. Contact Types: "mobile" for persons (NOT "phone"), "phone" for organisations
 * 3. Date Format: PureDate format (YYYYMMDD as integer)
 * 4. Foreign Keys: Do NOT use invalid sourceSystem values
 * 5. Reference Field: Store PMS ID for future matching
 * 
 * Dependencies:
 * - jQuery for AJAX operations
 * - ShareDo $ajax utility (when available)
 * - namespace.js for namespace management
 */

namespace("Alt.UnifiedDataSearch.Services");

/**
 * OdsImportService Constructor
 * Creates a service for importing PMS entities to ShareDo ODS with proper formatting
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
        
        console.log("Importing " + entityType + " from PMS to ODS:", entity);
        
        // Build payload
        var payload;
        try {
            payload = entityType === "person" ? 
                self.buildPersonPayload(entity) : 
                self.buildOrganisationPayload(entity);
        } catch (error) {
            console.error("Failed to build payload:", error);
            deferred.reject("Failed to build payload: " + error.message);
            return deferred.promise();
        }
        
        // Create in ShareDo
        var endpoint = entityType === "person" ? 
            "/api/aspects/ods/people/" :  // Note: plural "people"
            "/api/aspects/ods/organisations/"; // Note: plural "organisations"
        
        console.log("Posting to " + endpoint, payload);
        
        // Use ShareDo's $ajax utility
        if (window.$ajax) {
            $ajax.post(endpoint, payload)
                .done(function(created) {
                    console.log("Entity created in ODS:", created);
                    // Update entity with ODS ID
                    entity.odsId = created.id;
                    entity.source = "sharedo";
                    deferred.resolve(entity);
                })
                .fail(function(error) {
                    console.error("Failed to import entity:", error);
                    var errorMsg = error.responseText || error.statusText || "Unknown error";
                    deferred.reject(errorMsg);
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
                console.log("Entity created in ODS:", created);
                entity.odsId = created.id;
                entity.source = "sharedo";
                deferred.resolve(entity);
            })
            .fail(function(error) {
                console.error("Failed to import entity:", error);
                var errorMsg = error.responseText || error.statusText || "Unknown error";
                deferred.reject(errorMsg);
            });
        }
        
        return deferred.promise();
    };
    
    /**
     * Determine entity type from entity data
     */
    self.determineEntityType = function(entity) {
        // Check explicit type
        if (entity.odsType) return entity.odsType;
        
        // Check data structure
        if (entity.data) {
            if (entity.data.firstName || entity.data.lastName) return "person";
            if (entity.data.organisationName || entity.data.name || entity.data.abn) return "organisation";
        }
        
        // Check direct properties
        if (entity.firstName || entity.lastName) return "person";
        if (entity.organisationName || entity.name || entity.abn) return "organisation";
        
        return "person"; // Default
    };
    
    /**
     * Build person payload for ShareDo API
     */
    self.buildPersonPayload = function(entity) {
        // Extract data (could be in entity.data or direct properties)
        var data = entity.data || entity;
        
        var contactDetails = [];
        
        // Add email
        if (data.email) {
            contactDetails.push({
                contactTypeCategoryId: 2100,
                contactTypeSystemName: "email",
                contactValue: data.email,
                isActive: true,
                isPrimary: true
            });
        }
        
        // Add phone contact - CRITICAL: Must use "mobile" for persons
        // ShareDo API will reject "phone" contactTypeSystemName for persons
        // Common error: "Invalid contact detail type specified for new contact details"
        if (data.phone) {
            contactDetails.push({
                contactTypeCategoryId: 2101,  // Person phone category
                contactTypeSystemName: "mobile", // MUST BE "mobile" for persons, NOT "phone"
                contactValue: data.phone,
                isActive: true,
                isPrimary: !data.email  // Primary only if no email exists
            });
        }
        
        // Build payload
        var payload = {
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
            reference: entity.id || entity.pmsId || data.id,
            externalReference: entity.id || entity.pmsId || data.id,
            firstName: data.firstName,
            surname: data.lastName, // Note: API uses "surname" not "lastName"
            middleNameOrInitial: data.middleName || data.middleNameOrInitial,
            preferredName: data.preferredName || data.firstName
        };
        
        // Add date of birth if present
        if (data.dateOfBirth) {
            payload.dateOfBirth = self.convertDateToShareDoFormat(data.dateOfBirth);
        }
        
        // Add address fields if present
        if (data.address || data.postalAddress) {
            payload.postalAddress = data.address || data.postalAddress;
        }
        if (data.suburb || data.postalSuburb) {
            payload.postalSuburb = data.suburb || data.postalSuburb;
        }
        if (data.state || data.postalState) {
            payload.postalState = data.state || data.postalState;
        }
        if (data.postcode || data.postalPostcode) {
            payload.postalPostcode = data.postcode || data.postalPostcode;
        }
        
        payload.postalCountry = data.country || data.postalCountry || "Australia";
        
        return payload;
    };
    
    /**
     * Build organisation payload for ShareDo API
     */
    self.buildOrganisationPayload = function(entity) {
        // Extract data (could be in entity.data or direct properties)
        var data = entity.data || entity;
        
        var contactDetails = [];
        
        // Add email
        if (data.email) {
            contactDetails.push({
                contactTypeCategoryId: 2100,
                contactTypeSystemName: "email",
                contactValue: data.email,
                isActive: true,
                isPrimary: true
            });
        }
        
        // Add phone (phone for organisations - different from persons)
        if (data.phone) {
            contactDetails.push({
                contactTypeCategoryId: 2102, // Different category for orgs
                contactTypeSystemName: "phone", // "phone" for organisations (not "mobile")
                contactValue: data.phone,
                isActive: true,
                isPrimary: !data.email
            });
        }
        
        // Build payload
        var payload = {
            tags: ["client"],
            aspectData: {
                formBuilder: JSON.stringify({
                    formData: {},
                    formIds: [],
                    formId: null
                }),
                contactDetails: JSON.stringify(contactDetails)
            },
            reference: entity.id || entity.pmsId || data.id,
            externalReference: entity.id || entity.pmsId || data.id,
            organisationName: data.name || data.organisationName,
            tradingName: data.tradingName
        };
        
        // Add ABN/ACN if present
        if (data.abn) {
            payload.abn = data.abn.replace(/\s/g, ""); // Remove spaces from ABN
        }
        if (data.acn) {
            payload.acn = data.acn.replace(/\s/g, ""); // Remove spaces from ACN
        }
        
        // Add address fields if present
        if (data.address || data.postalAddress) {
            payload.postalAddress = data.address || data.postalAddress;
        }
        if (data.suburb || data.postalSuburb) {
            payload.postalSuburb = data.suburb || data.postalSuburb;
        }
        if (data.state || data.postalState) {
            payload.postalState = data.state || data.postalState;
        }
        if (data.postcode || data.postalPostcode) {
            payload.postalPostcode = data.postcode || data.postalPostcode;
        }
        
        payload.postalCountry = data.country || data.postalCountry || "Australia";
        
        return payload;
    };
    
    /**
     * Convert date to ShareDo PureDate format (YYYYMMDD as integer)
     */
    self.convertDateToShareDoFormat = function(dateString) {
        if (!dateString) return null;
        
        // Remove any time component
        dateString = dateString.split('T')[0];
        
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
            if (parts[2].length === 4) {
                // DD/MM/YYYY
                date = {
                    year: parts[2],
                    month: parts[1].padStart(2, '0'),
                    day: parts[0].padStart(2, '0')
                };
            } else if (parts[0].length === 4) {
                // YYYY/MM/DD
                date = {
                    year: parts[0],
                    month: parts[1].padStart(2, '0'),
                    day: parts[2].padStart(2, '0')
                };
            } else {
                console.error("Unknown date format:", dateString);
                return null;
            }
        } else if (dateString.length === 8) {
            // Already in YYYYMMDD format
            return parseInt(dateString, 10);
        } else {
            console.error("Unknown date format:", dateString);
            return null;
        }
        
        // Return as integer
        var pureDateString = date.year + date.month + date.day;
        var pureDate = parseInt(pureDateString, 10);
        
        console.log("Converted date " + dateString + " to PureDate: " + pureDate);
        return pureDate;
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Services.odsImportService = new Alt.UnifiedDataSearch.Services.OdsImportService();