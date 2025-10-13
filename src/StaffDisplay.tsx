import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, Accidental } from 'vexflow';

interface StaffDisplayProps {
  heldNotes: number[];
}

// MIDI note number to note name (0-11 to C, C#, D, etc.)
const MIDI_PITCH_CLASS_TO_NAME: { [key: number]: string } = {
  0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B",
};

// Convert MIDI note number to VexFlow note format (e.g., "c/4", "g#/5")
function midiToVexFlowNote(noteNumber: number): { note: string; accidental: string | null } {
  const octave = Math.floor(noteNumber / 12) - 1;
  const notePitchClass = noteNumber % 12;
  const noteName = MIDI_PITCH_CLASS_TO_NAME[notePitchClass];

  if (!noteName) {
    return { note: `c/${octave}`, accidental: null };
  }

  const isSharp = noteName.includes('#');
  const baseName = noteName.charAt(0).toLowerCase();
  const accidental = isSharp ? '#' : null;

  return { note: `${baseName}/${octave}`, accidental };
}

const StaffDisplay: React.FC<StaffDisplayProps> = ({ heldNotes }) => {
  const trebleContainerRef = useRef<HTMLDivElement>(null);
  const bassContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trebleContainerRef.current || !bassContainerRef.current) return;

    // Clear previous renderings
    trebleContainerRef.current.innerHTML = '';
    bassContainerRef.current.innerHTML = '';

    // Group notes by clef (middle C = 60)
    const trebleNotes = heldNotes.filter(note => note >= 60).sort((a, b) => a - b);
    const bassNotes = heldNotes.filter(note => note < 60).sort((a, b) => a - b);

    // Render treble staff
    if (trebleContainerRef.current) {
      renderStaff({
        container: trebleContainerRef.current,
        clef: 'treble',
        notes: trebleNotes
      });
    }

    // Render bass staff
    if (bassContainerRef.current) {
      renderStaff({
        container: bassContainerRef.current,
        clef: 'bass',
        notes: bassNotes
      });
    }
  }, [heldNotes]);

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
}

function renderStaff({ container, clef, notes }: RenderStaffOptions) {
  const width = container.clientWidth || 600;
  const height = 100;

  // Create VexFlow renderer
  const renderer = new Renderer(container as HTMLDivElement, Renderer.Backends.SVG);
  renderer.resize(width, height);
  const context = renderer.getContext();

  // Create a stave
  const stave = new Stave(10, 0, width - 20);
  stave.addClef(clef);
  stave.setContext(context).draw();

  if (notes.length === 0) {
    return;
  }

  // Convert all MIDI notes to VexFlow format and create a single chord
  const noteKeys: string[] = [];
  const accidentalIndices: { index: number; accidental: string }[] = [];

  notes.forEach((midiNote) => {
    const { note, accidental } = midiToVexFlowNote(midiNote);
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