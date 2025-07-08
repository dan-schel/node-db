import { DatabaseModel, type IdOf } from "./database-model.js";
import type { SerializedObject } from "./serialized-types.js";
import type { WhereClause } from "./where-clause.js";

/** Arguments to the Migrator's map command. */
export type MigratorMapCommand = {
  collection: string;
  fn: (input: unknown, id: IdOf<DatabaseModel>) => Promise<SerializedObject>;
  where?: WhereClause<DatabaseModel>;
};

/** Arguments to the Migrator's delete command. */
export type MigratorDeleteCommand = {
  collection: string;
  where?: WhereClause<DatabaseModel>;
  predicate?: (input: unknown, id: IdOf<DatabaseModel>) => boolean;
};

/** Arguments to the Migrator's rename command. */
export type MigratorRenameCommand = {
  oldCollectionName: string;
  newCollectionName: string;
};

/** Arguments to the Migrator's drop command. */
export type MigratorDropCommand = { collection: string };
