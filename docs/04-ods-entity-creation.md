# ODS Entity Creation Guide

## Creating a Person Entity

### Complete Working Example
```javascript
// Helper function for date conversion
function convertDateToShareDoFormat(dateString) {
    // Input: "1980-01-15"
    var parts = dateString.split('-');
    var year = parts[0];
    var month = parts[1].padStart(2, '0');
    var day = parts[2].padStart(2, '0');
    
    // Output: 19800115 (as integer)
    return parseInt(year + month + day, 10);
}

// Build contact details array
var contactDetails = [];

// Add email (required format for persons)
if (entity.data.email) {
    contactDetails.push({
        contactTypeCategoryId: 2100,
        contactTypeSystemName: "email",
        contactValue: entity.data.email,
        isActive: true,
        isPrimary: true
    });
}

// Add phone (MUST use "mobile" for persons, not "phone")
if (entity.data.phone) {
    contactDetails.push({
        contactTypeCategoryId: 2101,
        contactTypeSystemName: "mobile",  // Critical: use "mobile" not "phone"
        contactValue: entity.data.phone,
        isActive: true,
        isPrimary: !entity.data.email
    });
}

// Create person payload
var personPayload = {
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
        contactDetails: JSON.stringify(contactDetails),  // Must be stringified
        contactPreferences: JSON.stringify({
            contactHoursFrom: null,
            contactHoursTo: null
        })
    },
    // DO NOT include sourceSystem: "PMS" - will cause foreign key error
    reference: entity.pmsId || entity.data.id,
    externalReference: entity.pmsId || entity.data.id,
    
    // Name fields
    firstName: entity.data.firstName,
    surname: entity.data.lastName,  // Note: API uses "surname" not "lastName"
    middleNameOrInitial: entity.data.middleName,
    preferredName: entity.data.preferredName || entity.data.firstName,
    
    // Date must be in PureDate format (YYYYMMDD as integer)
    dateOfBirth: convertDateToShareDoFormat(entity.data.dateOfBirth),
    
    // Address fields
    postalAddress: entity.data.address,
    postalSuburb: entity.data.suburb,
    postalState: entity.data.state,
    postalPostcode: entity.data.postcode,
    postalCountry: entity.data.country || "Australia"
};

// Make the API call
$ajax.post("/api/aspects/ods/people/", personPayload)
    .done(function(created) {
        console.log("Person created with ID:", created.id);
    })
    .fail(function(error) {
        console.error("Failed to create person:", error);
    });
```

## Creating an Organisation Entity

### Key Differences
- Use `/api/aspects/ods/organisations/` endpoint
- Phone contact uses `contactTypeCategoryId: 2102` and `contactTypeSystemName: "phone"`
- No dateOfBirth field
- Use `name` field instead of firstName/surname
- Include ABN if available

## Date Format Requirements

**⚠️ COMMON ERROR**: "InvalidPureDateException"

ShareDo dates MUST be in PureDate format (YYYYMMDD as integer):

✅ **CORRECT:**
```javascript
dateOfBirth: 19800115  // Integer format
```

❌ **WRONG:**
```javascript
dateOfBirth: "1980-01-15"  // String format
dateOfBirth: { day: 15, month: 1, year: 1980 }  // Object format
dateOfBirth: new Date("1980-01-15")  // Date object
```

## Related Documentation
- [Contact Details Format](05-contact-details.md) - Contact type specifications
- [API Patterns](03-api-patterns.md) - General API guidelines