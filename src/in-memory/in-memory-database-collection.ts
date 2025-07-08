export type InMemoryDatabaseItem = {
  id: string | number;
  [key: string]: unknown;
};

export class InMemoryDatabaseData {
  private readonly data: Map<string, InMemoryDatabaseCollection>;
  private readonly completedMigrations: string[];

  constructor() {
    this.data = new Map<string, InMemoryDatabaseCollection>();
    this.completedMigrations = [];
  }

  collection(name: string): InMemoryDatabaseCollection {
    if (this.data.has(name)) {
      return this.data.get(name)!;
    }

    const collection = new InMemoryDatabaseCollection();
    this.data.set(name, collection);
    return collection;
  }

  hasCollection(name: string): boolean {
    return this.data.has(name);
  }

  dropCollection(name: string): void {
    this.data.delete(name);
  }

  renameCollection(oldName: string, newName: string) {
    const collection = this.data.get(oldName);
    if (!collection) {
      throw new Error(`Collection with name "${oldName}" not found.`);
    }
    this.data.set(newName, collection);
    this.data.delete(oldName);
  }

  getCompletedMigrations(): string[] {
    return [...this.completedMigrations];
  }

  addCompletedMigration(id: string) {
    this.completedMigrations.push(id);
  }
}

export class InMemoryDatabaseCollection {
  private readonly values: InMemoryDatabaseItem[];
  private readonly map: Map<string | number, InMemoryDatabaseItem>;

  constructor() {
    this.values = [];
    this.map = new Map<string | number, InMemoryDatabaseItem>();
  }

  get(id: string | number): InMemoryDatabaseItem | null {
    return this.map.get(id) ?? null;
  }

  find(
    predicate: (x: InMemoryDatabaseItem) => boolean,
  ): InMemoryDatabaseItem[] {
    return this.values.filter(predicate);
  }

  first(
    predicate: (x: InMemoryDatabaseItem) => boolean,
  ): InMemoryDatabaseItem | null {
    return this.values.find(predicate) ?? null;
  }

  count(predicate: (x: InMemoryDatabaseItem) => boolean): number {
    return this.find(predicate).length;
  }

  create(item: InMemoryDatabaseItem): void {
    this.values.push(item);
    this.map.set(item.id, item);
  }

  update(item: InMemoryDatabaseItem): void {
    const index = this.values.findIndex((i) => i.id === item.id);
    if (index === -1) {
      throw new Error(`Item with ID "${item.id}" not found.`);
    }
    this.values[index] = item;
    this.map.set(item.id, item);
  }

  delete(id: string | number): void {
    const index = this.values.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Item with ID "${id}" not found.`);
    }
    this.values.splice(index, 1);
    this.map.delete(id);
  }
}
