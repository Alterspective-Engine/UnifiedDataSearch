# CLAUDE.md - UnifiedDataSearch Module

## 📚 Documentation Index

All documentation is organized in the `docs/` directory for easier navigation.

**Start here:** [docs/README.md](docs/README.md) - Complete documentation index

## Quick Links

| Topic | Documentation |
|-------|--------------|
| **Quick Setup** | [docs/02-quick-setup.md](docs/02-quick-setup.md) |
| **API Patterns** | [docs/03-api-patterns.md](docs/03-api-patterns.md) |
| **Contact Details** | [docs/05-contact-details.md](docs/05-contact-details.md) |
| **Testing** | [docs/13-testing.md](docs/13-testing.md) |
| **Troubleshooting** | [docs/14-troubleshooting.md](docs/14-troubleshooting.md) |
| **Deployment** | [docs/16-deployment.md](docs/16-deployment.md) |

## Module Overview

UnifiedDataSearch provides:
- Frontend-only search across ShareDo ODS and external PMS systems
- NO backend changes required - uses existing ShareDo APIs
- Automatic entity matching and conflict detection
- Mock PMS service for development/testing
- Event-driven architecture for widget integration

## Critical Requirements

- **NO Backend Changes** - All code is client-side JavaScript
- **Use ShareDo Patterns** - namespace(), Knockout.js, $ui.events
- **Follow API Conventions** - See [docs/03-api-patterns.md](docs/03-api-patterns.md)

## Implementation Components

### Services
- **MockPmsService** - [docs/07-mock-pms.md](docs/07-mock-pms.md)
- **ResultMergerService** - [docs/06-result-merger.md](docs/06-result-merger.md)
- **OdsImportService** - [docs/04-ods-entity-creation.md](docs/04-ods-entity-creation.md)

### UI Components
- **UnifiedOdsPmsSearch Blade** - [docs/11-blade-implementation.md](docs/11-blade-implementation.md)
- **UnifiedOdsEntityPicker Widget** - [docs/08-widget-integration.md](docs/08-widget-integration.md)

### Configuration
- **Display Modes** - [docs/09-display-modes.md](docs/09-display-modes.md)
- **Event Handling** - [docs/12-event-handling.md](docs/12-event-handling.md)
- **Configuration Options** - [docs/15-configuration.md](docs/15-configuration.md)

## Quick Test

```javascript
// Open the search blade
$ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
    mode: "auto",
    useMockPms: true
});
```

## Support

For detailed implementation instructions, troubleshooting, and examples, please refer to the specific documentation files in the `docs/` directory.