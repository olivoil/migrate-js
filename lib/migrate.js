'use strict';

const path = require("path");
const fs = require("fs");
const EventEmitter = require("events");
const List = require("./list");

const defaultTemplates = ["sql", "simple"];
const defaultStateManagers = ["mysql", "json", "none"];

/**
 * default migration loader.
 * load files from disk.
 */
 
function defaultMigrationLoader(dir) {
    let list = new List;
    
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
                
                list = list.addMigration(file, mod.up, mod.down);
            });
            
            resolve(list);
        });
    });
}


/**
 * Expose `Migrate`.
 */
 
exports = module.exports = class Migrate extends EventEmitter {
    
    constructor(options) {
        super();
        
        const opts = options || {};
        
        this.migrationsDirectory = opts.migrationsDirectory || path.resolve(process.cwd(), "migrations");
        this.context = Object.assign(opts, { migrationsDirectory: this.migrationsDirectory });
        this.setStateManager(opts.stateManager || "json");
    }
    
    /**
     * set the state manager.
     * 
     * @params {String | Function} name, module name, or function to use as a state manager
     */
     
    setStateManager(manager) {
        if (typeof manager === "string") {
            if (defaultStateManagers.indexOf(manager) > -1) {
                const StateManager = require(`./state/${manager}`);
                this.stateManager = new StateManager(this.context);
                return Promise.resolve(this.stateManager);
            }
            
            try {
                const StateManager = require(manager);
                if (!StateManager) return Promise.reject("invalid argument manager, could not find corresponding module");
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
        
        if (!template) {
            template = this.context.template;
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
        return this.pending().then((list) => {
            list.on("up", (migration) => {
                this.stateManager.logMigration(migration);
                this.emit("migration", migration, "up");
            });
            
            return list.up(this.context);
        });
    }
    
    /**
     * rollback migrations.
     * 
     * @params {Array<*>} context the `down` function of each migration will be run in
     * @return {Promise<*>}
     */
     
    down() {
        return this.executed().then((list) => {
            list.on("down", (migration) => {
                this.stateManager.unlogMigration(migration);
                this.emit("migration", migration, "down");
            });
            
            return list.down(this.context);
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
    }
    
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
