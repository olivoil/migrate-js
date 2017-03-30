#!/usr/bin/env node

const Migrate = require("../../");
const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    database: "migratejs",
    user: "migratejs",
    multipleStatements: true,
});

function log(key, msg) {
  console.log("  \x1B[90m%s :\x1B[0m \x1B[36m%s\x1B[0m", key, msg);
}

const migrate = new Migrate({
    stateManager: "mysql",
    mysql: db,
});

migrate.on("migration", (migration, direction) => {
    log(direction, migration.title);
});

migrate.up().then(() => {
    log("migration", "done");
    process.exit(0);
}).catch((err) => {
    log("error", err);
    process.exit(1);
});
