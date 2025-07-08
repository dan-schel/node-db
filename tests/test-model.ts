import { z } from "zod";
import { DatabaseModel } from "../src/general/database-model.js";

export class MusicalInstrument {
  constructor(
    readonly id: number,
    readonly type: "piano" | "ukelele" | "bass" | "synth",
    readonly built: Date,
    readonly noteRange: {
      readonly highest: string;
      readonly lowest: string;
    },
  ) {}
}

export class MusicalInstrumentModel extends DatabaseModel<
  MusicalInstrument,
  number,
  z.input<typeof MusicalInstrumentModel.schema>
> {
  static instance = new MusicalInstrumentModel();

  static schema = z.object({
    type: z.enum(["piano", "ukelele", "bass", "synth"]),
    built: z.date(),
    noteRange: z.object({
      highest: z.string(),
      lowest: z.string(),
    }),
  });

  private constructor() {
    super("musical-instruments");
  }

  getId(item: MusicalInstrument): number {
    return item.id;
  }

  serialize(
    item: MusicalInstrument,
  ): z.input<typeof MusicalInstrumentModel.schema> {
    return {
      type: item.type,
      built: item.built,
      noteRange: {
        highest: item.noteRange.highest,
        lowest: item.noteRange.lowest,
      },
    };
  }

  deserialize(id: number, item: unknown): MusicalInstrument {
    const parsed = MusicalInstrumentModel.schema.parse(item);
    return new MusicalInstrument(
      id,
      parsed.type,
      parsed.built,
      parsed.noteRange,
    );
  }
}

export const MUSICAL_INSTRUMENTS = MusicalInstrumentModel.instance;

export const PIANO_1 = new MusicalInstrument(
  1,
  "piano",
  new Date("1982-01-05"),
  {
    highest: "C8",
    lowest: "A0",
  },
);

export const SYNTH_2 = new MusicalInstrument(
  2,
  "synth",
  new Date("2016-03-08"),
  {
    highest: "C6",
    lowest: "C2",
  },
);

export const BASS_3 = new MusicalInstrument(3, "bass", new Date("2000-11-15"), {
  highest: "G4",
  lowest: "E1",
});

export const PIANO_4 = new MusicalInstrument(
  4,
  "piano",
  new Date("2011-05-01"),
  {
    highest: "C8",
    lowest: "A0",
  },
);
