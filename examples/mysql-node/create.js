#!/usr/bin/env node

const Migrate = require("../../");
const migrate = new Migrate({});

migrate.create("add users table", "mysql");
migrate.create("create blog posts table", "mysql");