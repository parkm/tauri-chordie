// src/ChordDetector.test.ts
import { describe, it, expect } from "vitest";
import { detectChord } from "./ChordDetector";

/**
 * Helper function to convert MIDI note names to MIDI numbers.
 * Example: midiNote("C4") returns 60
 *
 * Supports note names like C4, C#4, Db4, etc.
 * Middle C (C4) = MIDI 60
 */
export function midiNote(noteName: string): number {
  const noteMap: { [key: string]: number } = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };

  // Parse note name and octave
  const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);

  if (!(note in noteMap)) {
    throw new Error(`Invalid note name: ${note}`);
  }

  // MIDI note number formula: (octave + 1) * 12 + noteValue
  // Middle C (C4) = 60
  return (octave + 1) * 12 + noteMap[note];
}

/**
 * Helper function to convert multiple MIDI note names to an array of MIDI numbers.
 * Example: midiNotes("C4", "E4", "G4") returns [60, 64, 67]
 */
export function midiNotes(...noteNames: string[]): number[] {
  return noteNames.map(midiNote);
}

/**
 * Helper function to test chord detection with a simple API.
 * Example: testChord(["C4", "E4", "G4"], "C")
 * Example with key: testChord(["Ab3", "C4", "Eb4"], "Ab", { key: "Ab" })
 */
export function testChord(noteNames: string[], expectedChord: string, options?: { key?: string }): void {
  const notes = midiNotes(...noteNames);
  const result = detectChord(notes, false, options?.key);
  expect(result).toBe(expectedChord);
}

