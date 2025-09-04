/**
 * ValidationHelper.js
 * 
 * Business rule validation and data integrity checks for UnifiedDataSearch module.
 * Ensures entities meet ShareDo requirements before processing.
 * 
 * @namespace Alt.UnifiedDataSearch.Helpers
 * @class ValidationHelper
 * @version 1.0.0
 * 
 * Validates:
 * - Required fields by entity type
 * - Contact detail formats
 * - Date formats
 * - ABN/ACN formats
 * - Data integrity between systems
 */

namespace("Alt.UnifiedDataSearch.Helpers");

/**
 * ValidationHelper Constructor
 */
Alt.UnifiedDataSearch.Helpers.ValidationHelper = function() {
    var self = this;
    
    /**
     * Validate a person entity
     * @param {Object} entity - Person entity to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    self.validatePerson = function(entity) {
        var errors = [];
        
        // Required fields
        if (!entity.firstName || entity.firstName.trim() === "") {
            errors.push({
                field: "firstName",
                message: "First name is required for persons"
            });
        }
        
        if (!entity.surname && !entity.lastName) {
            errors.push({
                field: "surname",
                message: "Surname is required for persons"
            });
        }
        
        // Validate email format if provided
        if (entity.email && !self.isValidEmail(entity.email)) {
            errors.push({
                field: "email",
                message: "Invalid email format"
            });
        }
        
        // Validate phone format if provided
        if (entity.phone && !self.isValidPhone(entity.phone)) {
            errors.push({
                field: "phone",
                message: "Invalid phone format"
            });
        }
        
        // Validate date of birth if provided
        if (entity.dateOfBirth && !self.isValidDate(entity.dateOfBirth)) {
            errors.push({
                field: "dateOfBirth",
                message: "Invalid date format (expected YYYY-MM-DD or YYYYMMDD)"
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    
    /**
     * Validate an organisation entity
     * @param {Object} entity - Organisation entity to validate
     * @returns {Object} Validation result with isValid and errors array
     */
    self.validateOrganisation = function(entity) {
        var errors = [];
        
        // Required fields
        if (!entity.name && !entity.organisationName) {
            errors.push({
                field: "name",
                message: "Organisation name is required"
            });
        }
        
        // Validate ABN if provided
        if (entity.abn && !self.isValidABN(entity.abn)) {
            errors.push({
                field: "abn",
                message: "Invalid ABN format (must be 11 digits)"
            });
        }
        
        // Validate ACN if provided
        if (entity.acn && !self.isValidACN(entity.acn)) {
            errors.push({
                field: "acn",
                message: "Invalid ACN format (must be 9 digits)"
            });
        }
        
        // Validate email format if provided
        if (entity.email && !self.isValidEmail(entity.email)) {
            errors.push({
                field: "email",
                message: "Invalid email format"
            });
        }
        
        // Validate phone format if provided
        if (entity.phone && !self.isValidPhone(entity.phone)) {
            errors.push({
                field: "phone",
                message: "Invalid phone format"
            });
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    
    /**
     * Validate an entity based on its type
     * @param {Object} entity - Entity to validate
     * @returns {Object} Validation result
     */
    self.validateEntity = function(entity) {
        if (!entity) {
            return {
                isValid: false,
                errors: [{ field: "entity", message: "Entity is null or undefined" }]
            };
        }
        
        var entityType = entity.odsType || entity.odsEntityType || 
                        (entity.firstName || entity.lastName ? "person" : "organisation");
        
        if (entityType === "person") {
            return self.validatePerson(entity);
        } else if (entityType === "organisation") {
            return self.validateOrganisation(entity);
        } else {
            return {
                isValid: false,
                errors: [{ field: "odsType", message: "Unknown entity type: " + entityType }]
            };
        }
    };
    
    /**
     * Validate email format
     * @param {String} email - Email address to validate
     * @returns {Boolean} True if valid
     */
    self.isValidEmail = function(email) {
        if (!email) return false;
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };
    
    /**
     * Validate Australian phone number format
     * @param {String} phone - Phone number to validate
     * @returns {Boolean} True if valid
     */
    self.isValidPhone = function(phone) {
        if (!phone) return false;
        // Remove spaces, dashes, parentheses
        var cleaned = phone.replace(/[\s\-\(\)]/g, '');
        
        // Check for Australian mobile (04xx xxx xxx) or landline (0x xxxx xxxx)
        var mobileRegex = /^(\+?61|0)4\d{8}$/;
        var landlineRegex = /^(\+?61|0)[2-9]\d{8}$/;
        
        return mobileRegex.test(cleaned) || landlineRegex.test(cleaned);
    };
    
    /**
     * Validate date format and convert to ShareDo PureDate
     * @param {String|Number} date - Date to validate
     * @returns {Boolean} True if valid
     */
    self.isValidDate = function(date) {
        if (!date) return false;
        
        // Already in PureDate format (YYYYMMDD as number)
        if (typeof date === 'number' && date >= 10000101 && date <= 99991231) {
            return true;
        }
        
        // String format YYYY-MM-DD
        if (typeof date === 'string') {
            var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(date)) {
                var parts = date.split('-');
                var year = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10);
                var day = parseInt(parts[2], 10);
                
                // Basic date validation
                if (year < 1900 || year > 2100) return false;
                if (month < 1 || month > 12) return false;
                if (day < 1 || day > 31) return false;
                
                return true;
            }
        }
        
        return false;
    };
    
    /**
     * Validate Australian Business Number (ABN)
     * @param {String} abn - ABN to validate
     * @returns {Boolean} True if valid
     */
    self.isValidABN = function(abn) {
        if (!abn) return false;
        
        // Remove spaces and validate length
        var cleaned = abn.replace(/\s/g, '');
        if (!/^\d{11}$/.test(cleaned)) {
            return false;
        }
        
        // ABN checksum validation
        var weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
        var sum = 0;
        
        for (var i = 0; i < 11; i++) {
            var digit = parseInt(cleaned[i], 10);
            if (i === 0) {
                digit = digit - 1; // Subtract 1 from first digit
            }
            sum += digit * weights[i];
        }
        
        return sum % 89 === 0;
    };
    
    /**
     * Validate Australian Company Number (ACN)
     * @param {String} acn - ACN to validate
     * @returns {Boolean} True if valid
     */
    self.isValidACN = function(acn) {
        if (!acn) return false;
        
        // Remove spaces and validate length
        var cleaned = acn.replace(/\s/g, '');
        if (!/^\d{9}$/.test(cleaned)) {
            return false;
        }
        
        // ACN checksum validation
        var weights = [8, 7, 6, 5, 4, 3, 2, 1];
        var sum = 0;
        
        for (var i = 0; i < 8; i++) {
            sum += parseInt(cleaned[i], 10) * weights[i];
        }
        
        var remainder = sum % 10;
        var checkDigit = (10 - remainder) % 10;
        
        return checkDigit === parseInt(cleaned[8], 10);
    };
    
    /**
     * Validate contact details structure
     * @param {Array} contactDetails - Array of contact detail objects
     * @param {String} entityType - "person" or "organisation"
     * @returns {Object} Validation result
     */
    self.validateContactDetails = function(contactDetails, entityType) {
        var errors = [];
        
        if (!Array.isArray(contactDetails)) {
            return {
                isValid: false,
                errors: [{ field: "contactDetails", message: "Contact details must be an array" }]
            };
        }
        
        contactDetails.forEach(function(contact, index) {
            // Validate required fields
            if (!contact.contactTypeCategoryId) {
                errors.push({
                    field: "contactDetails[" + index + "].contactTypeCategoryId",
                    message: "Contact type category ID is required"
                });
            }
            
            if (!contact.contactTypeSystemName) {
                errors.push({
                    field: "contactDetails[" + index + "].contactTypeSystemName",
                    message: "Contact type system name is required"
                });
            }
            
            if (!contact.contactValue) {
                errors.push({
                    field: "contactDetails[" + index + "].contactValue",
                    message: "Contact value is required"
                });
            }
            
            // Validate contact type for entity type
            if (entityType === "person" && contact.contactTypeSystemName === "phone") {
                errors.push({
                    field: "contactDetails[" + index + "].contactTypeSystemName",
                    message: "Persons should use 'mobile' or 'direct-line', not 'phone'"
                });
            }
            
            if (entityType === "organisation" && 
                (contact.contactTypeSystemName === "mobile" || contact.contactTypeSystemName === "direct-line")) {
                errors.push({
                    field: "contactDetails[" + index + "].contactTypeSystemName",
                    message: "Organisations should use 'phone', not 'mobile' or 'direct-line'"
                });
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    };
    
    /**
     * Convert date to ShareDo PureDate format
     * @param {String} dateString - Date string in YYYY-MM-DD format
     * @returns {Number} PureDate format (YYYYMMDD as integer)
     */
    self.convertToPureDate = function(dateString) {
        if (!dateString) return null;
        
        // Already a number
        if (typeof dateString === 'number') {
            return dateString;
        }
        
        // Parse YYYY-MM-DD format
        var parts = dateString.split('-');
        if (parts.length !== 3) return null;
        
        var year = parts[0];
        var month = parts[1].padStart(2, '0');
        var day = parts[2].padStart(2, '0');
        
        return parseInt(year + month + day, 10);
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Helpers.validationHelper = new Alt.UnifiedDataSearch.Helpers.ValidationHelper();