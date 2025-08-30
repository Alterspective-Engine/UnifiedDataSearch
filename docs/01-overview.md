# UnifiedDataSearch Overview

## What is UnifiedDataSearch?
A frontend-only solution for searching across ShareDo ODS and external PMS systems with NO backend changes required.

## CRITICAL REQUIREMENTS

### 🚫 NO Backend Changes
- **DO NOT** create new API endpoints
- **DO NOT** modify server code
- **DO NOT** change database schemas
- **ALL** code must be client-side JavaScript
- **USE ONLY** existing ShareDo APIs

### ✅ Must Follow ShareDo Patterns
- Use `namespace()` function, NOT ES6 modules
- Use Knockout.js observables, NOT plain JavaScript variables
- Use `$ui.events` for event publishing/subscribing
- Use `$ajax` or `$ajaxMutex` for API calls
- Follow existing file path patterns with `/_ideFiles/`

## Key Features
- Unified search across ShareDo ODS and PMS systems
- Automatic entity matching and conflict detection
- Support for both person and organisation entities
- Mock PMS service for development/demo
- Event-driven widget refresh
- Two display modes (Simple and Component)

## Architecture
- Frontend-only implementation
- Service-based architecture
- Event-driven communication
- Knockout.js for data binding
- Mock services for development

## Next Steps
- [Quick Setup](02-quick-setup.md) - Get started quickly
- [API Patterns](03-api-patterns.md) - Learn critical API patterns