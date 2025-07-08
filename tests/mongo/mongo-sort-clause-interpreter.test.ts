import { describe, expect, it } from "vitest";
import { MongoSortClauseInterpreter } from "../../src/mongo/mongo-sort-clause-interpreter.js";
import type { SortClause } from "../../src/general/query-types.js";
import { DatabaseModel } from "../../src/general/database-model.js";

describe("MongoSortClauseInterpreter", () => {
  describe("toMongoSort", () => {
    function sort(sort: SortClause<DatabaseModel> | undefined) {
      return new MongoSortClauseInterpreter(sort).toMongoSort();
    }

    it("should handle array contains checking", () => {
      expect(sort({ by: "a", direction: "asc" })).toStrictEqual(["a", "asc"]);
      expect(sort({ by: "a", direction: "desc" })).toStrictEqual(["a", "desc"]);
    });

    it("should handle no sorting", () => {
      expect(sort(undefined)).toStrictEqual(undefined);
    });
  });
});
