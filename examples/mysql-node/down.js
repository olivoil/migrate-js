#!/usr/bin/env node

const Migrate = require("../../");

function log(key, msg) {
  console.log("  \x1B[90m%s :\x1B[0m \x1B[36m%s\x1B[0m", key, msg);
}

const migrate = new Migrate({
    stateManager: "mysql",
    mysql: {
        host: "localhost",
        database: "migratejs",
        user: "migratejs",
        multipleStatements: true,
    },
});

migrate.on("migration", (migration, direction) => {
    log(direction, migration.title);
});

migrate.down().then(() => {
    log("migration", "done");
    process.exit(0);
}).catch((err) => {
    log("error", err);
    process.exit(1);
});