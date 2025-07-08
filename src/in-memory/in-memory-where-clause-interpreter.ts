import { DatabaseModel } from "../general/database-model.js";
import type { WhereClause, FieldConstraint } from "../general/where-clause.js";
import type { InMemoryDatabaseItem } from "./in-memory-database-collection.js";

/** Determines whether items match the provided WhereClause. */
export class InMemoryWhereClauseInterpreter<Model extends DatabaseModel> {
  constructor(private readonly _where: WhereClause<Model> | undefined) {}

  matches(item: InMemoryDatabaseItem): boolean {
    if (this._where == null) {
      return true;
    }

    return Object.entries(this._where).every(([field, constraint]) => {
      const value = item[field];
      return InMemoryWhereClauseInterpreter._isMatchingField(
        constraint!,
        value,
      );
    });
  }

  private static _isMatchingField(constraint: FieldConstraint, value: unknown) {
    // TODO: [DS] This can probably be improved!
    if (constraint instanceof Date) {
      return value instanceof Date && value.getTime() === constraint.getTime();
    } else if (constraint == null || typeof constraint !== "object") {
      return value === constraint;
    } else if ("not" in constraint) {
      if (constraint.not instanceof Date) {
        return !(
          value instanceof Date && value.getTime() === constraint.not.getTime()
        );
      } else {
        return value !== constraint.not;
      }
    } else {
      if (typeof value !== "number" && !(value instanceof Date)) {
        return false;
      }

      if ("gt" in constraint && !(value > constraint.gt!)) {
        return false;
      }
      if ("gte" in constraint && !(value >= constraint.gte!)) {
        return false;
      }
      if ("lt" in constraint && !(value < constraint.lt!)) {
        return false;
      }
      if ("lte" in constraint && !(value <= constraint.lte!)) {
        return false;
      }
      return true;
    }
  }
}
