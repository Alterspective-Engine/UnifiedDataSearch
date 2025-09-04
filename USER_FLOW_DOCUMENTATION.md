# UnifiedDataSearch - Complete User Flow Documentation

## 📋 User Journey Map

### 1. Initial State
**User sees**: Empty entity picker with "Select Entity" label
**Action**: User clicks on the search prompt or card
**Result**: Inline search input appears with smooth slide-down animation

### 2. Search Activation
**User sees**: Focused input field with placeholder "Start typing a name, email, or phone number..."
**Action**: User starts typing (e.g., "igor")
**Result**: After 300ms debounce, search begins across both systems

### 3. During Search
**User sees**: 
- Search icon pulses to indicate activity
- Card border highlights in purple
- "Searching..." text appears briefly

**Behind the scenes**:
- Widget makes POST request to `/api/ods/_search` for ShareDo data
- Widget queries MockPmsService for PMS data (or real PMS if configured)
- Results are merged and deduplicated

### 4. Results Display
**User sees**: Dropdown with search results showing:
- Person/Organisation icon in circular background
- Entity name prominently displayed
- Source badge (ShareDo/PMS/Matched)
- Contact details (email, phone)
- Address information (if available)
- Smooth entrance animation (slideDown 200ms)

**Visual indicators**:
- **Green "SHAREDO" badge**: Entity exists in ShareDo ODS
- **Blue "PMS" badge**: Entity only in Practice Management System
- **Orange "MATCHED" badge**: Entity found in both systems

### 5. Result Interaction

#### Mouse Interaction
**Hover**: 
- Result highlights with light blue background (#f0f7ff)
- Slight indent animation (18px)
- Cursor changes to pointer

**Click**:
- Result briefly scales down (0.98) for tactile feedback
- Entity is selected

#### Keyboard Navigation
**Arrow Down/Up**: 
- Navigate through results
- Selected item highlighted with blue background and left border
- Auto-scrolls to keep selection in view
- Wraps around at list boundaries

**Enter**: 
- Selects currently highlighted result
- Or auto-selects if only one result

**Escape**: 
- Closes search dropdown
- Clears search query
- Returns to initial state

### 6. Entity Selection

#### For ShareDo Entities (Green Badge)
**Action**: User clicks/selects entity
**Result**: 
- Entity immediately appears in widget
- Shows full details (name, contact, address)
- Search dropdown closes
- Form field updated with entity ID

#### For PMS Entities (Blue Badge)
**Mode: "auto"** (default)
**Action**: User clicks/selects PMS entity
**Result**:
1. System automatically creates ShareDo ODS record
2. Shows brief loading state
3. Entity appears in widget with ShareDo ID
4. Future searches will show as "MATCHED"

**Mode: "select"**
**Action**: User clicks/selects PMS entity
**Result**:
- Entity selected without ODS creation
- Shows PMS data in widget
- Blade closes if opened from blade

### 7. Selected Entity Display
**User sees** comprehensive entity card with:
- Profile icon or image
- Full name with role label
- **Contact section**: Clickable email and phone
- **Address section**: Full formatted address
- **Additional info**: 
  - Date of birth (persons)
  - ABN (organisations)
- **Source indicator**: Where data originated
- **Action buttons**:
  - 🔍 Search (opens advanced search)
  - 👁️ View (opens entity details - ODS only)
  - ❌ Clear (removes selection)

### 8. Advanced Search
**Trigger**: User clicks search button or "View all results..."
**Result**: Opens UnifiedOdsPmsSearch blade with:
- Full search interface
- System status indicators (ShareDo ✓ PMS ✓)
- Complete result listing
- Entity type filters
- Pagination controls

### 9. Error Handling

#### Search Errors
**Scenario**: API fails or timeout
**User sees**: 
- Friendly error message
- Auto-dismisses after 5 seconds
- Manual dismiss with X button

**Messages**:
- "Please check your internet connection"
- "Search service not found"
- "Server error. Please try again later"

#### No Results
**User sees**: 
- "No results found" message
- Link to open advanced search
- Clear indication of search status

## 🎯 Key User Experience Features

### Performance
- **300ms debounce**: Prevents excessive API calls while typing
- **200-300ms animations**: Smooth but responsive
- **5 second timeout**: PMS search with graceful fallback
- **Instant feedback**: Every action has immediate visual response

### Accessibility
- **Full keyboard navigation**: Complete functionality without mouse
- **Clear focus indicators**: Visible selection state
- **High contrast**: Text and backgrounds meet WCAG standards
- **Descriptive labels**: All icons paired with text

### Visual Design
- **Consistent spacing**: 12-15px padding throughout
- **Color coding**: Green (ShareDo), Blue (PMS), Orange (Matched)
- **Smooth transitions**: All state changes animated
- **Professional appearance**: Matches ShareDo design system

### Data Integrity
- **Deduplication**: Prevents duplicate entries
- **Conflict detection**: Highlights data differences
- **Source tracking**: Always know data origin
- **Validation**: All required fields checked

## 🔄 Complete Interaction States

### Widget States
1. **Empty**: No entity selected, search prompt visible
2. **Searching**: Active search, loading indicators
3. **Results**: Dropdown showing search results
4. **Selected**: Entity selected and displayed
5. **Error**: Error message displayed

### Search States
1. **Idle**: Waiting for user input
2. **Typing**: User entering search query (debouncing)
3. **Loading**: API calls in progress
4. **Complete**: Results displayed
5. **Failed**: Error state with message

### Entity States
1. **ShareDo Only**: Green badge, full ODS features
2. **PMS Only**: Blue badge, limited features
3. **Matched**: Orange badge, merged data
4. **Conflicted**: Warning icon, data differences

## ✅ Testing Checklist

### Functional Tests
- [x] Search activates on click
- [x] Input auto-focuses
- [x] Search triggers after 300ms
- [x] Results display correctly
- [x] Source badges show appropriately
- [x] Click selection works
- [x] Keyboard navigation functions
- [x] Entity displays fully
- [x] Clear button works
- [x] Advanced search opens

### Visual Tests
- [x] Animations are smooth
- [x] Hover states work
- [x] Focus indicators visible
- [x] Icons display correctly
- [x] Badges have correct colors
- [x] Spacing is consistent
- [x] Text is readable

### Integration Tests
- [x] ShareDo API calls work
- [x] PMS mock data loads
- [x] Auto-import creates ODS records
- [x] Events publish correctly
- [x] Form fields update

## 📱 Device Considerations

### Desktop
- Full hover interactions
- Keyboard shortcuts
- Multi-column layouts
- Tooltip hints

### Tablet/Mobile
- Touch-friendly targets (44px minimum)
- Simplified hover states
- Full-width dropdowns
- Larger text for readability

## 🚀 Ready for Production

The UnifiedDataSearch module provides:
1. **Intuitive search** - Users find entities quickly
2. **Clear feedback** - Every action has visual response
3. **Smart integration** - Seamlessly merges two systems
4. **Professional polish** - Smooth, modern interface
5. **Robust handling** - Graceful error recovery
6. **Complete functionality** - All features accessible

The user experience has been carefully crafted to be efficient, intuitive, and delightful to use.