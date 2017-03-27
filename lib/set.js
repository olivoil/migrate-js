'use strict';

const Migration = require("./migration");
const EventEmitter = require("events");

/**
 * Expose `Set`.
 */

exports = module.exports = class Set extends EventEmitter {
    
    constructor() {
        super();
        
        this.migrations = [];
    }
    
    /**
     * Run migrations up
     */
     
    up(context) {
        const migrations = [];
        
        this.migrations.forEach((migration) => {
            migrations.push(migration.up().then(() => {
                this.emit("up", migration);
            }));
        });
        
        return Promise.all(migrations);
    }
    
    /**
     * Run migrations down
     */
 
    down(context) {
        const migrations = [];
        
        this.migrations.reverse().forEach((migration) => {
            migrations.push(migration.down().then(() => {
                this.emit("down", migration);
            }));
        });
        
        return Promise.all(migrations);
    }
    
    /**
     * add a migration.
     */
     
    addMigration(title, up, down) {
        const set = new Set;
        set.migrations = this.migrations.concat(new Migration(title, up, down));
        return set;
    }
    
    /**
     * Filter migrations.
     */
     
    filter(predicate) {
        const set = new Set();
        set.migrations = this.migrations.filter(predicate);
        return set;
    }
};
