# Critical API Usage Patterns

## ⚠️ MUST READ - Common Errors and Solutions

### 1. Correct API Endpoints

✅ **CORRECT endpoints for creating ODS entities:**
```javascript
var personEndpoint = "/api/aspects/ods/people/";        // Note: plural "people"
var orgEndpoint = "/api/aspects/ods/organisations/";    // Note: plural "organisations"
```

❌ **WRONG endpoints (will return 404):**
```javascript
// "/api/ods/person"  ❌
// "/api/ods/organisation"  ❌
```

### 2. Foreign Key Constraints

**⚠️ COMMON ERROR**: "Foreign key constraint violation"

❌ **WRONG - will cause foreign key constraint error:**
```javascript
{
    sourceSystem: "PMS",  // ❌ Not a valid external data source
    // ...
}
```

✅ **CORRECT - omit the field or use valid value:**
```javascript
{
    // sourceSystem field omitted
    reference: "PMS-ID-123",  // ✅ Store PMS ID in reference field instead
    externalReference: "PMS-ID-123",
    // ...
}
```

### 3. API Response Handling

Always handle both success and failure cases:
```javascript
$ajax.post("/api/aspects/ods/people/", payload)
    .done(function(created) {
        console.log("Person created with ID:", created.id);
    })
    .fail(function(error) {
        console.error("Failed to create person:", error);
    });
```

## Best Practices
1. Always validate data before API calls
2. Use proper error handling
3. Check API availability before using
4. Use mock services for development

## Related Documentation
- [ODS Entity Creation](04-ods-entity-creation.md) - Complete creation examples
- [Contact Details Format](05-contact-details.md) - Contact type requirements