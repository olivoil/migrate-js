# migrate

  Migration tool for node

## Installation

    $ npm install migrate-js

## Usage

```
Usage: migrate-js [options] [command]

Options:

   --migrations-dir <path>  set the location of migration files
   --state-manager <name>   set state storage method ('mysql' or argument to 'require()')
   --template <name>        set path to template file to use for new migrations

Commands:

   down             migrate down
   up               migrate up (the default action)
   create [title]   create a new migration file with optional [title]

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