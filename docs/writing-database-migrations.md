# Writing database migrations <!-- omit in toc -->

Database migrations are one-off jobs that run before the server starts.

Anytime you've changed a database model (e.g. you've added a new field), you'll probably want to migrate any existing data in the database to the new format. To do so, you should write a database migration, here's how!

<!-- Table of contents created using "Markdown All in One" VSCode extension. -->
<!-- Command palette: "> Markdown All in One: Update Table of Contents" -->

## Contents <!-- omit in toc -->

- [Migrations need two PRs](#migrations-need-two-prs)
  - [Why are two PRs needed?](#why-are-two-prs-needed)
  - [Example of supporting two schemas at once](#example-of-supporting-two-schemas-at-once)
  - [Exceptions to the rule](#exceptions-to-the-rule)
- [Writing a migration](#writing-a-migration)
- [Deleting old migrations](#deleting-old-migrations)

## Migrations need two PRs

The first thing you need to consider when updating a database model is the overall strategy. Most database schema changes can't just occur all at once because of how the code is deployed.

### Why are two PRs needed?

Two PRs (or rather, deployments) are needed if you use a blue-green deployment strategy.

The problem is that when new code is pushed to master, in order to ensure the server is always available, the new server is spun up while the existing one continues to run. The switchover doesn't occur until the new server is completely ready and listening out for web requests. Database migrations are run immediately when the new server starts up, but the migrations aren't instant, and it might do a few other tasks before being ready to listen for web requests. On top of that, it might take a second or two for the cloud provider's systems to notice that the new server is ready, and even once it has and the switchover is complete, there's no guarantee that it'll be able to shut down the old server immediately (it might be in the middle of a task).

That all means there's a period of time where some or all of the migrations have run, but the old server is also still running. We don't want the old server to run into any errors during the switchover, meaning it needs to be compatible with the new data format. Therefore, before you deploy the change which adds the database migration, you need to deploy one which updates the database model to be able to understand both the old schema and new schema simultaneously! Only in your second deployment/PR (which adds the database migration), can you fully commit to the new schema.

### Example of supporting two schemas at once

Writing that first PR might sound tricky, so I thought I'd show a worked example. Imagine we wanted to rename the `color` field on our [Crayon](/docs/examples/crayon.ts) model to `colour` (wild stuff).

#### PR #1 <!-- omit in toc -->

In the first PR, the **only** changes we would need to make are:

```diff
  export class CrayonModel extends DatabaseModel {
    // Simplified to just show schema and deserialize function.

    private static schema = z.object({
-     color: z.enum(["red", "yellow", "green", "blue"]),
+     color: z.enum(["red", "yellow", "green", "blue"]).optional(),
+     colour: z.enum(["red", "yellow", "green", "blue"]).optional(),
      usesLeft: z.number(),
      drawings: z.string().array(),
    });

    deserialize(id: string, item: unknown): Crayon {
      const parsed = CrayonModel.schema.parse(item);

+     const color = parsed.colour ?? parsed.color;
+     if (color == null) {
+       throw new Error('Expected either "colour" or "color" to be defined.');
+     }

-     return new Crayon(id, parsed.color, parsed.usesLeft, parsed.drawings);
+     return new Crayon(id, color, parsed.usesLeft, parsed.drawings);
    }
  }
```

Using `.optional()` for both `color` and `colour` means Zod won't mind if they're missing. The only additional logic we need is to ensure that they aren't **both** missing.

#### PR #2 <!-- omit in toc -->

Then, in the second PR we write our migration (see example below in ["Writing a migration"](#writing-a-migration)), and update the data class to:

```diff
  export class Crayon {
    constructor(
      readonly id: string,
-     readonly color: "red" | "yellow" | "green" | "blue",
+     readonly colour: "red" | "yellow" | "green" | "blue",
      readonly usesLeft: number,
      readonly drawings: string[],
    ) {}
  }
```

In addition, we can now update our model to fully commit to the new schema:

```diff
  export class CrayonModel extends DatabaseModel {
    // Simplified to just show schema and deserialize function.

    private static schema = z.object({
-     color: z.enum(["red", "yellow", "green", "blue"]).optional(),
-     colour: z.enum(["red", "yellow", "green", "blue"]).optional(),
+     colour: z.enum(["red", "yellow", "green", "blue"]),
      usesLeft: z.number(),
      drawings: z.string().array(),
    });

    deserialize(id: string, item: unknown): Crayon {
      const parsed = CrayonModel.schema.parse(item);

-     const color = parsed.colour ?? parsed.color;
-     if (color == null) {
-       throw new Error('Expected either "colour" or "color" to be defined.');
-     }

-     return new Crayon(id, color, parsed.usesLeft, parsed.drawings);
+     return new Crayon(id, parsed.colour, parsed.usesLeft, parsed.drawings);
    }
  }
```

(Note that the model class is back to its original state, except that `color` is now `colour`.)

### Exceptions to the rule

If you're writing a migration that only adds new fields, you can probably get away with skipping the first PR. By default `z.object()` will ignore additional fields on the objects it parses, so the old server won't crash if a migration runs which adds a new field.

Of course, if your migration doesn't modify the database schemas _at all_ (e.g. you're just using it to edit some values, but the format has stayed the same), then there's no need for that first PR either.

## Writing a migration

To write a migration, create a class inheriting from `Migration`.

For example, here's a migration to rename `color` to `colour` for a [Crayon](/docs/examples/crayon.ts) model:

```ts
import { z } from "zod";
import { Migration, Migrator } from "@dan-schel/db";

export class RenameColorOnCrayon extends Migration {
  constructor() {
    super("2025-03-07-rename-color-on-crayon");
  }

  async run(migrator: Migrator): Promise<void> {
    migrator.map({
      collection: "crayons",
      fn: async (input: unknown) => {
        const { color, ...rest } = z
          .object({
            color: z.enum(["red", "yellow", "green", "blue"]),
            usesLeft: z.number(),
            drawings: z.string().array(),
          })
          .parse(input);

        return {
          ...rest,
          colour: color,
        };
      },
    });
  }
}
```

A migration only really consists of two things, an ID and a `run()` function.

In the example above, `2025-03-07-rename-color-on-crayon` is the migration's ID. This can be whatever you like, so long as it's unique. Migration IDs are prefixed with the current date to help with that.

As you can guess, the `run()` function is to actually perform the migration. The `migrator` argument is your interface with the database. It's a bit different to the regular database functions to enable you to parse the data "raw" (given that you're probably migrating between two different schemas). You can see what else `Migrator` can do by looking [here](/src/general/migration.ts). If you don't need/want to deal with raw data, you can use `migrator.withModel()` to access the regular database functions (e.g. `create`, `update`, etc.).

Finally, in order to have your migration run, append it to the list of migrations passed along to `runMigrations` when your app starts:

```diff
  const migrations: Migration[] = [
    // Always add new migrations to the end of the list, so that they don't run
    // out of order.
+   new RenameColorOnCrayon(),
  ];

  const db = createDb();
  await db.runMigrations(migrations);
```

## Deleting old migrations

Once you're confident your migration has run everywhere it needs to, you could open a third PR to remove it. There's no real hurry to do this though, since the longer you keep it around, the better the chance is that a dev who hasn't booted up the project in a while will benefit from it. (So long as the prod server runs the migration though, it's not such a big deal. At worst, the dev can just reset their database!)
