import { InMemoryDatabase } from "../../src/in-memory/in-memory-database.js";
import {
  BASS_3,
  MUSICAL_INSTRUMENTS,
  PIANO_1,
  PIANO_4,
  SYNTH_2,
} from "../test-model.js";

export function getDatabase(): InMemoryDatabase {
  const db = new InMemoryDatabase();
  db.of(MUSICAL_INSTRUMENTS).create(PIANO_1);
  db.of(MUSICAL_INSTRUMENTS).create(SYNTH_2);
  db.of(MUSICAL_INSTRUMENTS).create(BASS_3);
  db.of(MUSICAL_INSTRUMENTS).create(PIANO_4);
  return db;
}
