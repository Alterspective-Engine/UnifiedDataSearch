/**
 * DebugLogger.js
 * 
 * Centralized debug logging utility for UnifiedDataSearch module.
 * Provides structured logging with different levels and performance tracking.
 * 
 * @namespace Alt.UnifiedDataSearch.Helpers
 * @class DebugLogger
 * @version 1.0.0
 * 
 * Features:
 * - Conditional logging based on debug mode
 * - Performance timing
 * - Structured output with prefixes
 * - Log level filtering
 */

namespace("Alt.UnifiedDataSearch.Helpers");

/**
 * DebugLogger Constructor
 * @param {String} module - Module name for log prefix
 * @param {Boolean} enabled - Whether debug logging is enabled
 */
Alt.UnifiedDataSearch.Helpers.DebugLogger = function(module, enabled) {
    var self = this;
    
    self.module = module || "UnifiedSearch";
    self.enabled = enabled || false;
    self.timers = {};
    
    // Check localStorage for debug override
    if (typeof localStorage !== 'undefined') {
        var debugOverride = localStorage.getItem('alt.unifiedSearch.debug');
        if (debugOverride === 'true') {
            self.enabled = true;
        }
    }
    
    /**
     * Log levels
     */
    self.LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
    };
    
    self.currentLevel = self.LEVELS.INFO;
    
    /**
     * Set debug mode
     * @param {Boolean} enabled - Enable/disable debug mode
     */
    self.setEnabled = function(enabled) {
        self.enabled = enabled;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('alt.unifiedSearch.debug', enabled ? 'true' : 'false');
        }
    };
    
    /**
     * Set log level
     * @param {Number} level - Log level from LEVELS enum
     */
    self.setLevel = function(level) {
        self.currentLevel = level;
    };
    
    /**
     * Internal log method
     * @private
     */
    self._log = function(level, method, args) {
        if (!self.enabled || level > self.currentLevel) return;
        
        var prefix = "[" + self.module + "]";
        var timestamp = new Date().toISOString().substr(11, 12);
        
        // Convert arguments to array
        var logArgs = Array.prototype.slice.call(args);
        logArgs.unshift(prefix + " " + timestamp);
        
        // Apply to console
        console[method].apply(console, logArgs);
    };
    
    /**
     * Error logging
     */
    self.error = function() {
        self._log(self.LEVELS.ERROR, 'error', arguments);
    };
    
    /**
     * Warning logging
     */
    self.warn = function() {
        self._log(self.LEVELS.WARN, 'warn', arguments);
    };
    
    /**
     * Info logging
     */
    self.info = function() {
        self._log(self.LEVELS.INFO, 'log', arguments);
    };
    
    /**
     * Debug logging
     */
    self.debug = function() {
        self._log(self.LEVELS.DEBUG, 'log', arguments);
    };
    
    /**
     * Trace logging (most verbose)
     */
    self.trace = function() {
        self._log(self.LEVELS.TRACE, 'log', arguments);
    };
    
    /**
     * Start a performance timer
     * @param {String} name - Timer name
     */
    self.time = function(name) {
        if (!self.enabled) return;
        self.timers[name] = performance.now();
        self.debug("Timer started:", name);
    };
    
    /**
     * End a performance timer and log duration
     * @param {String} name - Timer name
     */
    self.timeEnd = function(name) {
        if (!self.enabled || !self.timers[name]) return;
        
        var duration = performance.now() - self.timers[name];
        delete self.timers[name];
        
        self.info("Timer '" + name + "' completed in", duration.toFixed(2) + "ms");
        return duration;
    };
    
    /**
     * Log a group of related messages
     * @param {String} label - Group label
     */
    self.group = function(label) {
        if (!self.enabled) return;
        console.group("[" + self.module + "] " + label);
    };
    
    /**
     * End a group
     */
    self.groupEnd = function() {
        if (!self.enabled) return;
        console.groupEnd();
    };
    
    /**
     * Log a table of data
     * @param {Array} data - Array of objects to display
     */
    self.table = function(data) {
        if (!self.enabled) return;
        console.table(data);
    };
    
    /**
     * Assert a condition
     * @param {Boolean} condition - Condition to test
     * @param {String} message - Error message if condition fails
     */
    self.assert = function(condition, message) {
        if (!self.enabled) return;
        console.assert(condition, "[" + self.module + "]", message);
    };
};

// Create a singleton instance for the module
Alt.UnifiedDataSearch.Helpers.logger = new Alt.UnifiedDataSearch.Helpers.DebugLogger(
    "UnifiedSearch",
    false // Default to disabled, enable via localStorage
);