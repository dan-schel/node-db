import type { Db, MongoClient } from "./mongodb-types.js";
import { DatabaseModel } from "../general/database-model.js";
import { Database, MigrationHandler, Repository } from "../general/database.js";
import { MongoRepository } from "./mongo-repository.js";
import { MongoMigrationHandler } from "./mongo-migration-handler.js";

export class MongoDatabase extends Database {
  private readonly _db: Db;

  constructor(client: MongoClient, databaseName: string) {
    super();
    this._db = client.db(databaseName);
  }

  of<Model extends DatabaseModel>(model: Model): Repository<Model> {
    return new MongoRepository(model, this._db.collection(model.name));
  }

  protected getMigrationHandler(): MigrationHandler {
    return new MongoMigrationHandler(this._db);
  }
}
