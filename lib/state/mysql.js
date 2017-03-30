'use strict';

/**
 * Expose `MysqlStateManager`.
 */
 
exports = module.exports = class MysqlStateManager {
    
    constructor(options) {
        const opts = options || {};
        
        if (!opts.mysql) {
            throw new Error(`MysqlStateManager requires a "mysql" option to be set. The value of the db option should be either a mysql connection,  or the arguments to create a mysql connection with "mysql.createConnection()".`);
        }
        this.db = opts.mysql;
        this.tableName = opts.tableName || "migrations";
        this.columnName = opts.columnName || "title";
    }
    
    /**
     * generate sync statement.
     */
     
    sync() {
        let db = this.db;
        let mustClose = false;
        
        if (typeof db.query !== "function") {
            db = require("mysql").createConnection(Object.assign({}, db || {}, { multipleStatements: true }));
            mustClose = true;
        }
        
        return new Promise((resolve, reject) => {
            db.query({
                sql: `CREATE TABLE IF NOT EXISTS ${this.tableName} (
                        id MEDIUMINT NOT NULL AUTO_INCREMENT,
                        ${this.columnName} VARCHAR(255) NOT NULL,
                        run_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (id),
                        INDEX (${this.columnName})
                      );`,
            }, (err) => {
                if (err) return reject(err);
                resolve({ db, mustClose });
            });
        });
    }
    
    /**
     * Query all executed migration names.
     */
     
    executed() {
        return this.sync().then((res) => {
            return new Promise((resolve, reject) => {
                res.db.query({
                    sql: `SELECT * FROM ${this.tableName} ORDER BY run_at ASC;`,
                }, (err, rows) => {
                    if (res.mustClose) res.db.end();
                    if (err) return reject(err);
                    return resolve((rows || []).map((row) => row[this.columnName]));
                });
            });
        });
    }
    
    /**
     * Save a migration as executed.
     */
     
    logMigration(migration) {
        return this.sync().then((res) => {
            return new Promise((resolve, reject) => {
                res.db.query({
                    sql: `INSERT INTO ${this.tableName} (${this.columnName}) VALUES (?);`,
                    values: [migration.title],
                }, (err) => {
                    if (res.mustClose) res.db.end();
                    if (err) return reject(err);
                    return resolve();
                });
            });
        });
    }
    
    /**
     * Remove a migration so that it becomes pending.
     */
     
    unlogMigration(migration) {
        return this.sync().then((res) => {
            return new Promise((resolve, reject) => {
                res.db.query({
                    sql: `DELETE FROM ${this.tableName} WHERE (${this.columnName} = ?);`,
                    values: [migration.title],
                }, (err) => {
                    if (res.mustClose) res.db.end();
                    if (err) return reject(err);
                    return resolve();
                });
            });
        });
    }
};
