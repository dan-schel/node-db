import type { Sort } from "./mongodb-types.js";
import type { SortClause } from "../general/query-types.js";
import { DatabaseModel } from "../general/database-model.js";

/** Takes a SortClause and converts it to MongoDB's sort syntax. */
export class MongoSortClauseInterpreter<Model extends DatabaseModel> {
  constructor(private readonly _sort: SortClause<Model> | undefined) {}

  toMongoSort(): Sort | undefined {
    if (this._sort == null) {
      return undefined;
    }

    return [this._sort.by, this._sort.direction];
  }
}
