# NodeJS Database Library

[![codecov](https://codecov.io/github/dan-schel/node-db/graph/badge.svg?token=UH6IHPDG9W)](https://codecov.io/github/dan-schel/node-db)

Provides a common API for working with MongoDB or an in-memory database, with a migration system and type-safety. This means you can use MongoDB in prod, an in-memory database while unit testing, and whichever you prefer for local development.

## Getting started

Every time your app starts, you'll want to create a database connection, and immediately run the migrations.

```ts
import type { Migration } from "@dan-schel/db";

// Empty to start (see docs/writing-database-migrations.md).
const migrations: Migration[] = [];

const db = createDb();
await db.runMigrations(migrations);
```

The implementation of `createDb()` depends on whether you're using MongoDB or an in-memory database.

### With MongoDB

For MongoDB, you'll need to create a `MongoClient` using the [`mongodb` package](https://www.npmjs.com/package/mongodb) and pass it along to `MongoDatabase`.

```ts
import { MongoDatabase } from "@dan-schel/db";
import { MongoClient } from "mongodb";

function createDb() {
  // The connection string for the MongoDB server.
  const connectionString =
    "mongodb://username:password@localhost:27017/?authMechanism=DEFAULT";

  // Which database within the MongoDB server to use.
  const databaseName = "my-project";

  const client = new MongoClient(connectionString);
  await client.connect();

  return new MongoDatabase(client, databaseName);
}
```

### With an in-memory database

For an in-memory database, things are a little simpler:

```ts
import { InMemoryDatabase } from "@dan-schel/db";

function createDb() {
  return new InMemoryDatabase();
}
```

### Working with data

Now that your connection is established, you'll want to start working with some data:

- [Creating a database model](/docs/creating-a-new-database-model.md)
- [Querying the database](/docs/querying-the-database.md)
- [Writing database migrations](/docs/writing-database-migrations.md)
