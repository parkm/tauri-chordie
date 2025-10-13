// src/ChordDetector.test.ts
import { describe, it, expect } from 'vitest';
import { detectChord } from './ChordDetector';

/**
 * Helper function to convert MIDI note names to MIDI numbers.
 * Example: midiNote("C4") returns 60
 *
 * Supports note names like C4, C#4, Db4, etc.
 * Middle C (C4) = MIDI 60
 */
export function midiNote(noteName: string): number {
  const noteMap: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11,
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
 */
export function testChord(noteNames: string[], expectedChord: string): void {
  const notes = midiNotes(...noteNames);
  const result = detectChord(notes);
  expect(result).toBe(expectedChord);
}

describe('ChordDetector', () => {
  describe('detectChord - Major Triads', () => {
    it('detects C major', () => {
      testChord(['C4', 'E4', 'G4'], 'C');
    });

    it('detects D major', () => {
      testChord(['D4', 'F#4', 'A4'], 'D');
    });

    it('detects G major', () => {
      testChord(['G3', 'B3', 'D4'], 'G');
    });
  });

  describe('detectChord - Minor Triads', () => {
    it('detects A minor', () => {
      testChord(['A3', 'C4', 'E4'], 'Am');
    });

    it('detects D minor', () => {
      testChord(['D4', 'F4', 'A4'], 'Dm');
    });
  });

  describe('detectChord - Seventh Chords', () => {
    it('detects C major 7th', () => {
      testChord(['C4', 'E4', 'G4', 'B4'], 'Cmaj7');
    });

    it('detects G dominant 7th', () => {
      testChord(['G3', 'B3', 'D4', 'F4'], 'G7');
    });

    it('detects A minor 7th', () => {
      testChord(['A3', 'C4', 'E4', 'G4'], 'Am7');
    });
  });

  describe('detectChord - Single Notes', () => {
    it('detects single note C', () => {
      testChord(['C4'], 'C');
    });

    it('detects single note F#', () => {
      testChord(['F#5'], 'F#');
    });
  });

  describe('midiNote helper function', () => {
    it('should convert C4 (middle C) to MIDI 60', () => {
      expect(midiNote('C4')).toBe(60);
    });

    it('should convert A4 to MIDI 69', () => {
      expect(midiNote('A4')).toBe(69);
    });

    it('should convert C#4 to MIDI 61', () => {
      expect(midiNote('C#4')).toBe(61);
    });

    it('should convert Db4 to MIDI 61 (enharmonic equivalent)', () => {
      expect(midiNote('Db4')).toBe(61);
    });

    it('should handle low octaves like C0', () => {
      expect(midiNote('C0')).toBe(12);
    });

    it('should handle high octaves like C8', () => {
      expect(midiNote('C8')).toBe(108);
    });
  });
});

