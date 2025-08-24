// Ensure namespace function exists
if (typeof namespace !== 'function') {
    window.namespace = function(ns) {
        var parts = ns.split('.');
        var parent = window;
        for (var i = 0; i < parts.length; i++) {
            if (typeof parent[parts[i]] === 'undefined') {
                parent[parts[i]] = {};
            }
            parent = parent[parts[i]];
        }
        return parent;
    };
}

// Create namespaces for this module
namespace("Alt.UnifiedDataSearch");
namespace("Alt.UnifiedDataSearch.Blades");
namespace("Alt.UnifiedDataSearch.Services");
namespace("Alt.UnifiedDataSearch.Widgets");
namespace("Alt.UnifiedDataSearch.Models");