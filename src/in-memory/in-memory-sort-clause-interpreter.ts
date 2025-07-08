import { DatabaseModel } from "../general/database-model.js";
import type { SortClause } from "../general/query-types.js";
import type { InMemoryDatabaseItem } from "./in-memory-database-collection.js";

/** Provides a sorting function based on the given SortClause. */
export class InMemorySortClauseInterpreter<Model extends DatabaseModel> {
  constructor(private readonly _sort: SortClause<Model> | undefined) {}

  requiresSorting(): boolean {
    return this._sort != null;
  }

  getSortFunction() {
    const sort = this._sort;
    if (sort == null) {
      return undefined;
    }

    return (a: InMemoryDatabaseItem, b: InMemoryDatabaseItem) => {
      const valueA = a[sort.by];
      const valueB = b[sort.by];
      const direction = sort.direction === "asc" ? 1 : -1;

      if (typeof valueA === "number" && typeof valueB === "number") {
        return (valueA - valueB) * direction;
      }
      if (valueA instanceof Date && valueB instanceof Date) {
        return (valueA.getTime() - valueB.getTime()) * direction;
      }
      if (typeof valueA === "string" && typeof valueB === "string") {
        return valueA.localeCompare(valueB) * direction;
      }
      return 0;
    };
  }
}
