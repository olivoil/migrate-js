'use strict';

/**
 * Expose `NoopStateManager`.
 */
 
exports = module.exports = NoopStateManager;

class NoopStateManager {
    
    executed() {
        return Promise.resolve();
    }
    
    logMigration() {
        return Promise.resolve();
    }
    
    unlogMigration() {
        return Promise.resolve();
    }
}
