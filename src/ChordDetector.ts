// src/ChordDetector.ts

// Note names with sharps (default)
const NOTE_NAMES_SHARP: { [key: number]: string } = {
  0: "C",
  1: "C#",
  2: "D",
  3: "D#",
  4: "E",
  5: "F",
  6: "F#",
  7: "G",
  8: "G#",
  9: "A",
  10: "A#",
  11: "B",
};

// Note names with flats
const NOTE_NAMES_FLAT: { [key: number]: string } = {
  0: "C",
  1: "Db",
  2: "D",
  3: "Eb",
  4: "E",
  5: "F",
  6: "Gb",
  7: "G",
  8: "Ab",
  9: "A",
  10: "Bb",
  11: "B",
};

// Keys that use flats
const FLAT_KEYS = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb"];

// Get the appropriate note names based on key
function getNoteNames(key?: string): { [key: number]: string } {
  if (key && FLAT_KEYS.includes(key)) {
    return NOTE_NAMES_FLAT;
  }
  return NOTE_NAMES_SHARP;
}

// --- ADVANCED CHORD DETECTION SYSTEM ---

interface ChordDefinition {
  intervals: number[];
  symbol: string;
  name: string;
  priority: number;
  requiresAll?: boolean; // If true, all intervals must be present
}

// Comprehensive chord database with proper priorities
const CHORD_DATABASE: ChordDefinition[] = [
  // === TRIADS (Highest Priority) ===
  { intervals: [0, 4, 7], symbol: "", name: "Major", priority: 1000, requiresAll: true },
  { intervals: [0, 3, 7], symbol: "m", name: "Minor", priority: 1000, requiresAll: true },
  { intervals: [0, 4, 8], symbol: "aug", name: "Augmented", priority: 1000, requiresAll: true },
  { intervals: [0, 3, 6], symbol: "dim", name: "Diminished", priority: 1000, requiresAll: true },
  { intervals: [0, 5, 7], symbol: "sus4", name: "Suspended 4th", priority: 950, requiresAll: true },
  { intervals: [0, 2, 7], symbol: "sus2", name: "Suspended 2nd", priority: 950, requiresAll: true },

  // === SEVENTH CHORDS ===
  { intervals: [0, 4, 7, 11], symbol: "maj7", name: "Major 7th", priority: 900, requiresAll: true },
  { intervals: [0, 4, 7, 10], symbol: "7", name: "Dominant 7th", priority: 900, requiresAll: true },
  { intervals: [0, 3, 7, 10], symbol: "m7", name: "Minor 7th", priority: 900, requiresAll: true },
  { intervals: [0, 3, 7, 11], symbol: "m(maj7)", name: "Minor Major 7th", priority: 850, requiresAll: true },
  { intervals: [0, 3, 6, 10], symbol: "m7b5", name: "Half Diminished", priority: 850, requiresAll: true },
  { intervals: [0, 3, 6, 9], symbol: "dim7", name: "Diminished 7th", priority: 850, requiresAll: true },
  { intervals: [0, 4, 8, 10], symbol: "aug7", name: "Augmented 7th", priority: 800, requiresAll: true },
  { intervals: [0, 4, 8, 11], symbol: "maj7#5", name: "Major 7th Sharp 5", priority: 800, requiresAll: true },
  { intervals: [0, 5, 7, 10], symbol: "7sus4", name: "7th Suspended 4th", priority: 750, requiresAll: true },
  { intervals: [0, 2, 7, 10], symbol: "7sus2", name: "7th Suspended 2nd", priority: 750, requiresAll: true },

  // === SIXTH CHORDS ===
  { intervals: [0, 4, 7, 9], symbol: "6", name: "Major 6th", priority: 850, requiresAll: true },
  { intervals: [0, 3, 7, 9], symbol: "m6", name: "Minor 6th", priority: 850, requiresAll: true },
  { intervals: [0, 4, 7, 9, 2], symbol: "6/9", name: "6th Add 9", priority: 800, requiresAll: true },
  { intervals: [0, 3, 7, 9, 2], symbol: "m6/9", name: "Minor 6th Add 9", priority: 800, requiresAll: true },

  // === NINTH CHORDS ===
  { intervals: [0, 4, 7, 10, 2], symbol: "9", name: "Dominant 9th", priority: 700, requiresAll: false },
  { intervals: [0, 4, 7, 11, 2], symbol: "maj9", name: "Major 9th", priority: 700, requiresAll: false },
  { intervals: [0, 3, 7, 10, 2], symbol: "m9", name: "Minor 9th", priority: 700, requiresAll: false },
  { intervals: [0, 3, 7, 11, 2], symbol: "m(maj9)", name: "Minor Major 9th", priority: 650, requiresAll: false },
  { intervals: [0, 4, 7, 10, 1], symbol: "7b9", name: "7th Flat 9", priority: 650, requiresAll: false },
  { intervals: [0, 4, 7, 10, 3], symbol: "7#9", name: "7th Sharp 9", priority: 650, requiresAll: false },

  // === ELEVENTH CHORDS ===
  { intervals: [0, 4, 7, 10, 2, 5], symbol: "11", name: "11th", priority: 600, requiresAll: false },
  { intervals: [0, 3, 7, 10, 2, 5], symbol: "m11", name: "Minor 11th", priority: 600, requiresAll: false },
  { intervals: [0, 4, 7, 10, 6], symbol: "7#11", name: "7th Sharp 11", priority: 580, requiresAll: false },
  { intervals: [0, 4, 7, 11, 6], symbol: "maj7#11", name: "Major 7th Sharp 11", priority: 580, requiresAll: false },

  // === THIRTEENTH CHORDS ===
  { intervals: [0, 4, 7, 10, 2, 9], symbol: "13", name: "13th", priority: 550, requiresAll: false },
  { intervals: [0, 3, 7, 10, 2, 9], symbol: "m13", name: "Minor 13th", priority: 550, requiresAll: false },
  { intervals: [0, 4, 7, 10, 8], symbol: "7b13", name: "7th Flat 13", priority: 530, requiresAll: false },

  // === ADD CHORDS ===
  { intervals: [0, 4, 7, 2], symbol: "add9", name: "Add 9", priority: 500, requiresAll: true },
  { intervals: [0, 3, 7, 2], symbol: "m(add9)", name: "Minor Add 9", priority: 500, requiresAll: true },
  { intervals: [0, 4, 7, 5], symbol: "add11", name: "Add 11", priority: 450, requiresAll: true },
  { intervals: [0, 4, 7, 6], symbol: "add#11", name: "Add Sharp 11", priority: 450, requiresAll: true },

  // === ALTERED CHORDS ===
  { intervals: [0, 4, 6, 10], symbol: "7b5", name: "7th Flat 5", priority: 600, requiresAll: true },
  { intervals: [0, 4, 8, 10], symbol: "7#5", name: "7th Sharp 5", priority: 600, requiresAll: true },
  { intervals: [0, 3, 6, 10], symbol: "m7b5", name: "Minor 7th Flat 5", priority: 600, requiresAll: true },

  // === POWER CHORD (Lowest Priority) ===
  { intervals: [0, 7], symbol: "5", name: "Power Chord", priority: 100, requiresAll: true },
];

