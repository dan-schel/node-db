import type { SerializedObject } from "./serialized-types.js";

/** Typescript magic to extract the Id type used by a DatabaseModel. */
export type IdOf<T extends DatabaseModel> =
  T extends DatabaseModel<object, infer Id, SerializedObject> ? Id : never;

/** Typescript magic to extract the Data type used by a DatabaseModel. */
export type DataOf<T extends DatabaseModel> =
  T extends DatabaseModel<infer Data, string | number, SerializedObject>
    ? Data
    : never;

/** Typescript magic to extract the SerializedData type used by a DatabaseModel. */
export type SerializedDataOf<T extends DatabaseModel> =
  T extends DatabaseModel<object, string | number, infer SerializedData>
    ? SerializedData
    : never;

export abstract class DatabaseModel<
  Data extends object = object,
  Id extends string | number = string | number,
  SerializedData extends SerializedObject = SerializedObject,
> {
  constructor(readonly name: string) {}

  abstract getId(item: Data): Id;

  abstract serialize(item: Data): SerializedData;
  abstract deserialize(id: Id, item: unknown): Data;
}
