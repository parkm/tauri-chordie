// src/ChordDetector.ts

// Consider moving to a shared constants/utils file if also used elsewhere
const NOTE_NAMES: { [key: number]: string } = {
  0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B",
};

// Function to get note name without octave for pitch class comparisons
function getPitchClassName(noteNumber: number): string {
  const pc = noteNumber % 12;
  return NOTE_NAMES[pc] || `UnknownPC(${pc})`;
}

// Function to get note name with octave
function getNoteNameWithOctave(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1;
  const note = NOTE_NAMES[noteNumber % 12];
  return note ? `${note}${octave}` : `N${noteNumber}`;
}

// Intervals are relative to the root in semitones.
// The order of intervals in the array matters for matching.
// More specific chords (more notes) should generally be listed before less specific ones
// to ensure they are matched correctly if they share a common subset of intervals.
const CHORD_DEFINITIONS: { [type: string]: { intervals: number[], nameSuffix: string, quality: string } } = {
  // Sevenths and extended
  MAJOR_SEVENTH: { intervals: [0, 4, 7, 11], nameSuffix: "maj7", quality: "maj7" },
  MINOR_SEVENTH: { intervals: [0, 3, 7, 10], nameSuffix: "m7", quality: "m7" },
  DOMINANT_SEVENTH: { intervals: [0, 4, 7, 10], nameSuffix: "7", quality: "7" },
  DIMINISHED_SEVENTH: { intervals: [0, 3, 6, 9], nameSuffix: "dim7", quality: "dim7" }, // o7
  HALF_DIMINISHED_SEVENTH: { intervals: [0, 3, 6, 10], nameSuffix: "m7b5", quality: "m7b5" }, // ø7
  AUGMENTED_MAJOR_SEVENTH: { intervals: [0, 4, 8, 11], nameSuffix: "maj7#5", quality: "maj7#5" },
  AUGMENTED_SEVENTH: { intervals: [0, 4, 8, 10], nameSuffix: "7#5", quality: "7#5" },
  SEVENTH_FLAT_FIVE: { intervals: [0, 4, 6, 10], nameSuffix: "7b5", quality: "7b5"},
  MINOR_MAJOR_SEVENTH: { intervals: [0, 3, 7, 11], nameSuffix: "m(maj7)", quality: "m(maj7)"},

  // Sixths
  MAJOR_SIXTH: { intervals: [0, 4, 7, 9], nameSuffix: "6", quality: "6" },
  MINOR_SIXTH: { intervals: [0, 3, 7, 9], nameSuffix: "m6", quality: "m6" },

  // Triads
  MAJOR_TRIAD: { intervals: [0, 4, 7], nameSuffix: "", quality: "M" },
  MINOR_TRIAD: { intervals: [0, 3, 7], nameSuffix: "m", quality: "m" },
  AUGMENTED_TRIAD: { intervals: [0, 4, 8], nameSuffix: "aug", quality: "aug" },
  DIMINISHED_TRIAD: { intervals: [0, 3, 6], nameSuffix: "dim", quality: "dim" },

  // Suspended and other
  SUS4_TRIAD: { intervals: [0, 5, 7], nameSuffix: "sus4", quality: "sus4" },
  SUS2_TRIAD: { intervals: [0, 2, 7], nameSuffix: "sus2", quality: "sus2" },
  SEVENTH_SUS4: { intervals: [0, 5, 7, 10], nameSuffix: "7sus4", quality: "7sus4"},

  // Extended chords (basic versions, can be expanded with alterations)
  // For simplicity, these check for the presence of the extension *and* the 7th.
  // More advanced logic could handle "add9" without a 7th, or implied 7ths.
  MAJOR_NINTH: { intervals: [0, 4, 7, 11, 2], nameSuffix: "maj9", quality: "maj9"}, // 14 becomes 2 (octave)
  MINOR_NINTH: { intervals: [0, 3, 7, 10, 2], nameSuffix: "m9", quality: "m9"},
  DOMINANT_NINTH: { intervals: [0, 4, 7, 10, 2], nameSuffix: "9", quality: "9"},

  MAJOR_ELEVENTH: { intervals: [0, 4, 7, 11, 2, 5], nameSuffix: "maj11", quality: "maj11"}, // 14, 17 -> 2, 5
  MINOR_ELEVENTH: { intervals: [0, 3, 7, 10, 2, 5], nameSuffix: "m11", quality: "m11"},
  DOMINANT_ELEVENTH: { intervals: [0, 4, 7, 10, 2, 5], nameSuffix: "11", quality: "11"}, // Often #11 or implied notes

  MAJOR_THIRTEENTH: { intervals: [0, 4, 7, 11, 2, 5, 9], nameSuffix: "maj13", quality: "maj13"}, // 14, 17, 21 -> 2, 5, 9
  MINOR_THIRTEENTH: { intervals: [0, 3, 7, 10, 2, 5, 9], nameSuffix: "m13", quality: "m13"},
  DOMINANT_THIRTEENTH: { intervals: [0, 4, 7, 10, 2, 5, 9], nameSuffix: "13", quality: "13"},

  // Add more altered dominant chords etc. as needed
  // Example: 7#9
  DOMINANT_SEVENTH_SHARP_NINE: { intervals: [0, 4, 7, 10, 3], nameSuffix: "7#9", quality: "7#9" }, // 15 becomes 3
  DOMINANT_SEVENTH_FLAT_NINE: { intervals: [0, 4, 7, 10, 1], nameSuffix: "7b9", quality: "7b9" }, // 13 becomes 1

  // Power chord (root and fifth)
  POWER_CHORD: { intervals: [0, 7], nameSuffix: "5", quality: "5"},
};

