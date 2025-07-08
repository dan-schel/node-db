import { Database, MigrationHandler, Repository } from "../general/database.js";
import { DatabaseModel } from "../general/database-model.js";
import { InMemoryDatabaseData } from "./in-memory-database-collection.js";
import { InMemoryMigrationHandler } from "./in-memory-migration-handler.js";
import { InMemoryRepository } from "./in-memory-repository.js";

export class InMemoryDatabase extends Database {
  private readonly _data: InMemoryDatabaseData;

  constructor() {
    super();
    this._data = new InMemoryDatabaseData();
  }

  of<Model extends DatabaseModel>(model: Model): Repository<Model> {
    return new InMemoryRepository(model, this._data.collection(model.name));
  }

  protected getMigrationHandler(): MigrationHandler {
    return new InMemoryMigrationHandler(this._data);
  }
}
