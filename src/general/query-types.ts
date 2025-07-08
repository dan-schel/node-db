import { DatabaseModel, type SerializedDataOf } from "./database-model.js";
import type { WhereClause } from "./where-clause.js";

/** Arguments to a find (select) query. */
export type FindQuery<Model extends DatabaseModel> = {
  where?: WhereClause<Model>;
  sort?: SortClause<Model>;
  limit?: number;
};

/** Arguments to a first query (like "find" but limits are useless). */
export type FirstQuery<Model extends DatabaseModel> = {
  where?: WhereClause<Model>;
};

/** Arguments to a count query (like "find" but limits/sorting are useless). */
export type CountQuery<Model extends DatabaseModel> = {
  where?: WhereClause<Model>;
};

/** Can sort any field by ascending/descending (but not nested structures). */
export type SortClause<Model extends DatabaseModel> = {
  // The `& string` is reduntant because SerializedObject keys are always
  // strings, but Typescript doesn't know that.
  by: keyof SerializedDataOf<Model> & string;
  direction: "asc" | "desc";
};
