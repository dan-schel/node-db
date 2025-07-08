import { MigrationHandler, Repository } from "../general/database.js";
import { DatabaseModel } from "../general/database-model.js";
import { Migrator } from "../general/migration.js";
import type {
  MigratorMapCommand,
  MigratorDeleteCommand,
  MigratorRenameCommand,
  MigratorDropCommand,
} from "../general/migration-command-types.js";
import {
  InMemoryDatabaseData,
  type InMemoryDatabaseItem,
} from "./in-memory-database-collection.js";
import { InMemoryRepository } from "./in-memory-repository.js";
import { InMemoryWhereClauseInterpreter } from "./in-memory-where-clause-interpreter.js";

export class InMemoryMigrationHandler extends MigrationHandler {
  constructor(private readonly _data: InMemoryDatabaseData) {
    super();
  }

  protected getMigrator(): Migrator {
    return new InMemoryMigrator(this._data);
  }

  protected async getCompletedMigrationIds(): Promise<string[]> {
    return this._data.getCompletedMigrations();
  }

  protected async markMigrationComplete(id: string): Promise<void> {
    this._data.addCompletedMigration(id);
  }
}

export class InMemoryMigrator extends Migrator {
  constructor(private readonly _data: InMemoryDatabaseData) {
    super();
  }

  async map(query: MigratorMapCommand): Promise<void> {
    const filter = new InMemoryWhereClauseInterpreter(query.where);
    const collection = this._data.collection(query.collection);
    const items = collection.find((item) => filter.matches(item));

    for (const item of items) {
      const newItem = await query.fn(this._stripId(item), item.id);
      collection.update({ ...newItem, id: item.id });
    }
  }

  async delete(query: MigratorDeleteCommand): Promise<void> {
    const filter = new InMemoryWhereClauseInterpreter(query.where);
    const collection = this._data.collection(query.collection);
    const items = collection.find((item) => filter.matches(item));

    for (const item of items) {
      if (
        query.predicate == null ||
        query.predicate(this._stripId(item), item.id)
      ) {
        collection.delete(item.id);
      }
    }
  }

  async rename(query: MigratorRenameCommand): Promise<void> {
    this._data.renameCollection(
      query.oldCollectionName,
      query.newCollectionName,
    );
  }

  async drop(query: MigratorDropCommand): Promise<void> {
    this._data.dropCollection(query.collection);
  }

  withModel<Model extends DatabaseModel>(model: Model): Repository<Model> {
    return new InMemoryRepository(model, this._data.collection(model.name));
  }

  private _stripId(item: InMemoryDatabaseItem): unknown {
    return { ...item, id: undefined };
  }
}
