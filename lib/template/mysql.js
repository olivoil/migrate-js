'use strict';

const path = require("path");
const fs = require("fs");
const slice = Array.prototype.slice;

function defaultWriter(filePath, fileContent) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
}

function template(strings /* , ...keys */) {
  const keys = slice.call(arguments, 1);
  
  return (function(/* ...values */) {
    const values = slice.call(arguments);
    
    var dict = values[values.length - 1] || {};
    var result = [strings[0]];
    
    keys.forEach(function(key, i) {
      var value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    
    return result.join("");
  });
}

const jsTemplate = template`"use strict";

const fs = require("fs");
const path = require("path");

function getDB(context) {
  const ctx = context || {};
  
  if (!ctx.mysql) {
    throw new Error('A mysql migration requires a "mysql" option to be set. The value of this option should be either a mysql connection, or the arguments to create a mysql connection with "mysql.createConnection()".');
  }
  
  if (typeof ctx.mysql.query === "function") {
    retrun ctx.mysql;
  }
  else {
    return require("mysql").createConnection(Object.assign({}, ctx.mysql || {}, { multipleStatements: true }));
  }
}

exports.up = function(ctx) {
  const upFilePath = "${"upFile"}";
  const db = getDB(ctx);
  
  const readSql = () => {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, upFilePath), { encoding: "utf-8" }, (err, data) => {
    		if (err) return reject(err);
    		resolve(data);
      });
    });
  }
  
  const execSql = (sql) => {
  	db.query(sql, (err, res) => {
  	  if (err) return Promise.reject(err);
  	  return Promise.resolve(res);
  	});
  }
  
  return readSql().then(execSql);
};

exports.down = function(ctx) {
  const downFilePath = "${"downFile"}";
  const db = getDB(ctx);
  
  const readSql = () => {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, downFilePath), { encoding: "utf-8" }, (err, data) => {
    		if (err) return reject(err);
    		resolve(data);
      });
    });
  }
  
  const execSql = (sql) => {
  	db.query(sql, (err, res) => {
  	  if (err) return Promise.reject(err);
  	  return Promise.resolve(res);
  	});
  }
  
  return readSql().then(execSql);
};
  
`;

/**
 * Escape the given `str`.
 */
 
function escape(str) {
  return str.replace(/\s+/g, "-");
}

/**
 * create the files for a new migration.
 * 
 * @params {String} dir absolute directory path
 * @params {String} title of the migration
 * @returns {Promise<Array<string>>} paths of the files that were written to disk
 */
 
exports = module.exports = class SqlTemplate {
  
  constructor(context) {
    const ctx = context || {};
    this.dir = ctx.migrationsDirectory || path.join(process.cwd(), "migrations");
  }
  
  /**
   * create the directory for migration files.
   */
   
  sync() {
    const createDir = () => {
      return new Promise((resolve, reject) => {
        fs.mkdir(this.dir, "774", (err) => {
          if (err) {
            if (err.code === "EEXIST") {
              return resolve();
            }
            return reject(err);
          }
          
          return resolve();
        });
      });
    }
    
    const createSubdir = () => {
      return new Promise((resolve, reject) => {
        fs.mkdir(path.join(this.dir, "sqls"), "774", (err) => {
          if (err) {
            if (err.code === "EEXIST") {
              return resolve();
            }
            return reject(err);
          }
          
          return resolve();
        });
      });
    }
    
    return createDir().then(createSubdir);
  }
  
  /**
   * create the files for a new migration.
   * 
   * @params {String} title of the migration
   * @params {Function} writer. Useful to test without writing to a file
   * @returns {Promise<Array<string>>} paths of the files that were written to disk
   */
  
  create(title, writer) {
    const now = Date.now();
    
    let t = title;
    if (Array.isArray(t)) t = t.join(" ");
    const fileName = t ? `${now}-${escape(t)}` : `${now}`;
    
    // file paths
    const jsFilePath = path.join(this.dir, `${fileName}.js`);
    const upFile = `./sqls/${fileName}-up.sql`;
    const downFile = `./sqls/${fileName}-down.sql`;
    
    // content
    const js = jsTemplate({ upFile, downFile });
    const sql = "/* Replace with your SQL commands */";
    
    // write to disk
    const write = writer || defaultWriter;
    return this.sync().then(() => {
      return Promise.all([
        write(jsFilePath, js),
        write(path.join(this.dir, upFile), sql),
        write(path.join(this.dir, downFile), sql),
      ]);
    });
  }
};
