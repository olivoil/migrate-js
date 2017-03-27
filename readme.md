# migrate

  Migration tool for node

## Installation

    $ npm install nmigrate

## Usage

```
Usage: nmigrate [options] [command]

Options:

   --migrations <path>      set the location of migration files
   --storage <module-name>  set state storage method ('mysql' or argument to 'require()')
   --template <module-name> set path to template file to use for new migrations
   --date-format <format>   set a date format to use for new migration filenames

Commands:

   down   [name]    migrate down till given migration
   up     [name]    migrate up till given migration (the default command)
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