// Sort definitions by number of intervals descending, then by suffix length descending
// This helps ensure more specific chords (e.g., Cmaj7) are matched before less specific ones (e.g., C)
// if the less specific one is a subset of the notes of the more specific one when considering only pitch classes.
const SORTED_CHORD_DEFINITIONS = Object.entries(CHORD_DEFINITIONS)
  .sort(([keyA, valA], [keyB, valB]) => {
    const intervalDiff = valB.intervals.length - valA.intervals.length;
    if (intervalDiff !== 0) return intervalDiff;
    return valB.nameSuffix.length - valA.nameSuffix.length; // Prefer longer (more specific) suffixes
  })
  .map(([key, value]) => ({ id: key, ...value }));

// --- Chord Definitions ---

// Base chord qualities: Intervals relative to the root.
// Sorted by number of notes (desc) to prioritize fuller base chords.
const BASE_CHORD_QUALITIES: { [name: string]: { intervals: number[], suffix: string } } = {
  MAJOR_SEVENTH: { intervals: [0, 4, 7, 11], suffix: "maj7" },
  DOMINANT_SEVENTH: { intervals: [0, 4, 7, 10], suffix: "7" },
  MINOR_SEVENTH: { intervals: [0, 3, 7, 10], suffix: "m7" },
  MINOR_MAJOR_SEVENTH: { intervals: [0, 3, 7, 11], suffix: "m(maj7)" },
  HALF_DIMINISHED_SEVENTH: { intervals: [0, 3, 6, 10], suffix: "m7b5" }, // ø7
  DIMINISHED_SEVENTH: { intervals: [0, 3, 6, 9], suffix: "dim7" },     // o7
  AUGMENTED_MAJOR_SEVENTH: { intervals: [0, 4, 8, 11], suffix: "maj7#5" },
  AUGMENTED_SEVENTH: { intervals: [0, 4, 8, 10], suffix: "7#5" }, // +7
  SEVENTH_FLAT_FIVE: { intervals: [0, 4, 6, 10], suffix: "7b5" },
  SEVENTH_SUS4: { intervals: [0, 5, 7, 10], suffix: "7sus4" },
  MAJOR_SIXTH: { intervals: [0, 4, 7, 9], suffix: "6" },
  MINOR_SIXTH: { intervals: [0, 3, 7, 9], suffix: "m6" },

  MAJOR_TRIAD: { intervals: [0, 4, 7], suffix: "" },
  MINOR_TRIAD: { intervals: [0, 3, 7], suffix: "m" },
  AUGMENTED_TRIAD: { intervals: [0, 4, 8], suffix: "aug" },
  DIMINISHED_TRIAD: { intervals: [0, 3, 6], suffix: "dim" },
  SUS4_TRIAD: { intervals: [0, 5, 7], suffix: "sus4" },
  SUS2_TRIAD: { intervals: [0, 2, 7], suffix: "sus2" },

  POWER_CHORD: { intervals: [0, 7], suffix: "5" }, // For two-note case
};

