import { describe, expect, it } from "vitest";
import {
  type ModelDocument,
  MongoRepository,
} from "../../src/mongo/mongo-repository.js";
import { MUSICAL_INSTRUMENTS, MusicalInstrument } from "../test-model.js";
import { mock } from "vitest-mock-extended";
import type { Collection, FindCursor } from "../../src/mongo/mongodb-types.js";

describe("MongoRepository", () => {
  describe("get", () => {
    it("calls findOne correctly", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      await repository.get(1);

      expect(collection.findOne).toHaveBeenCalledWith({ _id: 1 });
    });
  });

  describe("find", () => {
    it("calls find correctly", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const cursor = mock<FindCursor>();
      cursor.toArray.mockResolvedValue([]);
      collection.find.mockReturnValue(cursor);
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      await repository.find({ where: { type: { not: "bass" } } });

      expect(collection.find).toHaveBeenCalledWith(
        { type: { $ne: "bass" } },
        { limit: undefined, sort: undefined },
      );
    });

    it("applies sorting and limits", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const cursor = mock<FindCursor>();
      cursor.toArray.mockResolvedValue([]);
      collection.find.mockReturnValue(cursor);
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      await repository.find({
        where: { type: { not: "bass" } },
        limit: 3,
        sort: { by: "built", direction: "desc" },
      });

      expect(collection.find).toHaveBeenCalledWith(
        { type: { $ne: "bass" } },
        { limit: 3, sort: ["built", "desc"] },
      );
    });
  });

  describe("first", () => {
    it("calls findOne correctly", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      await repository.first({ where: { type: { not: "bass" } } });

      expect(collection.findOne).toHaveBeenCalledWith({
        type: { $ne: "bass" },
      });
    });
  });

  describe("count", () => {
    it("calls countDocuments correctly", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      await repository.count({ where: { type: { not: "bass" } } });

      expect(collection.countDocuments).toHaveBeenCalledWith({
        type: { $ne: "bass" },
      });
    });
  });

  describe("create", () => {
    it("calls insertOne correctly", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      const built = new Date("2024-12-31T20:14:18Z");
      const instrument = new MusicalInstrument(1, "piano", built, {
        highest: "C8",
        lowest: "A0",
      });
      await repository.create(instrument);

      expect(collection.insertOne).toHaveBeenCalledWith({
        _id: 1,
        type: "piano",
        built,
        noteRange: {
          highest: "C8",
          lowest: "A0",
        },
      });
    });
  });

  describe("update", () => {
    it("calls replaceOne correctly", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      const built = new Date("2024-12-31T20:14:18Z");
      const instrument = new MusicalInstrument(1, "piano", built, {
        highest: "C8",
        lowest: "A0",
      });
      await repository.update(instrument);

      expect(collection.replaceOne).toHaveBeenCalledWith(
        { _id: 1 },
        {
          _id: 1,
          type: "piano",
          built,
          noteRange: {
            highest: "C8",
            lowest: "A0",
          },
        },
      );
    });
  });

  describe("delete", () => {
    it("calls deleteOne correctly", async () => {
      const collection = mock<Collection<ModelDocument>>();
      const repository = new MongoRepository(MUSICAL_INSTRUMENTS, collection);

      await repository.delete(1);

      expect(collection.deleteOne).toHaveBeenCalledWith({ _id: 1 });
    });
  });
});