interface ChordMatch {
  root: number;
  chord: ChordDefinition;
  matchedIntervals: number[];
  coverage: number;
  exactness: number;
  score: number;
}

function analyzeChord(pitchClasses: Set<number>, enforceRootNote: boolean, lowestNote: number): ChordMatch[] {
  const matches: ChordMatch[] = [];
  const pcArray = Array.from(pitchClasses).sort((a, b) => a - b);

  // Determine root candidates
  const rootCandidates = enforceRootNote ? [lowestNote] : pcArray;

  for (const root of rootCandidates) {
    for (const chord of CHORD_DATABASE) {
      const matchedIntervals: number[] = [];

      // Check which intervals are present
      for (const interval of chord.intervals) {
        const noteClass = (root + interval) % 12;
        if (pitchClasses.has(noteClass)) {
          matchedIntervals.push(interval);
        }
      }

      // Calculate coverage
      const coverage = matchedIntervals.length / chord.intervals.length;

      // Skip if coverage is too low
      if (chord.requiresAll && coverage < 1.0) continue;
      if (!chord.requiresAll && coverage < 0.6) continue;

      // Calculate exactness (how well it fits without extra notes)
      const extraNotes = pcArray.length - matchedIntervals.length;
      const exactness = Math.max(0, 1 - extraNotes * 0.2);

      // Calculate final score
      const score = coverage * chord.priority * exactness;

      matches.push({
        root,
        chord,
        matchedIntervals,
        coverage,
        exactness,
        score,
      });
    }
  }

  // Sort by score (highest first)
  matches.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 1) {
      // If scores are very close, prefer higher coverage
      if (Math.abs(a.coverage - b.coverage) < 0.1) {
        // If coverage is also close, prefer higher priority
        return b.chord.priority - a.chord.priority;
      }
      return b.coverage - a.coverage;
    }
    return b.score - a.score;
  });

  return matches;
}

function buildChordName(params: {
  match: ChordMatch;
  allPitchClasses: Set<number>;
  bassNote: number;
  noteNames: { [key: number]: string };
}): string {
  const { match, allPitchClasses, bassNote, noteNames } = params;
  const rootName = noteNames[match.root];
  let chordName = rootName + match.chord.symbol;

  // Find unmatched notes for extensions
  const matchedNotes = new Set<number>();
  for (const interval of match.matchedIntervals) {
    matchedNotes.add((match.root + interval) % 12);
  }

  const unmatchedNotes: number[] = [];
  for (const pc of allPitchClasses) {
    if (!matchedNotes.has(pc)) {
      unmatchedNotes.push(pc);
    }
  }

  // Add extensions for unmatched notes
  if (unmatchedNotes.length > 0) {
    const extensions: string[] = [];

    for (const pc of unmatchedNotes) {
      const interval = (pc - match.root + 12) % 12;
      const extension = getExtensionSymbol(interval);
      if (extension) {
        extensions.push(extension);
      }
    }

    if (extensions.length > 0) {
      // Smart extension handling
      if (extensions.includes("9") && match.chord.symbol.includes("7")) {
        // Upgrade 7th to 9th chord
        if (match.chord.symbol === "7") {
          chordName = rootName + "9";
        } else if (match.chord.symbol === "maj7") {
          chordName = rootName + "maj9";
        } else if (match.chord.symbol === "m7") {
          chordName = rootName + "m9";
        }
        extensions.splice(extensions.indexOf("9"), 1);
      }

      if (extensions.length > 0) {
        chordName += `(${extensions.join(",")})`;
      }
    }
  }

  // Add slash notation for bass note
  if (bassNote !== match.root) {
    const bassName = noteNames[bassNote];
    chordName += `/${bassName}`;
  }

  return chordName;
}

function getExtensionSymbol(interval: number): string | null {
  const extensionMap: { [key: number]: string } = {
    1: "b9", // Minor 2nd
    2: "9", // Major 2nd / 9th
    3: "#9", // Augmented 2nd
    5: "11", // Perfect 4th / 11th
    6: "#11", // Tritone / #11
    8: "b13", // Minor 6th / b13
    9: "13", // Major 6th / 13th
    10: "7", // Minor 7th
    11: "maj7", // Major 7th
  };

  return extensionMap[interval] || null;
}

function findOverlappingTriads(params: { pitchClasses: Set<number>; noteNames: { [key: number]: string } }): string[] {
  const { pitchClasses, noteNames } = params;
  const triads: string[] = [];

  // Check all possible triads
  for (let root = 0; root < 12; root++) {
    const rootName = noteNames[root];

    // Major triad
    if (pitchClasses.has(root) && pitchClasses.has((root + 4) % 12) && pitchClasses.has((root + 7) % 12)) {
      triads.push(rootName);
    }

    // Minor triad
    if (pitchClasses.has(root) && pitchClasses.has((root + 3) % 12) && pitchClasses.has((root + 7) % 12)) {
      triads.push(rootName + "m");
    }

    // Augmented triad
    if (pitchClasses.has(root) && pitchClasses.has((root + 4) % 12) && pitchClasses.has((root + 8) % 12)) {
      triads.push(rootName + "aug");
    }

    // Diminished triad
    if (pitchClasses.has(root) && pitchClasses.has((root + 3) % 12) && pitchClasses.has((root + 6) % 12)) {
      triads.push(rootName + "dim");
    }
  }

  return triads;
}

function getIntervalName(interval: number): string {
  const intervalNames: { [key: number]: string } = {
    0: "R", // Root
    1: "b2", // Minor 2nd
    2: "2", // Major 2nd
    3: "b3", // Minor 3rd
    4: "3", // Major 3rd
    5: "4", // Perfect 4th
    6: "b5", // Tritone/Diminished 5th
    7: "5", // Perfect 5th
    8: "#5", // Augmented 5th
    9: "6", // Major 6th
    10: "b7", // Minor 7th
    11: "7", // Major 7th
  };

  return intervalNames[interval] || `+${interval}`;
}

function findBestRoot(pitchClasses: Set<number>, enforceRootNote: boolean, lowestNote: number): number {
  if (enforceRootNote) {
    return lowestNote;
  }

  const pcArray = Array.from(pitchClasses).sort((a, b) => a - b);

  // Try each note as root and score based on common intervals
  let bestRoot = pcArray[0];
  let bestScore = -1;

  for (const root of pcArray) {
    let score = 0;

    for (const pc of pcArray) {
      const interval = (pc - root + 12) % 12;

      // Score based on how common/important the interval is
      switch (interval) {
        case 0:
          score += 10;
          break; // Root
        case 4:
          score += 8;
          break; // Major 3rd
        case 3:
          score += 8;
          break; // Minor 3rd
        case 7:
          score += 9;
          break; // Perfect 5th
        case 10:
          score += 6;
          break; // Minor 7th
        case 11:
          score += 6;
          break; // Major 7th
        case 2:
          score += 4;
          break; // Major 2nd
        case 9:
          score += 4;
          break; // Major 6th
        case 5:
          score += 3;
          break; // Perfect 4th
        default:
          score += 1;
          break;
      }
    }

    // Bonus for being the lowest note
    if (root === lowestNote) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestRoot = root;
    }
  }

  return bestRoot;
}

function buildIntervalAnalysis(params: {
  pitchClasses: Set<number>;
  root: number;
  noteNames: { [key: number]: string };
}): string {
  const { pitchClasses, root, noteNames } = params;
  const rootName = noteNames[root];
  const intervals: string[] = [];

  const sortedPcs = Array.from(pitchClasses).sort((a, b) => a - b);

  for (const pc of sortedPcs) {
    const interval = (pc - root + 12) % 12;
    intervals.push(getIntervalName(interval));
  }

  return `${rootName}(${intervals.join(" ")})`;
}

export function detectChord(midiNotes: number[], enforceRootNote: boolean = false, key?: string): string {
  if (!midiNotes || midiNotes.length === 0) return "";

  const noteNames = getNoteNames(key);
  const sortedNotes = [...new Set(midiNotes)].sort((a, b) => a - b);

  // Single note - show just the note name without octave
  if (sortedNotes.length === 1) {
    const noteClass = sortedNotes[0] % 12;
    return noteNames[noteClass];
  }

  const pitchClasses = new Set(sortedNotes.map((n) => n % 12));
  const lowestNotePc = sortedNotes[0] % 12;

  // Analyze for chord matches
  const matches = analyzeChord(pitchClasses, enforceRootNote, lowestNotePc);

  if (matches.length > 0) {
    const bestMatch = matches[0];

    // Use the best match if it's good enough
    if (bestMatch.score > 500 || bestMatch.coverage >= 0.8) {
      return buildChordName({ match: bestMatch, allPitchClasses: pitchClasses, bassNote: lowestNotePc, noteNames });
    }
  }

  // Fallback: try to find overlapping triads
  const triads = findOverlappingTriads({ pitchClasses, noteNames });
  if (triads.length >= 2) {
    return `${triads[0]} + ${triads[1]}`;
  }

  if (triads.length === 1) {
    // Only show single triad if it's a complete triad
    const triad = triads[0];
    const rootName = triad.replace(/[^A-Gb#]/g, "");
    const quality = triad.replace(rootName, "");

    // Check if we have a complete triad
    let rootPc = -1;
    for (let i = 0; i < 12; i++) {
      if (noteNames[i] === rootName) {
        rootPc = i;
        break;
      }
    }

    if (rootPc !== -1) {
      let expectedIntervals: number[];
      if (quality === "m") {
        expectedIntervals = [0, 3, 7];
      } else if (quality === "aug") {
        expectedIntervals = [0, 4, 8];
      } else if (quality === "dim") {
        expectedIntervals = [0, 3, 6];
      } else {
        expectedIntervals = [0, 4, 7]; // major
      }

      const hasAllNotes = expectedIntervals.every((interval) => pitchClasses.has((rootPc + interval) % 12));

      if (hasAllNotes) {
        return triad;
      }
    }
  }

  // ROBUST FALLBACK: Find best root and show all intervals
  const bestRoot = findBestRoot(pitchClasses, enforceRootNote, lowestNotePc);
  return buildIntervalAnalysis({ pitchClasses, root: bestRoot, noteNames });
}
