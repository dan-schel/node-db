# Querying the database <!-- omit in toc -->

<!-- Table of contents created using "Markdown All in One" VSCode extension. -->
<!-- Command palette: "> Markdown All in One: Update Table of Contents" -->

## Contents <!-- omit in toc -->

- [Introduction](#introduction)
- [Creating a new record](#creating-a-new-record)
- [Retrieve record by ID](#retrieve-record-by-id)
- [Update a record](#update-a-record)
- [Delete a record](#delete-a-record)
- [Counting records](#counting-records)
- [Searching with conditions](#searching-with-conditions)
- [Sorting and limits](#sorting-and-limits)
- [Syntax for `where`](#syntax-for-where)
  - [Not equal](#not-equal)
  - [Number/date ranges](#numberdate-ranges)
- [Limitations](#limitations)
- [Why?](#why)

## Introduction

All database functions require you to have a `Database` instance (either `InMemoryDatabase` or `MongoDatabase`) and the model you wish to query. "Model" is a synonym for "entity", i.e. what relational databases call a "table" or what MongoDB calls "collection".

(A guide on creating your own database models can be found [here](/docs/creating-a-new-database-model.md).)

```ts
import { CRAYONS } from "src/models";
import { Crayon } from "src/models/crayons";

// See README.md for `createDb` implementation.
const db = await createDb();
```

Note that we've imported both `CRAYONS` and `Crayon`.

- `CRAYONS` is a constant passed to the `db` object to tell it which model to query.
- `Crayon` is the regular Typescript class we'll be persisting/retrieving objects of ([see code](/docs/examples/crayon.ts)).

## Creating a new record

Use `create` to enter a new record into the database:

```ts
const myCrayon = new Crayon("my-red-crayon", "red", 10, []);
await db.of(CRAYONS).create(myCrayon);
```

## Retrieve record by ID

Use `get` to retrieve a record by ID (will return `null` if it doesn't exist):

```ts
const myCrayon: Crayon | null = await db.of(CRAYONS).get("my-red-crayon");
```

Use `require` to throw an error if the record doesn't exist:

```ts
const myCrayon: Crayon = await db.of(CRAYONS).require("my-red-crayon");
```

## Update a record

Use `update` and pass the new record. The existing record with the same ID in the database will be overwritten:

```ts
const myCrayon = new Crayon("my-red-crayon", "red", 8, []);
await db.of(CRAYONS).update(myCrayon);
```

## Delete a record

Use `delete` and pass the ID of the record to delete:

```ts
await db.of(CRAYONS).delete("my-red-crayon");
```

## Counting records

Use `count` to fetch the number of records of this model type:

```ts
const count = await db.of(CRAYONS).count();
```

The `count` method also takes a parameter which can be used to filter out records:

```ts
const count = await db.of(CRAYONS).count({ where: { color: "red" } });
```

(More on this filtering syntax at the [bottom of the page](#syntax-for-where).)

## Searching with conditions

Use `find` to return a list of records matching a filter:

```ts
const results: Crayon[] = await db
  .of(CRAYONS)
  .find({ where: { color: "red" } });
```

Use `first` to return the first record matching a filter (will return `null` if nothing matches):

```ts
const results: Crayon | null = await db
  .of(CRAYONS)
  .first({ where: { color: "red" } });
```

Use `requireFirst` to return the first record matching a filter or throw an error if nothing does:

```ts
const results: Crayon = await db
  .of(CRAYONS)
  .requireFirst({ where: { color: "red" } });
```

Use `requireSingle` to return the record matching a filter, or throw if no records match or multiple records match:

```ts
const results: Crayon = await db
  .of(CRAYONS)
  .requireSingle({ where: { color: "red" } });
```

## Sorting and limits

The `find` method also supports sorting and limiting the number of results:

```ts
const results: Crayon[] = await db.of(CRAYONS).find({
  where: { color: "red" },
  sort: { by: "usesLeft", direction: "desc" },
  limit: 5,
});
```

## Syntax for `where`

### Not equal

```ts
where: {
  color: { not: "red" },
}
```

### Number/date ranges

```ts
where: {
  usesLeft: { gt: 5 },          // Greater than 5.
  usesLeft: { gte: 5 },         // Greater than or equal to 5.
  usesLeft: { lt: 5 },          // Less than 5.
  usesLeft: { lte: 5 },         // Less than or equal to 5.
  usesLeft: { gt: 3, lte: 10 }, // Greater than 3 but less than or equal to 10.
}
```

(These same queries work with dates where `lt` is "earlier than" and `gt` is "later than".)

## Limitations

- While storing objects with embedded fields is supported, you cannot use `where` or `sort` on embedded fields.
  - For example `where: { name: { first: "Dan" } }` doesn't work.
  - This could be added, but would _take effort_.
  - While MongoDB supports these types of queries, other DB engines (e.g. SQL) don't, so ideally they can be avoided.
- No ability for multiple sorting tiers, e.g. "sort by year, then by month, then by date".
- No ability to `skip` records (e.g. for pagination) at the moment.
- No ability to `create` records and have the database assign an ID automatically at the moment.
  - This isn't a problem if using UUIDs, and MongoDB doesn't natively support auto-incrementing IDs anyway.
  - Right now UUIDs are just represented as strings, which is not very efficient. Hoping to fix this sometime in the future.
