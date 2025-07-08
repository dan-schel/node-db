import { describe } from "vitest";
import { it, expect, vi } from "vitest";
import {
  InMemoryMigrationHandler,
  InMemoryMigrator,
} from "../../src/in-memory/in-memory-migration-handler.js";
import { InMemoryDatabaseData } from "../../src/in-memory/in-memory-database-collection.js";
import { z } from "zod";

describe("InMemoryMigrationHandler", () => {
  describe("#runMigrations", () => {
    it("doesn't run migrations that have already been run", async () => {
      const data = new InMemoryDatabaseData();
      const handler = new InMemoryMigrationHandler(data);
      const migration = {
        id: "migration1",
        run: async () => {},
      };

      const runSpy = vi.spyOn(migration, "run");
      data.addCompletedMigration(migration.id);
      await handler.runMigrations([migration]);

      expect(runSpy).not.toHaveBeenCalled();
      expect(data.getCompletedMigrations()).toStrictEqual([migration.id]);
    });

    it("runs migrations that haven't been run", async () => {
      const data = new InMemoryDatabaseData();
      const handler = new InMemoryMigrationHandler(data);
      const migration = {
        id: "migration1",
        run: async () => {},
      };

      const runSpy = vi.spyOn(migration, "run");
      await handler.runMigrations([migration]);

      expect(runSpy).toHaveBeenCalled();
      expect(data.getCompletedMigrations()).toStrictEqual([migration.id]);
    });
  });
});

describe("InMemoryMigrator", () => {
  describe("#map", () => {
    it("works", async () => {
      const data = new InMemoryDatabaseData();
      data.collection("test").create({ id: 1, stuff: "stuff1", bad: true });
      data.collection("test").create({ id: 2, stuff: "stuff2", bad: true });
      data.collection("test").create({ id: 3, stuff: "stuff3", bad: false });

      const migrator = new InMemoryMigrator(data);
      await migrator.map({
        collection: "test",
        where: { bad: true },
        fn: async (input: unknown) => {
          const item = z
            .object({
              stuff: z.string(),
              bad: z.boolean(),
            })
            .parse(input);

          return {
            things: item.stuff.replace("stuff", "things"),
            bad: false,
          };
        },
      });

      expect(data.collection("test").find((_x) => true)).toStrictEqual([
        { id: 1, things: "things1", bad: false },
        { id: 2, things: "things2", bad: false },
        { id: 3, stuff: "stuff3", bad: false },
      ]);
    });
  });

  describe("#delete", () => {
    it("works", async () => {
      const data = new InMemoryDatabaseData();
      data.collection("test").create({ id: 1, stuff: "stuff1", bad: true });
      data.collection("test").create({ id: 2, stuff: "stuff2", bad: true });
      data.collection("test").create({ id: 3, stuff: "stuff3", bad: false });

      const migrator = new InMemoryMigrator(data);
      await migrator.delete({
        collection: "test",
        where: { bad: true },
        predicate: (input: unknown) => {
          const item = z
            .object({
              stuff: z.string(),
              bad: z.boolean(),
            })
            .parse(input);

          return item.stuff === "stuff1";
        },
      });

      expect(data.collection("test").find((_x) => true)).toStrictEqual([
        { id: 2, stuff: "stuff2", bad: true },
        { id: 3, stuff: "stuff3", bad: false },
      ]);
    });
  });

  describe("#rename", () => {
    it("works", async () => {
      const data = new InMemoryDatabaseData();
      data.collection("bad").create({ id: 1, stuff: "stuff1" });

      const migrator = new InMemoryMigrator(data);
      await migrator.rename({
        oldCollectionName: "bad",
        newCollectionName: "good",
      });

      expect(data.hasCollection("bad")).toBe(false);
      expect(data.collection("good").find((_x) => true)).toStrictEqual([
        { id: 1, stuff: "stuff1" },
      ]);
    });
  });

  describe("#drop", () => {
    it("works", async () => {
      const data = new InMemoryDatabaseData();
      data.collection("bad").create({ id: 1, stuff: "stuff1" });
      data.collection("bad").create({ id: 2, stuff: "stuff2" });
      data.collection("bad").create({ id: 3, stuff: "stuff3" });

      const migrator = new InMemoryMigrator(data);
      await migrator.drop({
        collection: "bad",
      });

      expect(data.hasCollection("bad")).toBe(false);
    });
  });
});
