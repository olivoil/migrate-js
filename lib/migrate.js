'use strict';

const path = require("path");
const fs = require("fs");
const Migration = require("./migration");

const defaultTemplates = ["sql"];
const defaultStateManagers = ["mysql"];

/**
 * default migration loader.
 * load files from disk.
 */
 
function defaultMigrationLoader(dir) {
    let set = new Set;
    
    return new Promise((resolve, reject) => {
        fs.readdir(dir, function(err, files) {
            if (err) return reject(err);
            
            const migrationFiles = files.filter((file) => file.match(/^\d+.*\.js$/)).sort();
            
            migrationFiles.forEach((file) => {
                let mod;
                try {
                    mod = require(path.join(dir, file));
                }
                catch (err) {
                    return reject(err);
                }
                
                set = set.addMigration(file, mod.up, mod.down);
            });
            
            resolve(set);
        });
    });
}


/**
 * Expose `Migrate`.
 */
 
exports = module.exports = class Migrate {
    
    constructor(options) {
        const opts = options || {};
        
        this.setStateManager(opts.stateManager || "none");
        this.migrationsDirectory = opts.migrationsDirectory || path.resolve(process.cwd(), "migrations");
        this.context = opts;
    }
    
    /**
     * get/set the state manager.
     * 
     * @params {String | Function} name, module name, or function to use as a state manager
     */
     
    setStateManager(manager) {
        if (typeof manager === "string") {
            if (!defaultStateManagers.indexOf(manager)) {
                const StateManager = require(`./state/${manager}`);
                this.stateManager = new StateManager(this.context);
                return Promise.resolve(this.stateManager);
            }
            
            try {
                const StateManager = require(manager);
                this.stateManager = new StateManager(this.context);
                return Promise.resolve(this.stateManager);
            }
            catch (err) {
                return Promise.reject("invalid argument manager, could not find corresponding module");
            }
        }
        
        if (typeof manager === "function") {
            this.stateManager = new manager(this.context);
            return Promise.resolve(this.stateManager);
        }
        
        return Promise.reject("invalid argument manager, should be a string or a function");
    }
    
    /**
     * create a new migration.
     * 
     * @params {String} name of the migration
     * @params {String | Function} name, module name, or function to use for the template
     * @return {Promise<void>}
     */
     
    create(name, template){ 
        if (typeof name !== "string") {
            return Promise.reject("invalid argument name, should be a string");
        }
        
        let tmpl;
        if (typeof template === "string") {
            if (~defaultTemplates.indexOf(template)) {
                const Template = require(`./template/${template}`);
                tmpl = new Template(this.context);
            }
            else {
                try {
                    const Template = require(template);
                    tmpl = new Template(this.context);
                }
                catch (e) {
                    return Promise.reject("invalid argument template, could not find corresponding module");
                }
            }
        }
        
        if (typeof template === "function") {
            tmpl = new template(this.context);
        }
        
        if (!tmpl) {
            const Template = require("./template/simple");
            tmpl = new Template(this.context);
        }
        
        return tmpl.create(name);
    }
    
    /**
     * run migrations.
     * 
     * @params {Array<*>} context the `up` function of each migration will be run in
     * @return {Promise<*>}
     */
     
    up() {
        return this.pending().then((set) => {
            set.on("up", (migration) => {
                this.stateManager.logMigration(migration);
            });
            
            set.on("up", (migration) => {
                this.emit("migration", migration, "up");
            });
            
            return set.up(this.context);
        });
    }
    
    /**
     * rollback migrations.
     * 
     * @params {Array<*>} context the `down` function of each migration will be run in
     * @return {Promise<*>}
     */
     
    down() {
        return this.executed().then((set) => {
            set.on("down", (migration) => {
                this.stateManager.unlogMigration(migration);
            });
            
            set.on("down", (migration) => {
                this.emit("migration", migration, "down");
            });
            
            return set.down(this.context);
        });
    }
    
    /**
     * load migrations defined in `migrationsDirectory`.
     * 
     * @params {Function => Promise<Set>} loader useful to test without actual files
     * @returns {Promise<Set>} set of migrations
     */
     
    defined(loader) {
        const dir = this.migrationsDirectory;
        const load = typeof loader == "function" ? loader : defaultMigrationLoader;
        return load(dir);
    };
    
    /**
     * load pending migrations.
     * 
     * @params {Object} ctx
     * @returns {Promise<Set>} set containing only pending migrations
     */
     
    pending() {
        return Promise.all([
            this.stateManager.executed(),
            this.defined(),
        ]).then((res) => {
            const executedTitles = res[0];
            const migrationSet = res[1];
            
            // remove migrations already executed.
            return migrationSet.filter((migration) => {
                return executedTitles.indexOf(migration.title) === -1;
            });
        });
    }
    
    /**
     * load executed migrations.
     * 
     * @params {Object} ctx
     * @returns {Promise<Set>} set containing only executed migrations
     */
     
    executed() {
        return Promise.all([
            this.stateManager.executed(),
            this.defined(),
        ]).then((res) => {
            const executedTitles = res[0];
            const migrationSet = res[1];
            
            // remove migrations not executed yet.
            return migrationSet.filter((migration) => {
                return executedTitles.indexOf(migration.title) > -1;
            });
        });
    }
};