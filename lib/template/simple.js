'use strict';

const path = require("path");
const fs = require("fs");

function defaultWriter(filePath, fileContent) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
}

const js = `"use strict";

exports.up = function() {
  // write your code here, return a Promise
  
  return new Promise((resolve, reject) => {
    // ...
  });
};

exports.down = function() {
  // write your code here, return a Promise
  
  return new Promise((resolve, reject) => {
    // ...
  });
};
  
`;

/**
 * Escape the given `str`.
 */
 
function escape(str) {
  return str.replace(/\s+/g, "-");
}

exports = module.exports = class Simple {
  
  constructor(context) {
    const ctx = context || {};
    this.dir = ctx.migrationsDirectory || path.join(process.cwd(), "migrations");
  }
  
  /**
   * create the directory for migration files.
   */
   
  sync() {
    return new Promise((resolve, reject) => {
      fs.mkdir(this.dir, "774", (err) => {
        if (err) {
          if (err.code === "EEXIST") {
            return resolve();
          }
          return reject(err);
        }
        
        resolve();
      });
    });
  }
  
  /**
   * create the files for a new migration.
   * 
   * @params {String | Array<String>} title of the migration
   * @params {Function} writer. Useful to test without writing to a file
   * @returns {Promise<Array<string>>} paths of the files that were written to disk
   */
   
  create(title, writer) {
    let t = title;
    if (Array.isArray(t)) t = t.join(" ");
    
    const now = Date.now();
    const fileName = t ? `${now}-${escape(t)}` : `${now}`;
    
    const jsFilePath = path.join(this.dir, `${fileName}.js`);
    
    // write to disk
    const write = writer || defaultWriter;
    
    return this.sync().then(() => {
      return write(jsFilePath, js).then((filePath) => {
        return [filePath];
      });
    });
  }
};