const SORTED_BASE_CHORD_QUALITIES = Object.values(BASE_CHORD_QUALITIES).sort(
  (a, b) => b.intervals.length - a.intervals.length
);

// Extension and Alteration Definitions: Interval from root and its typical notation
// Note: These are simplified. Some extensions imply others (e.g., 13th often implies 7th and 9th).
// The logic will need to be smart about how these are added to the name.
const EXTENSIONS_ALTERATIONS: { [interval: number]: string } = {
  1: "b9",   // Minor 2nd / flat 9th
  2: "9",    // Major 2nd / 9th
  3: "#9",   // Augmented 2nd / sharp 9th
  // 4: "3", // Major 3rd (part of base chord)
  // 5: "4", // Perfect 4th (can be sus, or 11th)
  6: "#11",  // Augmented 4th / sharp 11th (also b5 for base chord)
  // 7: "5", // Perfect 5th (part of base chord)
  8: "b13", // Augmented 5th / flat 13th (also #5 for base chord)
  9: "13",   // Major 6th / 13th
  // 10: "b7", // Minor 7th (part of base chord)
  // 11: "maj7" // Major 7th (part of base chord)
};

// Specific handling for 11ths because a natural 11 clashes with major 3rd.
// It's typically #11 or used in minor/dominant chords where 3rd is minor or can be omitted/altered.
const NATURAL_ELEVENTH_INTERVAL = 5; // Perfect 4th

// --- Chord Detection Logic ---

interface DetectedBaseChord {
  rootPc: number;
  qualityName: string; // e.g. "MAJOR_SEVENTH"
  suffix: string;
  baseNotesPc: Set<number>; // Pitch classes forming the base chord
  score: number; // Higher is better (e.g., number of notes matched)
}

