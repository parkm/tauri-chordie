import React from 'react';

interface StaffDisplayProps {
  heldNotes: number[];
}

// MIDI note number to note name (0-11 to C, C#, D, etc.)
const MIDI_PITCH_CLASS_TO_NAME: { [key: number]: string } = {
  0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B",
};

// Diatonic value of note letters (C=0, D=1, ..., B=6)
const DIATONIC_NOTE_LETTER_VALUES: { [key: string]: number } = {
  'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
};

// Generates a string like "C4", "F#5"
function getNoteNameWithOctave(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1;
  const notePitchClass = noteNumber % 12;
  const noteName = MIDI_PITCH_CLASS_TO_NAME[notePitchClass];
  return noteName ? `${noteName}${octave}` : `N${noteNumber}`;
}

const StaffDisplay: React.FC<StaffDisplayProps> = ({ heldNotes }) => {
  // These values should match CSS variables
  const staffHeight = 100;
  const lineSpacing = staffHeight / 8;
  const noteRadius = lineSpacing / 2.8;
  const noteNameX = 40;
  const clefWidth = 50;
  const noteXPosition = clefWidth + noteNameX + 25;
  const ledgerLineLength = noteRadius * 3.5;
  const notesAreaWidth = 400;

  const getNoteStaffInfo = (noteNumber: number) => {
    const octave = Math.floor(noteNumber / 12) - 1;
    const notePitchClass = noteNumber % 12;
    const rawNoteName = MIDI_PITCH_CLASS_TO_NAME[notePitchClass];
    const diatonicNoteLetter = rawNoteName.charAt(0);
    const diatonicValue = DIATONIC_NOTE_LETTER_VALUES[diatonicNoteLetter];
    const noteNameString = getNoteNameWithOctave(noteNumber);
    const isSharp = rawNoteName.includes('#');
    let clef: 'treble' | 'bass';
    let staffPosition: number;

    if (noteNumber >= 60) {
      clef = 'treble';
      const refOctave = 4;
      const refDiatonicValue = DIATONIC_NOTE_LETTER_VALUES['E'];
      staffPosition = (octave - refOctave) * 7 + (diatonicValue - refDiatonicValue);
    } else {
      clef = 'bass';
      const refOctave = 2;
      const refDiatonicValue = DIATONIC_NOTE_LETTER_VALUES['G'];
      staffPosition = (octave - refOctave) * 7 + (diatonicValue - refDiatonicValue);
    }
    const y = (lineSpacing * 6) - (staffPosition * (lineSpacing / 2));
    return {
      y,
      clef,
      staffPosition,
      noteNameString,
      isSharp,
    };
  };

  const renderLedgerLines = (noteStaffInfo: ReturnType<typeof getNoteStaffInfo>, currentNoteX: number) => {
    const ledgerLinesJsx = [];
    const { staffPosition, clef } = noteStaffInfo;
    if (staffPosition < 0) {
      for (let sp = -1; sp >= staffPosition; sp--) {
        if (sp % 2 === 0) {
          const ledgerLineY = (lineSpacing * 6) - (sp * (lineSpacing / 2));
          ledgerLinesJsx.push(
            <line
              key={`${clef}-ledger-below-${sp}`}
              x1={currentNoteX - ledgerLineLength / 2}
              y1={ledgerLineY}
              x2={currentNoteX + ledgerLineLength / 2}
              y2={ledgerLineY}
              className="ledger-line"
            />
          );
        }
      }
    }
    if (staffPosition > 8) {
      for (let sp = 9; sp <= staffPosition; sp++) {
        if (sp % 2 === 0) {
          const ledgerLineY = (lineSpacing * 6) - (sp * (lineSpacing / 2));
          ledgerLinesJsx.push(
            <line
              key={`${clef}-ledger-above-${sp}`}
              x1={currentNoteX - ledgerLineLength / 2}
              y1={ledgerLineY}
              x2={currentNoteX + ledgerLineLength / 2}
              y2={ledgerLineY}
              className="ledger-line"
            />
          );
        }
      }
    }
    return ledgerLinesJsx;
  };

  return (
    <div className="staff-display-area">
      <div className="grand-staff-container">
        <div className="staff-brace">{'{'}</div>
        <div className="staves-block">
          <div className="staff">
            <div className="clef" aria-hidden="true">𝄞</div>
            <svg viewBox={`0 0 ${noteXPosition + notesAreaWidth} ${staffHeight}`} width="100%" className="staff-svg-container" preserveAspectRatio="none">
              <g className="staff-lines">
                {Array.from({ length: 5 }).map((_, i) => (
                  <line
                    key={`treble-line-${i}`}
                    x1="0"
                    y1={lineSpacing * (i + 2)}
                    x2="100%"
                    y2={lineSpacing * (i + 2)}
                  />
                ))}
              </g>
              {heldNotes.map(noteNumber => {
                const info = getNoteStaffInfo(noteNumber);
                if (info.clef === 'treble') {
                  return (
                    <g key={`treble-note-${noteNumber}-${info.noteNameString}`} className="note-visualization">
                      <text
                        x={noteNameX}
                        y={info.y + noteRadius / 3}
                      >
                        {info.noteNameString}
                      </text>
                      {renderLedgerLines(info, noteXPosition)}
                      {info.isSharp && (
                        <text
                          x={noteXPosition - noteRadius * 1.8}
                          y={info.y + noteRadius / 2.5}
                          className="accidental"
                        >
                          #
                        </text>
                      )}
                      <circle cx={noteXPosition} cy={info.y} r={noteRadius} />
                    </g>
                  );
                }
                return null;
              })}
            </svg>
          </div>
          <div className="staff">
            <div className="clef" aria-hidden="true">𝄢</div>
            <svg viewBox={`0 0 ${noteXPosition + notesAreaWidth} ${staffHeight}`} width="100%" className="staff-svg-container" preserveAspectRatio="none">
              <g className="staff-lines">
                {Array.from({ length: 5 }).map((_, i) => (
                  <line
                    key={`bass-line-${i}`}
                    x1="0"
                    y1={lineSpacing * (i + 2)}
                    x2="100%"
                    y2={lineSpacing * (i + 2)}
                  />
                ))}
              </g>
              {heldNotes.map(noteNumber => {
                const info = getNoteStaffInfo(noteNumber);
                if (info.clef === 'bass') {
                  return (
                    <g key={`bass-note-${noteNumber}-${info.noteNameString}`} className="note-visualization">
                       <text
                        x={noteNameX}
                        y={info.y + noteRadius / 3}
                      >
                        {info.noteNameString}
                      </text>
                      {renderLedgerLines(info, noteXPosition)}
                      {info.isSharp && (
                        <text
                          x={noteXPosition - noteRadius * 1.8}
                          y={info.y + noteRadius / 2.5}
                          className="accidental"
                        >
                          #
                        </text>
                      )}
                      <circle cx={noteXPosition} cy={info.y} r={noteRadius} />
                    </g>
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDisplay;