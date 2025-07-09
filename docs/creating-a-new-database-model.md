# Creating a new database model <!-- omit in toc -->

<!-- Table of contents created using "Markdown All in One" VSCode extension. -->
<!-- Command palette: "> Markdown All in One: Update Table of Contents" -->

## Contents <!-- omit in toc -->

- [Introduction](#introduction)
- [The data class](#the-data-class)
- [The model class](#the-model-class)
  - [The generics](#the-generics)
  - [The schema](#the-schema)
  - [The `deserialize` method](#the-deserialize-method)
  - [The `serialize` and `getId` methods](#the-serialize-and-getid-methods)
  - [The instance](#the-instance)
- [Limitations](#limitations)

## Introduction

Every database model consists of two classes, a data class and a model class.

## The data class

The data class is a plain Typescript class which stores whatever it is we wish to store! For example:

```ts
export class Crayon {
  constructor(
    readonly id: string,
    readonly color: "red" | "yellow" | "green" | "blue",
    readonly usesLeft: number,
    readonly drawings: string[],
  ) {}
}
```

This is how most of your codebase will interact with `Crayon` data. Add whatever methods, properties, or functionality you like here. Really, this has nothing to do with the database, it's simply data.

## The model class

The model class, on the other hand, is very much a database-related class. It's responsible for defining how the data class is converted into a format which can be stored in the database. MongoDB essentially stores JSON, so put simply, it serializes (converts to JSON) and deserializes (parses from JSON) the data.

While data classes can live wherever makes the most sense, I recommend putting all model class files together in the same directory (e.g. `src/models/`) so you have easy visibility into the list of collections which exist in your database.

The full class looks something like this:

```ts
export class CrayonModel extends DatabaseModel<
  Crayon,
  string,
  z.input<typeof CrayonModel.schema>
> {
  static instance = new CrayonModel();

  private static schema = z.object({
    color: z.enum(["red", "yellow", "green", "blue"]),
    usesLeft: z.number(),
    drawings: z.string().array(),
  });

  private constructor() {
    super("crayons");
  }

  getId(item: Crayon): string {
    return item.id;
  }

  serialize(item: Crayon): z.input<typeof CrayonModel.schema> {
    return {
      color: item.color,
      usesLeft: item.usesLeft,
      drawings: item.drawings,
    };
  }

  deserialize(id: string, item: unknown): Crayon {
    const parsed = CrayonModel.schema.parse(item);
    return new Crayon(id, parsed.color, parsed.usesLeft, parsed.drawings);
  }
}
```

### The generics

The first thing you'll notice is the three generic types.

```ts
export class CrayonModel extends DatabaseModel<
  Crayon,                            // <-- This
  string,                            // <-- This
  z.input<typeof CrayonModel.schema> // <-- And this
>
```

What you choose here decides what certain methods (e.g. `serialize`) take as input and/or are required to return.

In order, they are:

- The name of your data model class, so `Crayon` in the example.
- The primary key type, which must be either `string` or `number`.
- The type of the serialized data (this one requires some explaining 😅).

### The schema

The `z.input<typeof CrayonModel.schema>` generic type is referring to this part:

```ts
private static schema = z.object({
  color: z.enum(["red", "yellow", "green", "blue"]),
  usesLeft: z.number(),
  drawings: z.string().array(),
});
```

This is a [Zod](https://zod.dev/) schema. Zod is a library that lets us take any unknown value in Typescript and validate that it follows a certain shape. In our example we check that it's an object with `color`, `usesLeft`, and `drawings` fields. We check that `color` is one of the four supported values, `usesLeft` is a number, and `drawings` is an array of strings. (Note that using Zod isn't required, you could use whichever validation tool you like, or even write the deserialization logic by hand if you wish.)

You'll notice these match the fields in our `Crayon` class, except we're missing `id`. This is intentional (more on that soon)!

### The `deserialize` method

Deserializing means parsing a raw JSON value, and converting it to our data class, `Crayon`. That's exactly what `deserialize` is doing:

```ts
deserialize(id: string, item: unknown): Crayon {
  const parsed = CrayonModel.schema.parse(item);
  return new Crayon(id, parsed.color, parsed.usesLeft, parsed.drawings);
}
```

When we pull a record from the database, we check the raw value we retrieve against our Zod schema before creating the `Crayon` class. Notice that the `id` is passed in separately to the `item` that we parse.

### The `serialize` and `getId` methods

Serialize is the opposite, it takes a `Crayon` and converts it to raw JSON.

```ts
serialize(item: Crayon): z.input<typeof CrayonModel.schema> {
  return {
    color: item.color,
    usesLeft: item.usesLeft,
    drawings: item.drawings,
  };
}
```

(In lots of cases, there's not much to do, but for example, if you were dealing with dates, here's where you'd convert them to ISO strings like `2024-12-31T18:17:38Z` or whatever.)

Once again we've omitted the ID. The reason for doing this is because IDs require special treatment, and different database systems will represent the ID differently. For example, MongoDB requires the ID to be named `_id`, and PostgreSQL (if it were to be supported one day) requires the ID to be labelled with `PRIMARY KEY`.

So, for that reason, there's a separate little `getId()` method:

```ts
getId(item: Crayon): string {
  return item.id;
}
```

Each database system can do whatever it likes with that value, and the model class can be blissfully ignorant!

### The instance

The only thing left to mention is how this class is used. You'll notice it doesn't have any state at all, so we'd never need to instantiate multiple copies of it, that's why it's a singleton.

To enforce this, the constructor is private:

```ts
private constructor() {
  super("crayons");
}
```

(The constructor also takes the name of the model `"crayons"`. That becomes the table/collection name.)

The only place which should ever call the constructor is the static `instance` constant:

```ts
static instance = new CrayonModel();
```

Finally, you might like to add a constant somewhere, like so:

```ts
export const CRAYONS = CrayonModel.instance;
```

If you have multiple models, why not put these constants in the same file? That way, you'll have a central repository of all the database models in your app. Having the constants also makes them nicer to import and use, i.e. you can do `db.of(CRAYONS)` instead of `db.of(CrayonModel.instance)`.

## Limitations

- There's no abilty to define composite or custom primary keys at the moment, the ID type must be either `string` or `number`.
