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
