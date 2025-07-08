import type { Db } from "./mongodb-types.js";
import { MigrationHandler, Repository } from "../general/database.js";
import { Migrator } from "../general/migration.js";
import { DatabaseModel } from "../general/database-model.js";
import { type ModelDocument, MongoRepository } from "./mongo-repository.js";
import type {
  MigratorMapCommand,
  MigratorDeleteCommand,
  MigratorRenameCommand,
  MigratorDropCommand,
} from "../general/migration-command-types.js";
import { MongoWhereClauseInterpreter } from "./mongo-where-clause-interpreter.js";
import { z } from "zod";

export class MongoMigrationHandler extends MigrationHandler {
  private static readonly META_COLLECTION = "_meta";
  private static readonly MIGRATION_META_TYPE = "completed-migration";

  private static readonly migrationMetaBson = z.object({
    type: z.literal(MongoMigrationHandler.MIGRATION_META_TYPE),
    migrationId: z.string(),
    ranAt: z.date(),
  });

  constructor(private readonly _db: Db) {
    super();
  }

  protected getMigrator(): Migrator {
    return new MongoMigrator(this._db);
  }

  protected async getCompletedMigrationIds(): Promise<string[]> {
    const collection = this._getMigrationsCollection();
    const migrationDocuments = await collection
      .find({ type: MongoMigrationHandler.MIGRATION_META_TYPE })
      .toArray();

    const completedMigrations = migrationDocuments.map((doc) =>
      MongoMigrationHandler.migrationMetaBson.parse(doc),
    );

    return completedMigrations.map((doc) => doc.migrationId);
  }

  protected async markMigrationComplete(id: string): Promise<void> {
    const collection = this._getMigrationsCollection();
    await collection.insertOne({
      type: MongoMigrationHandler.MIGRATION_META_TYPE,
      migrationId: id,
      ranAt: new Date(),
    } satisfies z.input<typeof MongoMigrationHandler.migrationMetaBson>);
  }

  private _getMigrationsCollection() {
    return this._db.collection(MongoMigrationHandler.META_COLLECTION);
  }
}

export class MongoMigrator extends Migrator {
  constructor(private readonly _db: Db) {
    super();
  }

  async map(query: MigratorMapCommand): Promise<void> {
    const collection = this._getCollection(query.collection);
    const filter = new MongoWhereClauseInterpreter(query.where).toMongoFilter();
    const items = await collection.find(filter).toArray();

    for (const item of items) {
      const updatedItem = await query.fn(this._stripId(item), item._id);
      await collection.replaceOne(
        { _id: item._id },
        { ...updatedItem, _id: item._id },
      );
    }
  }

  async delete(query: MigratorDeleteCommand): Promise<void> {
    const collection = this._getCollection(query.collection);
    const filter = new MongoWhereClauseInterpreter(query.where).toMongoFilter();
    const predicate = query.predicate;

    if (predicate == null) {
      await collection.deleteMany(filter);
    } else {
      const items = await collection.find(filter).toArray();
      const itemsToDelete = items.filter((x) =>
        predicate(this._stripId(x), x._id),
      );
      for (const item of itemsToDelete) {
        await collection.deleteOne({ _id: item._id });
      }
    }
  }

  async rename(query: MigratorRenameCommand): Promise<void> {
    await this._getCollection(query.oldCollectionName).rename(
      query.newCollectionName,
    );
  }

  async drop(query: MigratorDropCommand): Promise<void> {
    await this._getCollection(query.collection).drop();
  }

  withModel<Model extends DatabaseModel>(model: Model): Repository<Model> {
    return new MongoRepository(model, this._db.collection(model.name));
  }

  private _getCollection(name: string) {
    return this._db.collection<ModelDocument>(name);
  }

  private _stripId(item: ModelDocument): unknown {
    return { ...item, _id: undefined };
  }
}
