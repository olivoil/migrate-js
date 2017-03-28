"use strict";

const path = require("path");
const fs = require("fs");

/**
 * Expose `MysqlStateManager`.
 */
 
exports = module.exports = class JSONStateManager {
    
    constructor(options) {
        const opts = options || {};
        const migrationsDirectory = opts.migrationsDirectory || path.join(process.cwd(), "migrations");
        this.stateFile = opts.stateFile || path.join(migrationsDirectory, "state.json");
    }
    
    /**
     * save state to file.
     */
     
    save(state) {
        fs.writeFileSync(this.stateFile, JSON.stringify(state), "utf8");
    }
    
    /**
     * load state from file.
     */
     
    load() {
        try {
            const json = fs.readFileSync(this.stateFile, "utf8");
            return JSON.parse(json);
        }
        catch (err) {
            if (err.code === "ENOENT") {
                const state = { executed: [] };
                this.save(state);
                return state;
            }
            
            throw err;
        }
    }
    
    /**
     * Query all executed migration names.
     */
     
    executed() {
        return new Promise((resolve, reject) => {
            const state = this.load();
            return resolve(state.executed.map((m) => m.title));
        });
    }
    
    /**
     * Save a migration as executed.
     */
     
    logMigration(migration) {
        return new Promise((resolve, reject) => {
            const m = Object.assign({}, migration, { runAt: new Date });
            const state = this.load();
            state.executed = state.executed.concat(m);
            this.save(state);
            resolve(state);
        });
    }
    
    /**
     * Remove a migration so that it becomes pending.
     */
     
    unlogMigration(migration) {
        return new Promise((resolve, reject) => {
            const state = this.load();
            const migrations = state.executed.filter((m) => m.title === migration.title);
            
            migrations.forEach((m) => {
                const executed = state.executed.concat();
                executed.splice(executed.indexOf(m), 1);
                state.executed = executed;
            });
            
            this.save(state);
            resolve();
        });
    }
};