describe("ChordDetector", () => {
  describe("detectChord - Major Triads", () => {
    it("detects C major", () => {
      testChord(["C4", "E4", "G4"], "C");
    });

    it("detects D major", () => {
      testChord(["D4", "F#4", "A4"], "D");
    });

    it("detects G major", () => {
      testChord(["G3", "B3", "D4"], "G");
    });
  });

  describe("detectChord - Minor Triads", () => {
    it("detects A minor", () => {
      testChord(["A3", "C4", "E4"], "Am");
    });

    it("detects D minor", () => {
      testChord(["D4", "F4", "A4"], "Dm");
    });
  });

  describe("detectChord - Seventh Chords", () => {
    it("detects C major 7th", () => {
      testChord(["C4", "E4", "G4", "B4"], "Cmaj7");
    });

    it("detects G dominant 7th", () => {
      testChord(["G3", "B3", "D4", "F4"], "G7");
    });

    it("detects A minor 7th", () => {
      testChord(["A3", "C4", "E4", "G4"], "Am7");
    });
  });

  describe("detectChord - 9 Chords", () => {
    it("detects A minor 11", () => {
      testChord(["A3", "B3", "C4", "E4", "G4"], "Am9");
      testChord(["A3", "C4", "E4", "G4", "B4"], "Am9");
    });
  });

  describe("detectChord - 11 Chords", () => {
    it("detects A minor 11", () => {
      testChord(["A3", "C4", "D4", "E4", "G4", "B4"], "Am11");
      testChord(["A3", "C4", "E4", "G4", "B4", "D5"], "Am11");
    });
  });

  describe("detectChord - 13 Chords", () => {
    it("detects C13", () => {
      testChord(["C4", "E4", "A4", "Bb4", "D5"], "C13");
    });

    it("detects Dm13", () => {
      testChord(["D4", "F4", "B4", "C5", "E5"], "Dm13");
    });
  });

  describe("detectChord - Suspended Chords", () => {
    it("detects Csus4", () => {
      testChord(["C4", "F4", "G4"], "Csus4");
    });

    it("detects Dsus2", () => {
      testChord(["D4", "E4", "A4"], "Dsus2");
    });

    it("detects G7sus4", () => {
      testChord(["G3", "C4", "D4", "F4"], "G7sus4");
    });

    it("detects A7sus2", () => {
      testChord(["A3", "B3", "E4", "G4"], "A7sus2");
    });
  });

  describe("detectChord - Add Chords (without 7th)", () => {
    it("detects Cadd9", () => {
      testChord(["C4", "D4", "E4", "G4"], "Cadd9");
    });

    it("detects Dm(add9)", () => {
      testChord(["D4", "E4", "F4", "A4"], "Dm(add9)");
    });

    it("detects Cadd11", () => {
      testChord(["C4", "E4", "F4", "G4"], "Cadd11");
    });

    it("detects Am(add11)", () => {
      testChord(["A3", "C4", "D4", "E4"], "Am(add11)");
    });
  });

  describe("detectChord - 6th and 6/9 Chords", () => {
    it("detects C6", () => {
      testChord(["C4", "E4", "G4", "A4"], "C6");
    });

    it("detects Am6", () => {
      testChord(["A3", "C4", "E4", "F#4"], "Am6");
    });

    it("detects C6/9", () => {
      testChord(["C4", "D4", "E4", "G4", "A4"], "C6/9");
    });

    it("detects Dm6/9", () => {
      testChord(["D4", "E4", "F4", "A4", "B4"], "Dm6/9");
    });
  });

  describe("detectChord - Altered Dominant Chords", () => {
    it("detects G7b5", () => {
      testChord(["G3", "B3", "Db4", "F4"], "G7b5");
    });

    it("detects C7#5", () => {
      testChord(["C4", "E4", "G#4", "Bb4"], "C7#5");
    });

    it("detects D7b9", () => {
      testChord(["D4", "F#4", "A4", "C5", "Eb5"], "D7b9");
    });

    it("detects E7#9", () => {
      testChord(["E4", "G#4", "B4", "D5", "G5"], "E7#9");
    });

    it("detects G7#11", () => {
      testChord(["G3", "B3", "D4", "F4", "C#5"], "G7#11");
    });
  });

  describe("detectChord - Diminished and Half-Diminished", () => {
    it("detects Bdim", () => {
      testChord(["B3", "D4", "F4"], "Bdim");
    });

    it("detects Bdim7 (enharmonic with Ddim7, Fdim7, Abdim7)", () => {
      // Diminished 7th chords are symmetrical - any note can be the root
      // The detector may choose any of the enharmonic equivalents
      const result = detectChord(midiNotes("B3", "D4", "F4", "Ab4"), false);
      expect(["Bdim7", "Ddim7", "Fdim7", "Abdim7"]).toContain(result);
    });

    it("detects Bm7b5 (half-diminished)", () => {
      testChord(["B3", "D4", "F4", "A4"], "Bm7b5");
    });

    it("detects F#dim7 (enharmonic with Adim7, Cdim7, Ebdim7)", () => {
      // Diminished 7th chords are symmetrical - any note can be the root
      const result = detectChord(midiNotes("F#4", "A4", "C5", "Eb5"), false);
      expect(["F#dim7", "Adim7", "Cdim7", "Ebdim7", "Gbdim7"]).toContain(result);
    });
  });

  describe("detectChord - Augmented Chords", () => {
    it("detects Caug", () => {
      testChord(["C4", "E4", "G#4"], "Caug");
    });

    it("detects Ebaug", () => {
      testChord(["Eb4", "G4", "B4"], "Ebaug", { key: "Eb" });
    });

    it("detects C7#5 (augmented 7th)", () => {
      testChord(["C4", "E4", "G#4", "Bb4"], "C7#5");
    });

    it("detects Cmaj7#5", () => {
      testChord(["C4", "E4", "G#4", "B4"], "Cmaj7#5");
    });
  });

  describe("detectChord - Power Chords", () => {
    it("detects C5 (power chord)", () => {
      testChord(["C3", "G3"], "C5");
    });

    it("detects E5 (power chord)", () => {
      testChord(["E2", "B2"], "E5");
    });
  });

  describe("detectChord - Complex Voicings", () => {
    it("detects Cmaj9 (full voicing)", () => {
      testChord(["C4", "E4", "G4", "B4", "D5"], "Cmaj9");
    });

    it("detects Gmaj7#11", () => {
      testChord(["G3", "B3", "D4", "F#4", "C#5"], "Gmaj7#11");
    });

    it("detects Cmaj7 without 5th", () => {
      testChord(["C4", "E4", "B4"], "Cmaj7");
    });

    it("detects Em9 without 5th", () => {
      testChord(["E4", "G4", "D5", "F#5"], "Em9");
    });

    it("detects Em7b5 (can also be interpreted as Gm6/E)", () => {
      testChord(["E4", "G4", "Bb4", "D5"], "Em7b5");
    });
  });

  describe("detectChord - Minor Major 7th", () => {
    it("detects Cm(maj7)", () => {
      testChord(["C4", "Eb4", "G4", "B4"], "Cm(maj7)");
    });

    it("detects Am(maj9)", () => {
      testChord(["A3", "C4", "E4", "G#4", "B4"], "Am(maj9)");
    });
  });

  describe("detectChord - Single Notes", () => {
    it("detects single note C", () => {
      testChord(["C4"], "C");
    });

    it("detects single note F#", () => {
      testChord(["F#5"], "F#");
    });
  });

  describe("detectChord - Key Signature (Sharps vs Flats)", () => {
    it("uses sharps in G major", () => {
      testChord(["C4", "E4", "G#4"], "Caug", { key: "G" });
    });

    it("uses flats in F major", () => {
      testChord(["C4", "Eb4", "Gb4"], "Cdim", { key: "F" });
    });

    it("uses flats in Ab major", () => {
      testChord(["Ab3", "C4", "Eb4"], "Ab", { key: "Ab" });
    });

    it("uses sharps in E major", () => {
      testChord(["E4", "G#4", "B4"], "E", { key: "E" });
    });

    it("uses flats in Bb major", () => {
      testChord(["Bb3", "D4", "F4"], "Bb", { key: "Bb" });
    });

    it("defaults to sharps when no key is provided", () => {
      testChord(["C4", "E4", "G#4"], "Caug");
    });

    it("shows correct note spelling for D# vs Eb based on key", () => {
      const sharpResult = detectChord(midiNotes("D#4"), false, "E");
      const flatResult = detectChord(midiNotes("D#4"), false, "Eb");
      expect(sharpResult).toBe("D#");
      expect(flatResult).toBe("Eb");
    });
  });

  describe("detectChord - Slash Chords with Key Signature", () => {
    it("uses flats in slash chords for flat keys", () => {
      testChord(["Bb2", "D4", "F4", "A4"], "Bbmaj7", { key: "Bb" });
      testChord(["Bb2", "D4", "F4", "A4"], "A#maj7", { key: "G" });
    });

    it("uses sharps in slash chords for sharp keys", () => {
      testChord(["F#2", "A3", "C#4", "E4"], "F#m7", { key: "D" });
      testChord(["F#2", "A3", "C#4", "E4"], "Gbm7", { key: "Bb" });
    });

    it("handles slash chord with flat spelling", () => {
      testChord(["Gb2", "Bb3", "Db4", "F4"], "Gbmaj7", { key: "Gb" });
      testChord(["Gb2", "Bb3", "Db4", "F4"], "F#maj7", { key: "G" });
    });

    it("detects slash chord with flat spelling (first inversion)", () => {
      testChord(["Bb3", "Eb4", "G4"], "Eb/Bb", { key: "Eb" });
      testChord(["Bb3", "Eb4", "G4"], "D#/A#", { key: "G" });
    });

    it("detects slash chord with sharp spelling (first inversion)", () => {
      testChord(["F#2", "D3", "F#3", "A3"], "D/F#", { key: "D" });
      testChord(["F#2", "D3", "F#3", "A3"], "D/Gb", { key: "Bb" });
    });
  });

  describe("detectChord - Single Notes with Key Signature", () => {
    it("displays single note with flat in flat key", () => {
      testChord(["Ab4"], "Ab", { key: "Ab" });
    });

    it("displays single note with sharp in sharp key", () => {
      testChord(["F#4"], "F#", { key: "G" });
    });

    it("displays single note C# as Db in flat key", () => {
      testChord(["C#4"], "Db", { key: "Db" });
    });

    it("displays single note Db as C# in sharp key", () => {
      testChord(["Db4"], "C#", { key: "D" });
    });
  });

  describe("midiNote helper function", () => {
    it("should convert C4 (middle C) to MIDI 60", () => {
      expect(midiNote("C4")).toBe(60);
    });

    it("should convert A4 to MIDI 69", () => {
      expect(midiNote("A4")).toBe(69);
    });

    it("should convert C#4 to MIDI 61", () => {
      expect(midiNote("C#4")).toBe(61);
    });

    it("should convert Db4 to MIDI 61 (enharmonic equivalent)", () => {
      expect(midiNote("Db4")).toBe(61);
    });

    it("should handle low octaves like C0", () => {
      expect(midiNote("C0")).toBe(12);
    });

    it("should handle high octaves like C8", () => {
      expect(midiNote("C8")).toBe(108);
    });
  });
});
