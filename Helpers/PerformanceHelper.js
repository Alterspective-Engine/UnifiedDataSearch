/**
 * PerformanceHelper.js
 * 
 * Performance optimization utilities for UnifiedDataSearch module.
 * Provides memoization, caching, throttling, and performance monitoring.
 * 
 * @namespace Alt.UnifiedDataSearch.Helpers
 * @class PerformanceHelper
 * @version 1.0.0
 * 
 * Features:
 * - Function memoization
 * - Result caching with TTL
 * - Request throttling and debouncing
 * - Performance metrics collection
 */

namespace("Alt.UnifiedDataSearch.Helpers");

/**
 * PerformanceHelper Constructor
 */
Alt.UnifiedDataSearch.Helpers.PerformanceHelper = function() {
    var self = this;
    
    // Cache storage
    self.cache = {};
    self.cacheTimestamps = {};
    
    // Performance metrics
    self.metrics = {
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageResponseTime: 0,
        totalResponseTime: 0
    };
    
    /**
     * Memoize a function for performance
     * @param {Function} fn - Function to memoize
     * @param {Function} keyGenerator - Optional function to generate cache key
     * @returns {Function} Memoized function
     */
    self.memoize = function(fn, keyGenerator) {
        var cache = {};
        
        return function() {
            var key;
            if (keyGenerator) {
                key = keyGenerator.apply(this, arguments);
            } else {
                key = JSON.stringify(arguments);
            }
            
            if (cache.hasOwnProperty(key)) {
                self.metrics.cacheHits++;
                return cache[key];
            }
            
            self.metrics.cacheMisses++;
            var result = fn.apply(this, arguments);
            cache[key] = result;
            return result;
        };
    };
    
    /**
     * Cache a value with TTL (time to live)
     * @param {String} key - Cache key
     * @param {*} value - Value to cache
     * @param {Number} ttl - Time to live in milliseconds
     */
    self.setCache = function(key, value, ttl) {
        self.cache[key] = value;
        self.cacheTimestamps[key] = Date.now() + (ttl || 60000); // Default 1 minute
    };
    
    /**
     * Get a cached value
     * @param {String} key - Cache key
     * @returns {*} Cached value or null if expired/missing
     */
    self.getCache = function(key) {
        if (!self.cache.hasOwnProperty(key)) {
            return null;
        }
        
        // Check if expired
        if (self.cacheTimestamps[key] && Date.now() > self.cacheTimestamps[key]) {
            delete self.cache[key];
            delete self.cacheTimestamps[key];
            return null;
        }
        
        return self.cache[key];
    };
    
    /**
     * Clear cache
     * @param {String} key - Optional specific key to clear
     */
    self.clearCache = function(key) {
        if (key) {
            delete self.cache[key];
            delete self.cacheTimestamps[key];
        } else {
            self.cache = {};
            self.cacheTimestamps = {};
        }
    };
    
    /**
     * Throttle a function (limit execution rate)
     * @param {Function} fn - Function to throttle
     * @param {Number} limit - Minimum time between calls in ms
     * @returns {Function} Throttled function
     */
    self.throttle = function(fn, limit) {
        var inThrottle;
        var lastResult;
        
        return function() {
            var args = arguments;
            var context = this;
            
            if (!inThrottle) {
                lastResult = fn.apply(context, args);
                inThrottle = true;
                
                setTimeout(function() {
                    inThrottle = false;
                }, limit);
            }
            
            return lastResult;
        };
    };
    
    /**
     * Debounce a function (delay execution until idle)
     * @param {Function} fn - Function to debounce
     * @param {Number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    self.debounce = function(fn, delay) {
        var timeoutId;
        
        return function() {
            var args = arguments;
            var context = this;
            
            clearTimeout(timeoutId);
            
            timeoutId = setTimeout(function() {
                fn.apply(context, args);
            }, delay);
        };
    };
    
    /**
     * Create a retry wrapper for functions
     * @param {Function} fn - Function to wrap
     * @param {Number} maxAttempts - Maximum retry attempts
     * @param {Number} delay - Delay between retries in ms
     * @returns {Function} Function with retry logic
     */
    self.withRetry = function(fn, maxAttempts, delay) {
        maxAttempts = maxAttempts || 3;
        delay = delay || 1000;
        
        return function() {
            var args = arguments;
            var context = this;
            var deferred = $.Deferred();
            var attempt = 0;
            
            function tryCall() {
                attempt++;
                
                $.when(fn.apply(context, args))
                    .done(function(result) {
                        deferred.resolve(result);
                    })
                    .fail(function(error) {
                        if (attempt < maxAttempts) {
                            // Exponential backoff
                            setTimeout(tryCall, delay * Math.pow(2, attempt - 1));
                        } else {
                            deferred.reject(error);
                        }
                    });
            }
            
            tryCall();
            return deferred.promise();
        };
    };
    
    /**
     * Batch multiple requests into one
     * @param {Function} batchFn - Function that handles batched requests
     * @param {Number} batchSize - Maximum batch size
     * @param {Number} batchDelay - Delay before executing batch
     * @returns {Function} Function that queues requests for batching
     */
    self.batcher = function(batchFn, batchSize, batchDelay) {
        var queue = [];
        var timeoutId;
        batchSize = batchSize || 10;
        batchDelay = batchDelay || 100;
        
        function executeBatch() {
            if (queue.length === 0) return;
            
            var batch = queue.splice(0, batchSize);
            var items = batch.map(function(item) { return item.data; });
            
            batchFn(items).then(function(results) {
                batch.forEach(function(item, index) {
                    item.deferred.resolve(results[index]);
                });
            }).fail(function(error) {
                batch.forEach(function(item) {
                    item.deferred.reject(error);
                });
            });
            
            // Process remaining items
            if (queue.length > 0) {
                timeoutId = setTimeout(executeBatch, batchDelay);
            }
        }
        
        return function(data) {
            var deferred = $.Deferred();
            
            queue.push({
                data: data,
                deferred: deferred
            });
            
            clearTimeout(timeoutId);
            
            if (queue.length >= batchSize) {
                executeBatch();
            } else {
                timeoutId = setTimeout(executeBatch, batchDelay);
            }
            
            return deferred.promise();
        };
    };
    
    /**
     * Track API call performance
     * @param {String} operation - Operation name
     * @param {Function} fn - Function to track
     * @returns {Function} Tracked function
     */
    self.trackPerformance = function(operation, fn) {
        return function() {
            var startTime = performance.now();
            var args = arguments;
            var context = this;
            
            self.metrics.apiCalls++;
            
            var result = fn.apply(context, args);
            
            // Handle promises
            if (result && typeof result.done === 'function') {
                result.always(function() {
                    var duration = performance.now() - startTime;
                    self.updateMetrics(operation, duration);
                });
            } else {
                var duration = performance.now() - startTime;
                self.updateMetrics(operation, duration);
            }
            
            return result;
        };
    };
    
    /**
     * Update performance metrics
     * @private
     */
    self.updateMetrics = function(operation, duration) {
        self.metrics.totalResponseTime += duration;
        self.metrics.averageResponseTime = 
            self.metrics.totalResponseTime / self.metrics.apiCalls;
        
        // Log slow operations
        if (duration > 1000) {
            console.warn("[Performance]", operation, "took", duration.toFixed(2) + "ms");
        }
    };
    
    /**
     * Get performance report
     * @returns {Object} Performance metrics
     */
    self.getMetrics = function() {
        return {
            apiCalls: self.metrics.apiCalls,
            cacheHits: self.metrics.cacheHits,
            cacheMisses: self.metrics.cacheMisses,
            cacheHitRate: self.metrics.cacheHits / 
                         (self.metrics.cacheHits + self.metrics.cacheMisses) || 0,
            averageResponseTime: self.metrics.averageResponseTime.toFixed(2) + "ms",
            totalApiTime: self.metrics.totalResponseTime.toFixed(2) + "ms"
        };
    };
    
    /**
     * Reset metrics
     */
    self.resetMetrics = function() {
        self.metrics = {
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };
    };
};

// Create singleton instance
Alt.UnifiedDataSearch.Helpers.performanceHelper = new Alt.UnifiedDataSearch.Helpers.PerformanceHelper();