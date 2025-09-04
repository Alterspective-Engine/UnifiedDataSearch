# UX/UI Improvement Specification

## Goal
Transform the UnifiedOdsEntityPicker into a 10/10 experience across all 15 UX categories.

## Target Design
```
┌─────────────────────────────────────────────┐
│ Select Entity                                │
├─────────────────────────────────────────────┤
│ ┌───────────────────────────────────────┐   │
│ │ 🔍 Search persons and organisations... │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ Selected:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ 👤 Igor Admin              [ODS] ✓     │ │
│ │    admin@example.com                    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Improvements by Category

### 1. Visual Hierarchy (Target: 10/10)
- **Primary**: Search input always visible at top
- **Secondary**: Selected entity below
- **Clear separation** between search and selection
- **Progressive disclosure** of details

### 2. Search Accessibility (Target: 10/10)
- **Always visible** search input
- **No clicks required** to start searching
- **Clear placeholder** text
- **Persistent search icon**

### 3. Consistency (Target: 10/10)
- **Match ShareDo patterns** exactly
- **Unified styling** with other form fields
- **Consistent spacing** throughout
- **Standard badge styles**

### 4. Feedback & Affordance (Target: 10/10)
- **Real-time search** as you type
- **Loading indicators** during search
- **Result count** display
- **Clear CTAs** for actions

### 5. Color & Contrast (Target: 10/10)
- **WCAG AAA** compliance
- **Status colors**: Green (success), Blue (info), Gray (neutral)
- **Focus outline**: 2px solid blue
- **Hover states**: Subtle background change

### 6. Typography (Target: 10/10)
- **Font sizes**: 14px primary, 12px secondary, 11px meta
- **Font weights**: 600 for headers, 400 for body
- **Line height**: 1.5 for readability
- **Truncation** with ellipsis for long text

### 7. Spacing & Alignment (Target: 10/10)
- **8px grid system**
- **16px padding** for containers
- **8px gaps** between elements
- **Aligned to baseline** grid

### 8. Interactive States (Target: 10/10)
- **Hover**: Background color change
- **Focus**: Blue outline
- **Active**: Scale transform
- **Disabled**: 50% opacity

### 9. Icon Usage (Target: 10/10)
- **Search icon** in input
- **User/Building** icons for entity types
- **Check mark** for selected
- **X** for clear/remove

### 10. Mobile Responsiveness (Target: 10/10)
- **44px minimum** touch targets
- **Responsive layout** for small screens
- **Touch-friendly** interactions
- **Swipe to remove** on mobile

### 11. Error Prevention (Target: 10/10)
- **Minimum 2 chars** for search
- **Debounced input** (300ms)
- **Duplicate detection**
- **Confirmation for remove**

### 12. Cognitive Load (Target: 10/10)
- **Single purpose** per screen
- **Progressive disclosure**
- **Clear labels**
- **Contextual help**

### 13. Performance Perception (Target: 10/10)
- **Skeleton screens** while loading
- **Optimistic updates**
- **Instant feedback**
- **Smooth animations**

### 14. Accessibility (Target: 10/10)
- **ARIA labels** on all elements
- **Keyboard navigation** (Tab, Enter, Esc)
- **Screen reader** friendly
- **High contrast** mode support

### 15. Delight & Polish (Target: 10/10)
- **Micro-animations** on interactions
- **Spring physics** for movements
- **Haptic feedback** (mobile)
- **Success celebrations**

## Implementation Priority

### Phase 1: Core Functionality (Must Have)
1. Always-visible search input
2. Real-time search results
3. Clear selected state
4. Keyboard navigation

### Phase 2: Polish (Should Have)
1. Loading states
2. Animations
3. Better icons
4. Mobile optimization

### Phase 3: Delight (Nice to Have)
1. Micro-interactions
2. Advanced animations
3. Haptic feedback
4. Success states

## Success Metrics
- Search discovery: <1 second
- Time to first result: <2 seconds
- Selection accuracy: >95%
- User satisfaction: >9/10