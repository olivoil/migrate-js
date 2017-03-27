'use strict';

/**
 * Expose `MysqlStateManager`.
 */
 
exports = module.exports = MysqlStateManager;

class MysqlStateManager {
    
    constructor(options) {
        const opts = options || {};
        
        if (!opts.db) {
            throw new Error(`MysqlStateManager requires a mysql connection set as the "db" option.

This object should expose a "query" function that accepts 2 arguments:
   - an object of type { sql: <String> }
   - a callback of type callback(<Error>)

If you are using the package "github.com/mysqljs/mysql", then set the "db" argument
to the return value of "mysql.createConnection()".`);
        }
        this.db = opts.db;
        this.tableName = opts.tableName || "migrations";
        this.columnName = opts.columnName || "file";
    }
    
    /**
     * Create table for storing migrations state if it does not exist.
     */
     
    sync() {
        return new Promise((resolve, reject) => {
            this.db.query({
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
                resolve();
            });
        });
    }
    
    /**
     * Query all executed migration names.
     */
     
    executed() {
        return this.sync().then(() => {
            this.db.query({
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
        return this.sync().then(() => {
            this.db.query({
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
        return this.sync().then(() => {
            this.db.query({
                sql: `UPDATE ${this.tableName} SET deleted_at = ? WHERE (${this.columnName} = ?);`,
                values: [new Date(), migration.file],
            }, (err) => {
                if (err) return Promise.reject(err);
                Promise.resolve();
            });
        });
    }
}
