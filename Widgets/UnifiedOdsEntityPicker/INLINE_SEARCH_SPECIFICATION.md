# Inline Search Specification for UnifiedOdsEntityPicker Widget

## Overview
This specification defines the inline search functionality for the UnifiedOdsEntityPicker widget that searches across both ShareDo ODS and external PMS systems, with configurable labels and auto-import capabilities.

## Core Requirements

### 1. Inline Search Functionality
- **Activation**: Click on the empty widget card to activate inline search
- **Search Input**: Display text input field inline within the card
- **Minimum Characters**: Start searching after 2 characters typed
- **Debounce**: 500ms delay before executing search
- **Results Display**: Dropdown list below the input showing results

### 2. Unified Search
- **Parallel Search**: Execute searches against both ShareDo ODS and PMS simultaneously
- **Result Merging**: Combine and deduplicate results from both systems
- **Matching Logic**: Identify records that exist in both systems
- **Performance**: PMS search should have configurable timeout (default 5 seconds)

### 3. Source Indicators
Each result must clearly show its source:
- **ShareDo Only**: Green indicator with configurable label (default: "ShareDo")
- **PMS Only**: Blue indicator with configurable label (default: "PMS") 
- **Matched**: Orange indicator with configurable label (default: "Matched")

Visual indicators:
```
[Icon] John Smith
       ● ShareDo    (green dot + label)
       
[Icon] Jane Doe  
       ● Aderant    (blue dot + label)
       
[Icon] Bob Jones
       ● Matched    (orange dot + label)
```

### 4. Configuration Options

```javascript
{
    // Mode configuration
    mode: "auto", // "auto" | "select"
    
    // Label configuration
    labels: {
        sharedo: "ShareDo",  // Customizable (e.g., "Case")
        pms: "PMS",          // Customizable (e.g., "Aderant")
        matched: "Matched",  // Customizable
        searching: "Searching...",
        noResults: "No results found",
        moreResults: "View all results..."
    },
    
    // Search configuration
    inlineSearch: {
        enabled: true,
        minCharacters: 2,
        debounceMs: 500,
        maxResults: 10
    },
    
    // Mock mode for testing
    useMockPms: false,  // true for testing, false for production
    
    // PMS provider configuration
    pmsProvider: "aderant", // or other configured provider
    pmsTimeout: 5000
}
```

### 5. Auto-Import Behavior (MVP)

When `mode: "auto"`:
1. User searches and sees results from both systems
2. Selecting a PMS-only record triggers auto-import to ShareDo
3. The widget immediately creates the ODS entity via API
4. After successful creation, the entity is selected in the widget
5. No blade opening - direct creation only

When `mode: "select"`:
1. User searches and sees results
2. Selecting any record just populates the widget
3. No auto-import occurs

### 6. API Integration

#### ShareDo ODS Search
```javascript
GET /api/ods/search
Parameters:
- q: search query
- entityTypes: ["person", "organisation"]
- page: 0
- pageSize: 10
```

#### PMS Search (Mock Mode)
Use MockPmsService with configurable test data

#### PMS Search (Production Mode)
```javascript
GET /api/ods/externalSearch/providers/{provider}/persons
GET /api/ods/externalSearch/providers/{provider}/organisations
Parameters:
- q: search query
- page: 0
```

#### Auto-Import to ODS
```javascript
POST /api/aspects/ods/people/
POST /api/aspects/ods/organisations/
Body: {
    // Entity data from PMS
    firstName, lastName, email, phone, etc.
    reference: "PMS-ID", // Store PMS ID for matching
    tags: ["imported-from-pms"]
}
```

### 7. Shared Code Architecture

Create reusable services:

#### UnifiedSearchService
- Handles parallel search execution
- Merges and deduplicates results
- Applies source labels
- Used by both widget and blade

#### OdsImportService  
- Handles PMS to ODS entity creation
- Manages data transformation
- Error handling and retry logic
- Used by both widget and blade

### 8. UI/UX Requirements

#### Widget States
1. **Empty State**: Shows "Click to search" with search icon
2. **Search Active**: Shows input field with focus
3. **Searching**: Shows loading spinner
4. **Results**: Shows dropdown with results
5. **Selected**: Shows selected entity card

#### Inline Search Results Layout
```html
<div class="inline-search-results">
    <!-- Search Input -->
    <input type="text" placeholder="Type to search..." />
    
    <!-- Results Dropdown -->
    <div class="search-results-dropdown">
        <!-- Individual Result -->
        <div class="search-result-item">
            <i class="fa fa-user"></i>
            <span class="result-name">John Smith</span>
            <span class="result-source source-sharedo">Case</span>
        </div>
        
        <!-- More Results Link -->
        <div class="search-more-link">
            <i class="fa fa-search-plus"></i>
            View all results...
        </div>
    </div>
</div>
```

### 9. Event Handling

#### Widget Events
- `click` on empty card → activate inline search
- `blur` on input → hide results (with delay for click handling)
- `keyup` on input → trigger debounced search
- `click` on result → select entity
- `click` on "View all" → open full search blade

#### Knockout Bindings
```javascript
// Observable for search state
self.isInlineSearchActive = ko.observable(false);
self.inlineSearchQuery = ko.observable("");
self.inlineSearchResults = ko.observableArray([]);
self.isSearching = ko.observable(false);

// Computed for result display
self.displayedResults = ko.computed(function() {
    return self.inlineSearchResults().slice(0, 10);
});
```

### 10. Performance Considerations

1. **Debouncing**: Prevent excessive API calls
2. **Result Caching**: Cache recent searches (5 minute TTL)
3. **Timeout Handling**: Gracefully handle PMS timeouts
4. **Result Limiting**: Show max 10 inline results
5. **Lazy Loading**: Only load full details when needed

## Implementation Plan

### Phase 1: Shared Services
1. Create `UnifiedSearchService.js`
2. Create `OdsImportService.js`
3. Update `ResultMergerService.js` to support labels

### Phase 2: Widget Enhancement
1. Add inline search observables
2. Implement click-to-search activation
3. Add search input with debouncing
4. Display results dropdown

### Phase 3: Integration
1. Wire up unified search service
2. Implement auto-import logic
3. Add source indicators
4. Configure labels

### Phase 4: Testing
1. Test with mock PMS data
2. Verify auto-import functionality
3. Test label configuration
4. Performance testing

## Success Criteria

1. ✅ Inline search activates on click
2. ✅ Searches both ShareDo and PMS simultaneously
3. ✅ Results show clear source indicators
4. ✅ Labels are configurable
5. ✅ PMS records auto-import when selected (auto mode)
6. ✅ Code is shared between widget and blade
7. ✅ Mock mode works for testing
8. ✅ Production mode uses real APIs
9. ✅ Performance is acceptable (<2s for results)
10. ✅ User experience is smooth and intuitive

## Non-Functional Requirements

1. **Accessibility**: Keyboard navigation support
2. **Browser Support**: IE11+, Chrome, Firefox, Safari
3. **Mobile**: Touch-friendly interaction
4. **Localization**: Support for label translation
5. **Error Handling**: Graceful degradation on API failures