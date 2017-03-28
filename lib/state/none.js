'use strict';

/**
 * Expose `NoopStateManager`.
 */
 
exports = module.exports = class NoopStateManager {
    executed() {
        return Promise.resolve([]);
    }
    
    logMigration() {
        return Promise.resolve();
    }
    
    unlogMigration() {
        return Promise.resolve();
    }
};
