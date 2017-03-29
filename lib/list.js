'use strict';

const Migration = require("./migration");
const EventEmitter = require("events");

/**
 * Expose `Set`.
 */

exports = module.exports = class List extends EventEmitter {
    
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
            migrations.push(migration.up(context).then(() => {
                this.emit("up", migration);
            });
        });
        
        return Promise.all(migrations);
    }
    
    /**
     * Run migrations down
     */
 
    down(context) {
        const migrations = [];
        
        this.migrations.reverse().forEach((migration) => {
            migrations.push(migration.down(context).then(() => {
                this.emit("down", migration);
            });
        });
        
        return Promise.all(migrations);
    }
    
    /**
     * add a migration.
     */
     
    addMigration(title, up, down) {
        const list = new List;
        list.migrations = this.migrations.concat(new Migration(title, up, down));
        return list;
    }
    
    /**
     * Filter migrations.
     */
     
    filter(predicate) {
        const list = new List();
        list.migrations = this.migrations.filter(predicate);
        return list;
    }
};
