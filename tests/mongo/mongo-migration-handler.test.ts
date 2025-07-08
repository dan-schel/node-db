import { describe } from "vitest";
import { it, expect, vi } from "vitest";
import {
  MongoMigrationHandler,
  MongoMigrator,
} from "../../src/mongo/mongo-migration-handler.js";
import type {
  Collection,
  Db,
  FindCursor,
} from "../../src/mongo/mongodb-types.js";
import { mock } from "vitest-mock-extended";
import { z } from "zod";

describe("MongoMigrationHandler", () => {
  describe("#runMigrations", () => {
    it("doesn't run migrations that have already been run", async () => {
      const { db, collection } = mockDb(["migration1"]);

      const handler = new MongoMigrationHandler(db);
      const migration = {
        id: "migration1",
        run: async () => {},
      };

      const runSpy = vi.spyOn(migration, "run");
      await handler.runMigrations([migration]);

      expect(runSpy).not.toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("_meta");
      expect(collection.find).toHaveBeenCalledWith({
        type: "completed-migration",
      });
      expect(collection.insertOne).not.toHaveBeenCalled();
    });

    it("runs migrations that haven't been run", async () => {
      const { db, collection } = mockDb([]);

      const handler = new MongoMigrationHandler(db);
      const migration = {
        id: "migration1",
        run: async () => {},
      };

      const runSpy = vi.spyOn(migration, "run");
      await handler.runMigrations([migration]);

      expect(runSpy).toHaveBeenCalled();
      expect(collection.insertOne).toHaveBeenCalledWith({
        type: "completed-migration",
        migrationId: "migration1",
        ranAt: expect.any(Date),
      });
    });

    function mockDb(completedMigrations: string[]) {
      const db = mock<Db>();
      const collection = mock<Collection>();
      const cursor = mock<FindCursor>();

      cursor.toArray.mockResolvedValue(
        completedMigrations.map((id) => ({
          type: "completed-migration",
          migrationId: id,
          ranAt: new Date(),
        })),
      );
      collection.find.mockReturnValue(cursor);
      db.collection.mockReturnValue(collection);

      return { db, collection };
    }
  });
});

describe("MongoMigrator", () => {
  describe("#map", () => {
    it("works", async () => {
      const db = mock<Db>();
      const collection = mock<Collection>();
      const cursor = mock<FindCursor>();
      cursor.toArray.mockResolvedValue([
        { _id: 1, stuff: "stuff1", bad: true },
        { _id: 2, stuff: "stuff2", bad: true },
      ]);
      collection.find.mockReturnValue(cursor);
      db.collection.mockReturnValue(collection);

      const migrator = new MongoMigrator(db);
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

      expect(db.collection).toHaveBeenCalledWith("test");
      expect(collection.find).toHaveBeenCalledWith({ bad: true });
      expect(collection.replaceOne).toHaveBeenCalledWith(
        { _id: 1 },
        { _id: 1, things: "things1", bad: false },
      );
      expect(collection.replaceOne).toHaveBeenCalledWith(
        { _id: 2 },
        { _id: 2, things: "things2", bad: false },
      );
    });
  });

  describe("#delete", () => {
    it("uses deleteMany if possible", async () => {
      const db = mock<Db>();
      const collection = mock<Collection>();
      db.collection.mockReturnValue(collection);

      const migrator = new MongoMigrator(db);
      await migrator.delete({
        collection: "test",
        where: { bad: true },
      });

      expect(db.collection).toHaveBeenCalledWith("test");
      expect(collection.deleteMany).toHaveBeenCalledWith({ bad: true });
    });

    it("reads into memory if needed", async () => {
      const db = mock<Db>();
      const collection = mock<Collection>();
      const cursor = mock<FindCursor>();
      cursor.toArray.mockResolvedValue([
        { _id: 1, stuff: "stuff1", bad: true },
        { _id: 2, stuff: "stuff2", bad: true },
      ]);
      collection.find.mockReturnValue(cursor);
      db.collection.mockReturnValue(collection);

      const migrator = new MongoMigrator(db);
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

      expect(db.collection).toHaveBeenCalledWith("test");
      expect(collection.find).toHaveBeenCalledWith({ bad: true });
      expect(collection.deleteOne).toHaveBeenCalledWith({ _id: 1 });
    });
  });

  describe("#rename", () => {
    it("works", async () => {
      const db = mock<Db>();
      const collection = mock<Collection>();
      db.collection.mockReturnValue(collection);

      const migrator = new MongoMigrator(db);
      await migrator.rename({
        oldCollectionName: "bad",
        newCollectionName: "good",
      });

      expect(db.collection).toHaveBeenCalledWith("bad");
      expect(collection.rename).toHaveBeenCalledWith("good");
    });
  });

  describe("#drop", () => {
    it("works", async () => {
      const db = mock<Db>();
      const collection = mock<Collection>();
      db.collection.mockReturnValue(collection);

      const migrator = new MongoMigrator(db);
      await migrator.drop({
        collection: "bad",
      });

      expect(db.collection).toHaveBeenCalledWith("bad");
      expect(collection.drop).toHaveBeenCalled();
    });
  });
});
