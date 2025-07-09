/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// One day, it'd probably be good to align these closer to the real MongoDB
// types, but this is close enough for now, and avoids peer dependency insanity.

export type MongoClient = {
  db: (name: string) => Db;
};

export type Db = {
  collection: <T>(name: string) => Collection<T>;
};

export type Collection<T = any> = {
  find: (filter: object, options?: object) => FindCursor<T>;
  findOne: (filter: object) => Promise<any>;
  insertOne: (document: object) => Promise<any>;
  replaceOne: (filter: object, replacement: object) => Promise<any>;
  deleteOne: (filter: object) => Promise<any>;
  deleteMany: (filter: object) => Promise<any>;
  rename: (name: string) => Promise<any>;
  drop: () => Promise<any>;
  countDocuments: (filter: object) => Promise<number>;
};

export type WithId<T> = T & { _id: string | number };

export type Sort = [string, "asc" | "desc"];

export type Filter<T> = Record<string, any>;

export type FindCursor<T = any> = { toArray: () => Promise<any[]> };
