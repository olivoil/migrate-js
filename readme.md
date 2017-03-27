# migrate

  Migration tool for node

## Installation

    $ npm install migrate-js

## Usage

```
  Usage: migrate-js [options] [command]

  Options:

     -h, --help                  display this help menu
     -d, --migrations-dir <path> set the directory where migrations are created (default: ./migrations)
     -s, --state-manager  <name> set state manager module to store state (default: none)
     -t, --template       <name> set template module to create new migrations with (default: simple)
     
  Commands:

     down            rollback all migrations
     up              execute all migrations (the default command)
     create [title]  create a new migration file with optional [title]
```

## Usage

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

See the examples folder for more.