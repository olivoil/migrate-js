# migrate

  A flexible migration tool for node usable both from the cli and programmatically.
  It makes it easy to customize where to store state, and what template to use for migrations.

## Installation

    $ npm install migrate-js

## Command-line use

```
  Usage: migrate-js [options] [command]

  Options:

     -h, --help                  display this help menu
     -d, --migrations-dir <path> set the directory where migrations are created (default: ./migrations)
     -s, --state-manager  <name> set state manager module to store state (default: json)
     -t, --template       <name> set template module to create new migrations with (default: simple)
     
  Commands:

     down            rollback all migrations
     up              execute all migrations (the default command)
     create [title]  create a new migration file with optional [title]
```

## Programmatic use

See the examples folder for more, or check [this live example](https://runkit.com/olivoil/migrate-js).

```javascript
const Migrate = require("migrate");
const mysql = require("mysql");

const db = mysql.createConnection(/* insert your connection params */);

const migrate = new Migrate({
    stateManager: "mysql",
    migrationsDirectory: process.join(__dirname, "migrations"),
    db,
});

migrate.up().then(() => {
  console.log(`Successfully ran migrations`);
  db.end();
}).catch((err) => {
  db.end();
  throw err;
});
```
