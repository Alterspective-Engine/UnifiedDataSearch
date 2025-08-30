# UnifiedOdsEntityPicker Widget Fixes

## Changes Made to Match ShareDo OOB Styling

### HTML Structure (UnifiedOdsEntityPicker.html)
- Replaced custom entity selector box with ShareDo's standard `card entity-card` structure
- Used ShareDo's three-section layout: `status-section`, `content-section`, `menu-section`
- Removed inline search functionality (not part of OOB pattern)
- Simplified to use consistent card-based display for both empty and selected states
- Used ShareDo's standard icons and classes (fa-male for empty state, fa-user/fa-building for entities)

### CSS Styling (UnifiedOdsEntityPicker.css)
- Completely rewrote CSS to use ShareDo's built-in card styles
- Removed custom styling in favor of OOB card component styles
- Used standard ShareDo colors and spacing
- Maintained consistent flex layout with three sections
- Added proper hover effects and transitions matching OOB behavior

### Key Improvements
1. **Visual Consistency**: Now matches the exact look of ShareDo's OdsEntityPicker
2. **Proper Alignment**: Uses flex layout with correct spacing and padding
3. **Standard Shading**: Background colors match OOB (#f9f9f9 for card, white for sections)
4. **Icon Styling**: Uses standard ShareDo icon sizes and colors
5. **Menu Section**: Properly styled chevron icon in separate bordered section

### Testing Notes
- Widget should now display exactly like the OOB entity picker
- Empty state shows "Click to search" with proper styling
- Selected state shows entity details in standard card format
- Multiple selection uses nested cards as per OOB pattern

### ShareDo Component Classes Used
- `card` - Base card container
- `entity-card` - Entity-specific card styling
- `status-section` - Left icon/profile section
- `content-section` - Middle content area
- `menu-section` - Right actions area
- `card-message` - Message display in content section
- `entity-header` - Header with title and tags
- `entity-content` - Content area with details
- `entity-content-block` - Individual detail blocks
- `fa-male`, `fa-user`, `fa-building` - Standard icons
- `text-primary` - Primary color for links
- `label label-primary` - Role/tag badges

### Browser Compatibility
- Tested flex layout for IE11+ compatibility
- Used standard CSS properties supported by ShareDo platform
- No custom CSS Grid or modern features that might break in older browsers