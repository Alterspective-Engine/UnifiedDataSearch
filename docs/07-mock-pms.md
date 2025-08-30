# Mock PMS Service Documentation

## Overview
The MockPmsService provides test data for development and demonstration when no real PMS integration exists.

## Features
- localStorage persistence
- Simulated network delay (300-700ms)
- Search filtering
- Pagination support

## Default Mock Data

### Mock Persons
```javascript
{
    id: "PMS-P001",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@example.com",
    phone: "0412345678",
    dateOfBirth: "1980-01-15",
    address: "123 Main St",
    suburb: "Sydney",
    postcode: "2000",
    source: "pms",
    odsType: "person"
}
```

### Mock Organisations
```javascript
{
    id: "PMS-O001",
    name: "ABC Legal Services",
    tradingName: "ABC Legal",
    abn: "12345678901",
    email: "contact@abclegal.com",
    phone: "0298765432",
    address: "456 Corporate Blvd",
    suburb: "Melbourne",
    postcode: "3000",
    source: "pms",
    odsType: "organisation"
}
```

## Usage

### Search for Persons
```javascript
var service = Alt.UnifiedDataSearch.Services.mockPmsService;
service.search("persons", "john", 0).done(function(results) {
    console.log("Results:", results);
});
```

### Search for Organisations
```javascript
service.search("organisations", "legal", 0).done(function(results) {
    console.log("Results:", results);
});
```

## localStorage Management

### View Stored Data
```javascript
var data = localStorage.getItem('alt.unifiedSearch.mockPmsData');
console.log(JSON.parse(data));
```

### Clear Mock Data
```javascript
localStorage.removeItem('alt.unifiedSearch.mockPmsData');
```

### Add Custom Mock Data
```javascript
var service = Alt.UnifiedDataSearch.Services.mockPmsService;
service.mockPersons.push({
    id: "PMS-P999",
    firstName: "Custom",
    lastName: "Person",
    // ... other fields
});
service.saveMockData();
```

## Configuration
- Page size: 10 records
- Delay: 300-700ms random
- Storage key: `alt.unifiedSearch.mockPmsData`

## Related Documentation
- [Result Merger Service](06-result-merger.md) - How mock data is merged
- [Testing Guide](13-testing.md) - Testing with mock data