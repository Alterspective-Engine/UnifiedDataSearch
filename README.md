# UnifiedDataSearch for ShareDo

A complete frontend-only solution for searching across ShareDo ODS and external Practice Management Systems (PMS) with NO backend changes required.

> ⚠️ **CRITICAL**: This module MUST be installed under `_IDE/Alt/UnifiedDataSearch/` to work with the ShareDo VSCode extension for deployment. See [Installation](#installation) for details.

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

### ⚠️ IMPORTANT: Directory Structure Requirement

**This module MUST be placed under the `_IDE/Alt/` directory structure to work with the ShareDo VSCode extension for deployment.**

### Installation

1. Clone or copy the `UnifiedDataSearch` folder to your ShareDo project at this EXACT path:
   ```
   YourShareDoProject/
   └── _IDE/
       └── Alt/
           └── UnifiedDataSearch/   ← THIS MODULE GOES HERE
               ├── Blades/
               ├── Widgets/
               ├── Services/
               └── ...
   ```

   **Why this specific path?**
   - The ShareDo VSCode extension scans the `_IDE/` directory for deployable components
   - The `Alt/` subfolder organizes Alterspective customizations
   - File references in the code use `/_ideFiles/Alt/UnifiedDataSearch/...` paths
   - The VSCode extension will NOT detect or deploy the module if placed elsewhere

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

- **[Complete Documentation](./DOCUMENTATION.md)** - Full technical reference
- **[Quick Implementation Guide](./QUICK_IMPLEMENTATION_GUIDE.md)** - Get started in 5 minutes
- **[Implementation Details (CLAUDE.md)](./CLAUDE.md)** - Detailed implementation notes
- **[Component Research](./SHAREDO_COMPONENT_INTEGRATION_RESEARCH.md)** - ShareDo component analysis

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

## 🚢 Deployment with ShareDo VSCode Extension

### Prerequisites
1. **ShareDo VSCode Extension** installed and configured
2. Module placed at correct path: `_IDE/Alt/UnifiedDataSearch/`
3. VSCode workspace opened at project root (containing `_IDE/` folder)

### Deployment Steps

1. **Open VSCode** at your ShareDo project root
   ```
   code YourShareDoProject/
   ```

2. **Verify module location**:
   - In VSCode Explorer, navigate to `_IDE/Alt/UnifiedDataSearch/`
   - Confirm all files are present

3. **Use ShareDo Extension**:
   - Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Run: `ShareDo: Deploy IDE Components`
   - Select `UnifiedDataSearch` components for deployment

4. **Verify deployment**:
   - Check that files are accessible at `/_ideFiles/Alt/UnifiedDataSearch/...`
   - Test blade opening in ShareDo UI

### Path Mapping

| Local Path | Deployed URL Path |
|------------|------------------|
| `_IDE/Alt/UnifiedDataSearch/Blades/...` | `/_ideFiles/Alt/UnifiedDataSearch/Blades/...` |
| `_IDE/Alt/UnifiedDataSearch/Widgets/...` | `/_ideFiles/Alt/UnifiedDataSearch/Widgets/...` |
| `_IDE/Alt/UnifiedDataSearch/Services/...` | `/_ideFiles/Alt/UnifiedDataSearch/Services/...` |

### ⚠️ Common Deployment Issues

**Issue**: "Module not found by VSCode extension"
- **Solution**: Ensure module is under `_IDE/Alt/` not in root or other locations

**Issue**: "404 errors when loading blade"
- **Solution**: Check that paths in panel.json use `/_ideFiles/Alt/UnifiedDataSearch/...`

**Issue**: "Components not appearing in ShareDo"
- **Solution**: Verify VSCode extension deployment completed successfully

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