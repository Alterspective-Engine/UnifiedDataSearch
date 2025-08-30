# Deployment Checklist

## Pre-Deployment Checklist

### ✅ File Structure
- [ ] All directories created under `_IDE/Alt/UnifiedDataSearch/`
- [ ] Namespace helper in place
- [ ] All services implemented
- [ ] Blade files complete (panel.json, js, html, css)
- [ ] Widget files complete (if using)

### ✅ Code Review
- [ ] No ES6 modules (using namespace pattern)
- [ ] All observables are Knockout observables
- [ ] Using `$ajax` for API calls
- [ ] Using `$ui.events` for events
- [ ] No backend changes required

### ✅ API Compliance
- [ ] Using correct API endpoints (plural forms)
- [ ] Contact details format correct
- [ ] Date format is PureDate (YYYYMMDD integer)
- [ ] No invalid sourceSystem values
- [ ] Reference field used for PMS IDs

### ✅ Testing Complete
- [ ] Mock service works
- [ ] Blade opens correctly
- [ ] Search executes properly
- [ ] Results display correctly
- [ ] Matching logic works
- [ ] Conflicts detected
- [ ] Entity selection works
- [ ] Events publish correctly
- [ ] Blade closes properly

### ✅ Documentation
- [ ] CLAUDE.md updated
- [ ] All docs/ files created
- [ ] Configuration documented
- [ ] Test procedures documented
- [ ] Troubleshooting guide complete

## Deployment Steps

### 1. Copy Files to ShareDo
```bash
# Copy entire module
cp -r _IDE/Alt/UnifiedDataSearch/ /path/to/sharedo/_ideFiles/Alt/
```

### 2. Register Blade
Ensure blade is registered in ShareDo:
```javascript
// Check blade registration
$ui.stacks.panels["Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch"]
```

### 3. Configure Settings
```javascript
// Set any required system settings
$ajax.post("/api/v2/public/settings", {
    name: "alt.ods.unified.search.enabled",
    value: "true"
});
```

### 4. Update Work Item UI
Add widget to work item configuration:
```json
{
    "widgets": [
        {
            "type": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
            "config": {
                "mode": "auto",
                "roleSystemName": "client"
            }
        }
    ]
}
```

### 5. Test in Environment
```javascript
// Test blade opening
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    mode: "auto",
    useMockPms: true
});
```

## Post-Deployment Verification

### Functional Tests
- [ ] Blade opens from work item
- [ ] Search returns results
- [ ] Can select entities
- [ ] Participants added correctly
- [ ] Widgets refresh on update

### Integration Tests
- [ ] Works with existing ODS entities
- [ ] Works with real PMS (if configured)
- [ ] Events integrate with other components
- [ ] No console errors

### Performance Tests
- [ ] Search completes within timeout
- [ ] No memory leaks
- [ ] Acceptable response times

## Rollback Plan

### If Issues Occur
1. Remove blade registration
2. Revert UI configuration
3. Clear browser cache
4. Remove files from `_ideFiles/`

### Backup Commands
```javascript
// Disable temporarily
$ajax.post("/api/v2/public/settings", {
    name: "alt.ods.unified.search.enabled",
    value: "false"
});
```

## Production Configuration

### Recommended Settings
```javascript
{
    mode: "auto",
    useMockPms: false,  // Use real PMS in production
    pmsTimeout: 10000,  // Higher timeout for production
    rowsPerPage: 50,    // More results in production
    features: {
        showDebugInfo: false,  // Disable debug in production
        enableCaching: true    // Enable caching
    }
}
```

### Monitoring
- Check browser console for errors
- Monitor API response times
- Track event publishing
- Watch for timeout issues

## User Training

### Key Points to Cover
1. Unified search combines ShareDo and PMS data
2. Color coding shows data source
3. Conflicts are highlighted
4. Auto-import creates ODS records
5. Manual review available for conflicts

### Documentation for Users
- Create user guide
- Record training video
- Provide quick reference card
- Set up support channel

## Maintenance

### Regular Tasks
- Clear old mock data from localStorage
- Monitor API performance
- Update mock data for testing
- Review error logs

### Updates
- Test updates in development first
- Backup current version
- Deploy during low-usage period
- Verify after deployment

## Related Documentation
- [Testing Guide](13-testing.md) - Pre-deployment testing
- [Configuration Options](15-configuration.md) - Production settings
- [Troubleshooting](14-troubleshooting.md) - Issue resolution