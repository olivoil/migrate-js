'use strict';

/**
 * Expose `MysqlStateManager`.
 */
 
exports = module.exports = class MysqlStateManager {
    
    constructor(options) {
        const opts = options || {};
        
        if (!opts.mysql) {
            throw new Error(`MysqlStateManager requires a "mysql" option to be set.
The value of the db option should be either a mysql connection, 
or the arguments to create a mysql connection with "mysql.createConnection()".`);
        }
        this.db = opts.mysql;
        this.tableName = opts.tableName || "migrations";
        this.columnName = opts.columnName || "file";
    }
    
    /**
     * Create table for storing migrations state if it does not exist.
     */
     
    sync() {
        const db = this.db;
        
        if (typeof this.db.query !== "function") {
            db = require("mysql").createConnection(Object.assign({}, this.db || {}, { multipleStatements: true }));
        }
        
        return new Promise((resolve, reject) => {
            db.query({
                sql: `CREATE TABLE IF NOT EXISTS ${this.tableName} (
                        id MEDIUMINT NOT NULL AUTO_INCREMENT,
                        ${this.columnName} TEXT NOT NULL,
                        run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        deleted_at TIMESTAMP NULL,
                        PRIMARY KEY (id),
                        INDEX (${this.columnName})
                      );`,
            }, (err) => {
                if (err) return reject(err);
                resolve(db);
            });
        });
    }
    
    /**
     * Query all executed migration names.
     */
     
    executed() {
        return this.sync().then((db) => {
            db.query({
                sql: `SELECT * FROM ${this.tableName} WHERE (deleted_at IS NULL) ORDER BY run_at ASC`,
            }, (err, rows) => {
                if (err) return Promise.reject(err);
                return Promise.resolve(rows.map((row) => row[this.columnName]));
            });
        });
    }
    
    /**
     * Save a migration as executed.
     */
     
    logMigration(migration) {
        return this.sync().then((db) => {
            db.query({
                sql: `INSERT INTO ${this.tableName} (${this.columnName}) VALUES (?);`,
                values: [migration.file],
            }, (err) => {
                if (err) return Promise.reject(err);
                Promise.resolve();
            });
        });
    }
    
    /**
     * Remove a migration so that it becomes pending.
     */
     
    unlogMigration(migration) {
        return this.sync().then((db) => {
            db.query({
                sql: `UPDATE ${this.tableName} SET deleted_at = ? WHERE (${this.columnName} = ?);`,
                values: [new Date(), migration.file],
            }, (err) => {
                if (err) return Promise.reject(err);
                Promise.resolve();
            });
        });
    }
};
