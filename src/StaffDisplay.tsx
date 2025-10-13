import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, Accidental } from 'vexflow';
import { MusicalKey } from './types';

interface StaffDisplayProps {
  heldNotes: number[];
  musicalKey: MusicalKey;
}

// Define which MIDI pitch classes are IN each major key scale (no accidentals needed)
// And how to spell notes NOT in the key (with appropriate accidentals)
const NOTE_SPELLING: Record<MusicalKey, Record<number, string>> = {
  // C Major: C(0) D(2) E(4) F(5) G(7) A(9) B(11)
  'C': { 0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B' },

  // G Major: G(7) A(9) B(11) C(0) D(2) E(4) F#(6) - F# is in key, so pitch 6 = "F" (no accidental)
  'G': { 0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'Fn', 6: 'F', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B' },

  // D Major: D(2) E(4) F#(6) G(7) A(9) B(11) C#(1) - F# and C# are in key
  'D': { 0: 'Cn', 1: 'C', 2: 'D', 3: 'D#', 4: 'E', 5: 'Fn', 6: 'F', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B' },

  // A Major: A(9) B(11) C#(1) D(2) E(4) F#(6) G#(8) - F# C# G# are in key
  'A': { 0: 'Cn', 1: 'C', 2: 'D', 3: 'D#', 4: 'E', 5: 'Fn', 6: 'F', 7: 'Gn', 8: 'G', 9: 'A', 10: 'A#', 11: 'B' },

  // E Major: E(4) F#(6) G#(8) A(9) B(11) C#(1) D#(3) - F# C# G# D# are in key
  'E': { 0: 'Cn', 1: 'C', 2: 'Dn', 3: 'D', 4: 'E', 5: 'Fn', 6: 'F', 7: 'Gn', 8: 'G', 9: 'A', 10: 'A#', 11: 'B' },

  // B Major: B(11) C#(1) D#(3) E(4) F#(6) G#(8) A#(10) - F# C# G# D# A# are in key
  'B': { 0: 'Cn', 1: 'C', 2: 'Dn', 3: 'D', 4: 'E', 5: 'Fn', 6: 'F', 7: 'Gn', 8: 'G', 9: 'An', 10: 'A', 11: 'B' },

  // F# Major: F#(6) G#(8) A#(10) B(11) C#(1) D#(3) E#(5) - all sharps in key, E#=F
  'F#': { 0: 'B#', 1: 'C', 2: 'Dn', 3: 'D', 4: 'En', 5: 'E', 6: 'F', 7: 'Gn', 8: 'G', 9: 'An', 10: 'A', 11: 'Bn' },

  // Gb Major: Gb(6) Ab(8) Bb(10) Cb(11) Db(1) Eb(3) F(5) - Cb=B, Gb=F#
  'Gb': { 0: 'Cn', 1: 'D', 2: 'Dn', 3: 'E', 4: 'En', 5: 'F', 6: 'G', 7: 'Gn', 8: 'A', 9: 'An', 10: 'B', 11: 'C' },

  // Db Major: Db(1) Eb(3) F(5) Gb(6) Ab(8) Bb(10) C(0) - Db Eb Gb Ab Bb are in key
  'Db': { 0: 'C', 1: 'D', 2: 'Dn', 3: 'E', 4: 'En', 5: 'F', 6: 'G', 7: 'Gn', 8: 'A', 9: 'An', 10: 'B', 11: 'Bn' },

  // Ab Major: Ab(8) Bb(10) C(0) Db(1) Eb(3) F(5) G(7) - Ab Bb Db Eb are in key
  'Ab': { 0: 'C', 1: 'D', 2: 'Dn', 3: 'E', 4: 'En', 5: 'F', 6: 'Gb', 7: 'G', 8: 'A', 9: 'An', 10: 'B', 11: 'Bn' },

  // Eb Major: Eb(3) F(5) G(7) Ab(8) Bb(10) C(0) D(2) - Eb Ab Bb are in key
  'Eb': { 0: 'C', 1: 'Db', 2: 'D', 3: 'E', 4: 'En', 5: 'F', 6: 'Gb', 7: 'G', 8: 'A', 9: 'An', 10: 'B', 11: 'Bn' },

  // Bb Major: Bb(10) C(0) D(2) Eb(3) F(5) G(7) A(9) - Bb Eb are in key
  'Bb': { 0: 'C', 1: 'Db', 2: 'D', 3: 'E', 4: 'En', 5: 'F', 6: 'Gb', 7: 'G', 8: 'Ab', 9: 'A', 10: 'B', 11: 'Bn' },

  // F Major: F(5) G(7) A(9) Bb(10) C(0) D(2) E(4) - Bb is in key
  'F': { 0: 'C', 1: 'Db', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F', 6: 'Gb', 7: 'G', 8: 'Ab', 9: 'A', 10: 'B', 11: 'Bn' },
};

// Convert MIDI note to VexFlow note format with proper spelling for the key
function midiToVexFlowNote(params: {
  noteNumber: number;
  keySignature: MusicalKey;
}): { note: string; accidental: string | null } {
  const { noteNumber, keySignature } = params;
  const octave = Math.floor(noteNumber / 12) - 1;
  const pitchClass = noteNumber % 12;

  // Get the correct spelling for this pitch class in this key
  const spelling = NOTE_SPELLING[keySignature]?.[pitchClass] || 'C';
  const baseName = spelling.charAt(0).toLowerCase();
  const modifier = spelling.slice(1);

  // Map modifiers to VexFlow accidental symbols
  let accidental: string | null = null;
  if (modifier === '#') accidental = '#';
  else if (modifier === 'b') accidental = 'b';
  else if (modifier === 'n') accidental = 'n'; // natural sign

  return { note: `${baseName}/${octave}`, accidental };
}

const StaffDisplay: React.FC<StaffDisplayProps> = ({ heldNotes, musicalKey }) => {
  const trebleContainerRef = useRef<HTMLDivElement>(null);
  const bassContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trebleContainerRef.current || !bassContainerRef.current) return;

    // Clear previous renderings
    trebleContainerRef.current.innerHTML = '';
    bassContainerRef.current.innerHTML = '';

    // Use the musical key, default to C if invalid
    const keySpec = musicalKey || 'C';

    // Group notes by clef (middle C = 60)
    const trebleNotes = heldNotes.filter(note => note >= 60).sort((a, b) => a - b);
    const bassNotes = heldNotes.filter(note => note < 60).sort((a, b) => a - b);

    // Render treble staff
    if (trebleContainerRef.current) {
      renderStaff({
        container: trebleContainerRef.current,
        clef: 'treble',
        notes: trebleNotes,
        keySpec,
        musicalKey
      });
    }

    // Render bass staff
    if (bassContainerRef.current) {
      renderStaff({
        container: bassContainerRef.current,
        clef: 'bass',
        notes: bassNotes,
        keySpec,
        musicalKey
      });
    }
  }, [heldNotes, musicalKey]);

  return (
    <div className="staff-display-area">
      <div className="grand-staff-container">
        <div className="staves-block">
          <div className="staff">
            <div ref={trebleContainerRef} className="vexflow-container" />
          </div>
          <div className="staff">
            <div ref={bassContainerRef} className="vexflow-container" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface RenderStaffOptions {
  container: HTMLElement;
  clef: 'treble' | 'bass';
  notes: number[];
  keySpec: MusicalKey;
  musicalKey: MusicalKey;
}

function renderStaff({ container, clef, notes, keySpec, musicalKey }: RenderStaffOptions) {
  const width = container.clientWidth || 600;
  const height = 100;

  // Create VexFlow renderer
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();

  // Create a stave with key signature
  const stave = new Stave(10, 0, width - 20);
  stave.addClef(clef);
  stave.addKeySignature(keySpec);
  stave.setContext(context).draw();

  if (notes.length === 0) {
    return;
  }

  // Convert all MIDI notes to VexFlow format and create a single chord
  const noteKeys: string[] = [];
  const accidentalIndices: { index: number; accidental: string }[] = [];

  notes.forEach((midiNote) => {
    const { note, accidental } = midiToVexFlowNote({ noteNumber: midiNote, keySignature: musicalKey });
    noteKeys.push(note);

    if (accidental) {
      accidentalIndices.push({ index: noteKeys.length - 1, accidental });
    }
  });

  if (noteKeys.length > 0) {
    try {
      // Create a single chord with all notes
      const staveNote = new StaveNote({
        clef: clef,
        keys: noteKeys,
        duration: 'w' // whole note
      });

      // Add accidentals
      accidentalIndices.forEach(({ index, accidental }) => {
        staveNote.addModifier(new Accidental(accidental), index);
      });

      // Format and draw the note
      Formatter.FormatAndDraw(context, stave, [staveNote]);
    } catch (error) {
      console.error('Error creating VexFlow chord:', error, { noteKeys, clef });
    }
  }
}

export default StaffDisplay;