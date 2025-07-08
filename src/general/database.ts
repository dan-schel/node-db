import { DatabaseModel, type DataOf, type IdOf } from "./database-model.js";
import { Migration, Migrator } from "./migration.js";
import type { CountQuery, FindQuery, FirstQuery } from "./query-types.js";

export abstract class Database {
  abstract of<Model extends DatabaseModel>(model: Model): Repository<Model>;

  protected abstract getMigrationHandler(): MigrationHandler;

  async runMigrations(migrations: Migration[]) {
    await this.getMigrationHandler().runMigrations(migrations);
  }
}

export abstract class Repository<Model extends DatabaseModel> {
  constructor(protected readonly _model: Model) {}

  /** Returns the record with the given id or null. */
  abstract get(id: IdOf<Model>): Promise<DataOf<Model> | null>;

  /** Returns all records matching the query. */
  abstract find(query: FindQuery<Model>): Promise<DataOf<Model>[]>;

  /** Returns the first record matching the query. */
  abstract first(query: FirstQuery<Model>): Promise<DataOf<Model> | null>;

  /** Returns the number of records which the query. */
  abstract count(query?: CountQuery<Model>): Promise<number>;

  /** Creates a new record with the given value. */
  abstract create(item: DataOf<Model>): Promise<void>;

  /** Replaces the record with the same id with the given value. */
  abstract update(item: DataOf<Model>): Promise<void>;

  /** Deletes the record. */
  abstract delete(id: IdOf<Model>): Promise<void>;

  /** Returns the record with the given id or throws if not found. */
  async require(id: IdOf<Model>): Promise<DataOf<Model>> {
    const item = await this.get(id);
    if (item == null) {
      throw new Error(`No item with ID="${id}" in "${this._model.name}".`);
    }
    return item;
  }

  /** Returns the record with the given id or throws if not found. */
  async requireFirst(query: FirstQuery<Model>): Promise<DataOf<Model>> {
    const item = await this.first(query);
    if (item == null) {
      throw new Error(`No matching items found in "${this._model.name}".`);
    }
    return item;
  }

  /** Returns the record matching the query or throws if zero/multiple match. */
  async requireSingle(query: FirstQuery<Model>): Promise<DataOf<Model>> {
    const items = await this.find(query);
    if (items.length !== 1) {
      throw new Error(
        `${items.length} items in "${this._model.name}" matched. Expected 1.`,
      );
    }
    return items[0];
  }

  /** Returns all records in this repository. */
  async all(): Promise<DataOf<Model>[]> {
    return this.find({});
  }
}

export abstract class MigrationHandler {
  async runMigrations(migrations: Migration[]) {
    const completedIds = await this.getCompletedMigrationIds();
    const migrator = this.getMigrator();

    for (const migration of migrations) {
      if (completedIds.includes(migration.id)) {
        continue;
      }

      await migration.run(migrator);
      await this.markMigrationComplete(migration.id);
    }
  }

  protected abstract getMigrator(): Migrator;

  protected abstract getCompletedMigrationIds(): Promise<string[]>;

  protected abstract markMigrationComplete(id: string): Promise<void>;
}
