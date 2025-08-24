# UnifiedDataSearch for ShareDo

A complete frontend-only solution for searching across ShareDo ODS and external Practice Management Systems (PMS) with NO backend changes required.

## 🎯 Overview

UnifiedDataSearch provides a seamless search experience across multiple data sources in ShareDo environments, allowing users to search both internal ODS (Organisational Data Store) and external PMS systems simultaneously. Results are intelligently merged, duplicates are identified, and data conflicts are highlighted.

## ✨ Key Features

- **🔍 Unified Search**: Single search interface for both ODS and PMS data
- **🔄 Intelligent Merging**: Automatic matching and deduplication of entities
- **⚡ No Backend Required**: 100% frontend solution using existing ShareDo APIs
- **🎨 Dual Display Modes**: Simple Mode (recommended) or Component Mode
- **📊 Auto-Import**: Automatically create ODS entities from PMS records
- **⚠️ Conflict Detection**: Highlights data discrepancies between systems
- **🧪 Mock PMS Service**: Built-in demo/development mode
- **📱 Responsive Design**: Works on all screen sizes

## 🚀 Quick Start

### Installation

1. Copy the `UnifiedDataSearch` folder to your ShareDo IDE path:
   ```
   _IDE/Alt/UnifiedDataSearch/
   ```

2. Add the widget to your aspect configuration:
   ```json
   {
       "id": "Alt.UnifiedDataSearch.Widgets.UnifiedOdsEntityPicker",
       "useShareDoComponent": false,
       "label": "Select Client",
       "mode": "auto"
   }
   ```

3. Open the search blade:
   ```javascript
   $ui.stacks.openPanel("Alt.UnifiedDataSearch.Blades.UnifiedOdsPmsSearch", {
       mode: "auto",
       entityTypes: ["person", "organisation"]
   });
   ```

## 📖 Documentation

- **[Quick Implementation Guide](./QUICK_IMPLEMENTATION_GUIDE.md)** - Get started in 5 minutes
- **[Full Documentation (CLAUDE.md)](./CLAUDE.md)** - Complete implementation details
- **[Component Research](./SHAREDO_COMPONENT_INTEGRATION_RESEARCH.md)** - ShareDo component analysis
- **[Technical Specification](./SPECIFICATION.md)** - Original requirements

## 🏗️ Architecture

```
UnifiedDataSearch/
├── Blades/                 # Search interface blade
│   └── UnifiedOdsPmsSearch/
├── Widgets/                # Form integration widgets
│   ├── UnifiedOdsEntityPicker/
│   └── UnifiedOdsEntityPickerDesigner/
├── Services/               # Core business logic
│   ├── MockPmsService.js
│   ├── ResultMergerService.js
│   └── ConflictDetectorService.js
├── Helpers/                # Utility functions
└── Examples/               # Configuration examples
```

## 🎨 Display Modes

### Simple Mode (Recommended) ✅
- Full control over all interactions
- Custom blade for both search and entity viewing
- Consistent user experience
- Best for new implementations

### Component Mode ⚠️
- Uses ShareDo's native component styling
- Limited customization (search only)
- Use only when visual consistency is mandatory

## 🔧 Configuration Options

```javascript
{
    // Core Settings
    "useShareDoComponent": false,    // Simple Mode (recommended)
    "mode": "auto",                  // auto-import or select-only
    
    // Display Settings
    "label": "Select Client",
    "entityTypes": ["person", "organisation"],
    "allowMultiple": false,
    "required": true,
    
    // Advanced Settings
    "useMockPms": true,              // Use mock data for demo
    "pmsTimeout": 5000,              // PMS search timeout
    "fieldName": "clientOdsId"       // Form field mapping
}
```

## 🧪 Testing

The module includes comprehensive test pages:
- `test-blade.html` - Test the search blade
- `test-widget.html` - Test the entity picker widget
- `test-mock-data.html` - Test mock PMS service
- `test-ods-api.html` - Test ODS API integration

## 🔌 API Integration

### Required ShareDo APIs (Existing)
- `/api/ods/search` - ODS entity search
- `/api/aspects/ods/people/` - Create/update persons
- `/api/aspects/ods/organisations/` - Create/update organisations
- `/api/aspects/participants/` - Participant management

### External PMS Integration (Optional)
- Configure external search providers in ShareDo settings
- Or use the built-in mock service for development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with mock data
5. Submit a pull request

## 📄 License

This module is part of the ShareDo platform customizations for Alterspective.

## 🆘 Support

For issues or questions:
- Check the [documentation](./CLAUDE.md)
- Review [implementation examples](./Examples/)
- Contact the Alterspective development team

## ⚠️ Important Notes

1. **NO Backend Changes Required** - This is a frontend-only solution
2. **Use Mock Service for Demos** - Real PMS integration requires configuration
3. **Simple Mode Recommended** - Provides best user experience
4. **Follow ShareDo Patterns** - Use namespace(), not ES6 modules

---

Built with ❤️ for the ShareDo platform by Alterspective