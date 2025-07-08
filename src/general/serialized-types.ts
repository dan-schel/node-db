/** All fields must be primitive data types (or nested arrays/objects). */
export type SerializedObject = {
  // Disallow ID from being serialized, since it's handled by the database
  // implementation itself (using getId() to retrieve it).
  id?: undefined;

  [field: string]: SerializedData;
};

/** Primitive data types (or nested arrays/objects). */
export type SerializedData =
  | undefined
  | string
  | number
  | boolean
  | Date
  | null
  | { [field: string]: SerializedData }
  | readonly SerializedData[];
