# Contact Details Format Guide

## ⚠️ CRITICAL - Contact Type Requirements

**COMMON ERROR**: "Invalid contact detail type specified for new contact details"

Contact details MUST use specific `contactTypeCategoryId` and `contactTypeSystemName` combinations.

## For PERSONS

### Email Contact
```javascript
{
    contactTypeCategoryId: 2100,
    contactTypeSystemName: "email",
    contactValue: "john@example.com",
    isActive: true,
    isPrimary: true
}
```

### Phone Contact - MUST use "mobile" or "direct-line"
```javascript
{
    contactTypeCategoryId: 2101,
    contactTypeSystemName: "mobile",  // ✅ CORRECT for persons
    // contactTypeSystemName: "phone",  // ❌ WRONG - will cause error
    contactValue: "0412345678",
    isActive: true,
    isPrimary: false
}
```

## For ORGANISATIONS

### Email Contact
```javascript
{
    contactTypeCategoryId: 2100,
    contactTypeSystemName: "email",
    contactValue: "info@company.com",
    isActive: true,
    isPrimary: true
}
```

### Phone Contact - MUST use "phone"
```javascript
{
    contactTypeCategoryId: 2102,  // Note: Different category ID than persons
    contactTypeSystemName: "phone",  // ✅ CORRECT for organisations
    contactValue: "0298765432",
    isActive: true,
    isPrimary: false
}
```

## Important Rules

1. **Person phone**: Use `mobile` with category `2101`
2. **Organisation phone**: Use `phone` with category `2102`
3. **Email**: Same for both - use `email` with category `2100`
4. **Stringify**: Contact details must be JSON.stringify'd in aspectData
5. **Primary**: Only one contact can be primary per type

## Common Mistakes

❌ Using "phone" for persons (should be "mobile")
❌ Using wrong category IDs
❌ Not stringifying contact details array
❌ Multiple primary contacts

## Related Documentation
- [ODS Entity Creation](04-ods-entity-creation.md) - Complete entity examples
- [API Patterns](03-api-patterns.md) - General API guidelines