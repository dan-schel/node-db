import type { Filter } from "./mongodb-types.js";
import type { ModelDocument } from "./mongo-repository.js";
import { DatabaseModel } from "../general/database-model.js";
import type { WhereClause, FieldConstraint } from "../general/where-clause.js";

/** Takes a WhereClause and builds the equivalent filter in MongoDB syntax. */
export class MongoWhereClauseInterpreter<Model extends DatabaseModel> {
  constructor(private readonly _where: WhereClause<Model> | undefined) {}

  toMongoFilter(): Filter<ModelDocument> {
    if (this._where == null) {
      return {};
    }

    const filter: Filter<ModelDocument> = {};
    for (const field in this._where) {
      const value = this._where[field]!;
      filter[field] = MongoWhereClauseInterpreter._buildFilterForField(value);
    }
    return filter;
  }

  private static _buildFilterForField(constraint: FieldConstraint) {
    // TODO: [DS] This can probably be improved!
    if (
      constraint == null ||
      typeof constraint !== "object" ||
      constraint instanceof Date
    ) {
      return constraint;
    } else if ("not" in constraint) {
      return { $ne: constraint.not };
    } else {
      const result: {
        $gt?: number | Date;
        $gte?: number | Date;
        $lt?: number | Date;
        $lte?: number | Date;
      } = {};

      if ("gt" in constraint) {
        result.$gt = constraint.gt;
      }
      if ("gte" in constraint) {
        result.$gte = constraint.gte;
      }
      if ("lt" in constraint) {
        result.$lt = constraint.lt;
      }
      if ("lte" in constraint) {
        result.$lte = constraint.lte;
      }

      return result;
    }
  }
}
