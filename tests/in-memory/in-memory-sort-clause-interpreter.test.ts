import { describe, expect, it } from "vitest";
import { DatabaseModel } from "../../src/general/database-model.js";
import { InMemorySortClauseInterpreter } from "../../src/in-memory/in-memory-sort-clause-interpreter.js";
import type { InMemoryDatabaseItem } from "../../src/in-memory/in-memory-database-collection.js";
import type { SortClause } from "../../src/general/query-types.js";

describe("InMemorySortClauseInterpreter", () => {
  describe("matches", () => {
    function sort(
      data: InMemoryDatabaseItem[],
      sort: SortClause<DatabaseModel> | undefined,
    ) {
      const fn = new InMemorySortClauseInterpreter(sort).getSortFunction();
      return [...data].sort(fn);
    }

    it("sorts numbers", () => {
      const original = [
        { id: 1, number: 4 },
        { id: 2, number: -8 },
        { id: 3, number: 1 },
      ];
      const sorted = [
        { id: 2, number: -8 },
        { id: 3, number: 1 },
        { id: 1, number: 4 },
      ];
      expect(sort(original, { by: "number", direction: "asc" })).toStrictEqual(
        sorted,
      );
    });

    it("sorts dates", () => {
      const original = [
        { id: 1, date: new Date("2025-01-01T17:36:56Z") },
        { id: 2, date: new Date("2024-12-31T17:36:56Z") },
        { id: 3, date: new Date("2025-01-01T09:36:56Z") },
      ];
      const sorted = [
        { id: 2, date: new Date("2024-12-31T17:36:56Z") },
        { id: 3, date: new Date("2025-01-01T09:36:56Z") },
        { id: 1, date: new Date("2025-01-01T17:36:56Z") },
      ];
      expect(sort(original, { by: "date", direction: "asc" })).toStrictEqual(
        sorted,
      );
    });

    it("sorts strings", () => {
      const original = [
        { id: 1, str: "cupcakes" },
        { id: 2, str: "apples" },
        { id: 3, str: "bananas" },
      ];
      const sorted = [
        { id: 2, str: "apples" },
        { id: 3, str: "bananas" },
        { id: 1, str: "cupcakes" },
      ];
      expect(sort(original, { by: "str", direction: "asc" })).toStrictEqual(
        sorted,
      );
    });

    it("sorts descending", () => {
      const original = [
        { id: 1, number: 4 },
        { id: 2, number: -8 },
        { id: 3, number: 1 },
      ];
      const sorted = [
        { id: 1, number: 4 },
        { id: 3, number: 1 },
        { id: 2, number: -8 },
      ];
      expect(sort(original, { by: "number", direction: "desc" })).toStrictEqual(
        sorted,
      );
    });
  });
});
