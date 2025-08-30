# Event Handling Guide

## Event Publishing

### Custom Event
When a participant is added:
```javascript
$ui.events.publish("Alt.UnifiedDataSearch.ParticipantAdded", {
    sharedoId: self.options.sharedoId,
    entity: self.selectedEntity(),
    source: self.selectedEntity().source  // "sharedo", "pms", or "matched"
});
```

### ShareDo Standard Event
For widget refresh compatibility:
```javascript
$ui.events.publish("Sharedo.Core.Case.Participants.Updated", {
    sharedoId: self.options.sharedoId
});
```

## Event Subscribing

### In Widgets
```javascript
// Subscribe to standard ShareDo event
var subscriptionId = $ui.events.subscribe("Sharedo.Core.Case.Participants.Updated", 
    function(data) {
        if (data.sharedoId === self.sharedoId) {
            self.reload(); // Refresh widget data
        }
    }, self);

// Subscribe to custom event for additional info
var customSubscriptionId = $ui.events.subscribe("Alt.UnifiedDataSearch.ParticipantAdded",
    function(data) {
        if (data.sharedoId === self.sharedoId) {
            // Can check source: "sharedo", "pms", or "matched"
            console.log("Participant added from: " + data.source);
            self.reload();
        }
    }, self);
```

## Event Data Structure

### ParticipantAdded Event
```javascript
{
    sharedoId: "WI-123",        // Work item ID
    entity: {                    // Selected entity
        id: "merged-1",
        source: "matched",       // or "sharedo" or "pms"
        odsId: 456,
        pmsId: "PMS-P001",
        displayName: "John Smith",
        data: { /* entity data */ }
    },
    source: "matched"            // Duplicate for convenience
}
```

### Participants.Updated Event
```javascript
{
    sharedoId: "WI-123"         // Work item ID
}
```

## Best Practices

### 1. Always Check sharedoId
```javascript
if (data.sharedoId === self.sharedoId) {
    // Only react to relevant events
}
```

### 2. Unsubscribe on Disposal
```javascript
self.dispose = function() {
    if (subscriptionId) {
        $ui.events.unsubscribe(subscriptionId);
    }
};
```

### 3. Handle Missing Event System
```javascript
if (window.$ui && window.$ui.events && window.$ui.events.publish) {
    $ui.events.publish("EventName", data);
}
```

## Common Events

### UnifiedDataSearch Events
- `Alt.UnifiedDataSearch.ParticipantAdded` - Entity selected and added
- `Alt.UnifiedDataSearch.SearchCompleted` - Search finished
- `Alt.UnifiedDataSearch.ConflictDetected` - Data conflict found

### ShareDo Standard Events
- `Sharedo.Core.Case.Participants.Updated` - Participants changed
- `Sharedo.Core.Case.ODS.EntityCreated` - ODS entity created
- `Sharedo.Core.Case.ODS.EntityUpdated` - ODS entity updated

## Testing Events

### In Browser Console
```javascript
// Subscribe to test
$ui.events.subscribe("Alt.UnifiedDataSearch.ParticipantAdded", function(data) {
    console.log("Event received:", data);
});

// Publish to test
$ui.events.publish("Alt.UnifiedDataSearch.ParticipantAdded", {
    sharedoId: "TEST-123",
    source: "test"
});
```

## Related Documentation
- [Blade Implementation](11-blade-implementation.md) - Where events are published
- [Widget Integration](08-widget-integration.md) - Widget event handling