export function detectChord(midiNotes: number[]): string {
  if (!midiNotes || midiNotes.length === 0) return "";

  const sortedUniqueMidiNotes = [...new Set(midiNotes)].sort((a, b) => a - b);

  if (sortedUniqueMidiNotes.length === 1) {
    return getNoteNameWithOctave(sortedUniqueMidiNotes[0]);
  }

  const inputPitchClasses = new Set(sortedUniqueMidiNotes.map(n => n % 12));
  const sortedUniquePitchClasses = Array.from(inputPitchClasses).sort((a, b) => a - b);

  if (sortedUniquePitchClasses.length < 2) {
    // Should be caught by sortedUniqueMidiNotes.length === 1, but as a safeguard
    if (sortedUniquePitchClasses.length === 1) {
      return getNoteNameWithOctave(sortedUniqueMidiNotes[0]);
    }
    return "Requires at least 2 unique pitch classes";
  }

  let bestBaseChordMatch: DetectedBaseChord | null = null;

  // 1. Find the best base chord
  for (const potentialRootPc of sortedUniquePitchClasses) {
    for (const quality of SORTED_BASE_CHORD_QUALITIES) {
      const currentBaseNotesPc = new Set<number>();
      currentBaseNotesPc.add(potentialRootPc); // Add the root
      let allBaseNotesPresent = true;

      for (let i = 1; i < quality.intervals.length; i++) { // Start from 1, as 0 is root
        const intervalNotePc = (potentialRootPc + quality.intervals[i]) % 12;
        if (inputPitchClasses.has(intervalNotePc)) {
          currentBaseNotesPc.add(intervalNotePc);
        } else {
          allBaseNotesPresent = false;
          break;
        }
      }

      if (allBaseNotesPresent) {
        // All notes for this quality (rooted at potentialRootPc) are in the input
        // Score by number of notes in the base chord type
        const score = quality.intervals.length;
        if (!bestBaseChordMatch || score > bestBaseChordMatch.score) {
          bestBaseChordMatch = {
            rootPc: potentialRootPc,
            qualityName: Object.keys(BASE_CHORD_QUALITIES).find(k => BASE_CHORD_QUALITIES[k] === quality) || "UnknownQuality",
            suffix: quality.suffix,
            baseNotesPc: currentBaseNotesPc,
            score: score,
          };
        }
        // If score is the same, we could add tie-breaking logic (e.g. prefer lowest root note)
        // For now, first one found with highest score (due to sorted qualities) wins for this root.
      }
    }
  }

  // If after checking all roots, we still prefer the one found for an earlier root, that's fine.
  // The outer loop (potentialRootPc) ensures we try all possibilities.

  if (!bestBaseChordMatch) {
    // Fallback for very sparse chords not matching any base triad/seventh
    if (sortedUniquePitchClasses.length === 2) {
        const interval = (sortedUniquePitchClasses[1] - sortedUniquePitchClasses[0] + 12) % 12;
        if (interval === 7) { // Perfect fifth -> Power Chord
            const rootName = NOTE_NAMES[sortedUniquePitchClasses[0]];
            let chordName = `${rootName}5`;
            const bassNotePc = sortedUniqueMidiNotes[0] % 12;
            if (bassNotePc !== sortedUniquePitchClasses[0]) {
                chordName += `/${NOTE_NAMES[bassNotePc]}`;
            }
            return chordName;
        }
    }
    const noteNames = sortedUniqueMidiNotes.map(getNoteNameWithOctave);
    return noteNames.length > 0 ? `Notes: ${noteNames.join(", ")}` : "Unknown Chord";
  }

  // 2. Identify extensions and alterations
  const rootNoteName = NOTE_NAMES[bestBaseChordMatch.rootPc];
  let chordName = `${rootNoteName}${bestBaseChordMatch.suffix}`;

  const remainingPitchClasses = new Set<number>();
  for (const pc of inputPitchClasses) {
    if (!bestBaseChordMatch.baseNotesPc.has(pc)) {
      remainingPitchClasses.add(pc);
    }
  }

  const extensionsStrings: string[] = [];
  if (remainingPitchClasses.size > 0) {
    const sortedRemainingPc = Array.from(remainingPitchClasses).sort((a,b) => a-b);

    // Special check for natural 11th (interval 5) if base is major or dominant
    // Only add "11" if it's a natural 11th and the chord context allows it (e.g. minor, or sus)
    // For major/dominant, prefer #11 if interval 6 is present.
    const isMajorOrDominantBase = bestBaseChordMatch.suffix.includes("maj") || (!bestBaseChordMatch.suffix.includes("m") && !bestBaseChordMatch.suffix.includes("dim") && !bestBaseChordMatch.suffix.includes("sus"));

    for (const pc of sortedRemainingPc) {
      const intervalFromRoot = (pc - bestBaseChordMatch.rootPc + 12) % 12;

      if (intervalFromRoot === NATURAL_ELEVENTH_INTERVAL) { // Natural 11th (P4)
        // Add "11" for minor, dominant (if not clashing too hard), or sus chords.
        // Avoid for major chords unless it's specifically a "maj7(11)" or similar structure
        // This logic is simplified; true "11" chords often omit the 3rd.
        if (bestBaseChordMatch.suffix.includes("m") || bestBaseChordMatch.suffix.includes("sus") || bestBaseChordMatch.suffix.includes("7")) {
          // Avoid adding "11" if "#11" (interval 6) is also present or will be added.
          if (!remainingPitchClasses.has((bestBaseChordMatch.rootPc + 6) % 12) && !EXTENSIONS_ALTERATIONS[6]) {
             extensionsStrings.push("11");
          }
        }
        // If it's a major type chord, a natural 11th is usually part of a "add4" or complex sus, not a typical "maj11"
        // Or it's an error/unusual voicing. We might list it as an "add4" or ignore if #11 is preferred.
        // For now, we are cautious about adding natural "11" to major chords.
        continue; // Handled, move to next remaining PC
      }

      if (EXTENSIONS_ALTERATIONS[intervalFromRoot]) {
        extensionsStrings.push(EXTENSIONS_ALTERATIONS[intervalFromRoot]);
      } else {
        // Unhandled interval, could be an alteration of a base chord tone not yet defined
        // e.g. if base is Cmaj7 (C E G B) and extra note is F# (interval 6 from C)
        // and 6 is defined as #11. If 6 wasn't in EXTENSIONS_ALTERATIONS, it would be "other".
        // For now, we'll just ignore "other" unmapped intervals relative to the root.
      }
    }
  }

  // Combine and sort extensions (b9, 9, #9, 11, #11, b13, 13)
  // Sorting order for extensions: typically by number (9, 11, 13) and then alteration (b, natural, #)
  const sortOrder: { [key: string]: number } = {
    "b9": 1, "9": 2, "#9": 3,
    "11": 4, "#11": 5, // natural 11 handled carefully
    "b13": 6, "13": 7,
    // alterations of base chord tones like b5, #5 are part of suffix
  };

  extensionsStrings.sort((a, b) => (sortOrder[a] || 99) - (sortOrder[b] || 99));

  if (extensionsStrings.length > 0) {
    // Logic to simplify chord names, e.g. C7 with "9" becomes C9, not C7(9)
    // Cmaj7 with "9" becomes Cmaj9
    // Cm7 with "9" becomes Cm9
    // C7 with "b9" becomes C7(b9)
    const baseIsSeventh = bestBaseChordMatch.suffix.endsWith("7") || bestBaseChordMatch.suffix.endsWith("6"); // or 6th

    if (baseIsSeventh && extensionsStrings.includes("9") && !extensionsStrings.includes("b9") && !extensionsStrings.includes("#9")) {
        if(bestBaseChordMatch.suffix === "7") chordName = rootNoteName + "9";
        else if(bestBaseChordMatch.suffix === "maj7") chordName = rootNoteName + "maj9";
        else if(bestBaseChordMatch.suffix === "m7") chordName = rootNoteName + "m9";
        else chordName += `(${extensionsStrings.join("")})`; // fallback C6(9)
        // Remove "9" as it's incorporated, keep other alterations like #11, 13
        const nineIndex = extensionsStrings.indexOf("9");
        if (nineIndex > -1) extensionsStrings.splice(nineIndex, 1);
         if (extensionsStrings.length > 0) { // Add remaining (e.g. #11, 13)
            chordName += `(${extensionsStrings.join("")})`;
        }
    } else if (extensionsStrings.length > 0) {
         chordName += `(${extensionsStrings.join("")})`;
    }
  }


  // 3. Add slash chord notation for inversion
  const bassNoteMidi = sortedUniqueMidiNotes[0];
  const bassNotePc = bassNoteMidi % 12;
  if (bassNotePc !== bestBaseChordMatch.rootPc) {
    chordName += `/${NOTE_NAMES[bassNotePc]}`;
  }

  return chordName;
}