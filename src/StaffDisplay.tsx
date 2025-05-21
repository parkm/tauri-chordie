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

const TrebleClefSVG: React.FC = () => (
  <svg viewBox="0 -15 38 115" className="clef-svg" preserveAspectRatio="xMidYMin meet">
    <path d="M26.22,95.31c-0.33-2.08-0.49-4.17-0.49-6.25c0-10.17,2.99-19.92,8.48-27.58c4.49-6.32,9.48-10.32,14.48-12.07 c2.99-1.08,5.82-1.41,8.48-1.08c7.15,0.83,12.48,5.99,13.31,13.14c0.83,7.15-2.99,13.48-9.65,16.64 c-4.82,2.25-10.15,2.08-14.98-0.42c-2.99-1.41-5.16-3.99-6.15-7.07c-0.49-1.91,0.49-3.82,2.16-4.66c1.66-0.83,3.66-0.33,4.66,1.33 c0.66,1.25,1.66,2.41,2.99,3.08c3.16,1.66,7,1.41,9.65-0.83c3.49-2.91,4.32-7.49,2.83-11.23c-1.83-4.49-6.49-7.07-11.14-6.49 c-2.16,0.25-4.16,0.92-5.99,1.91c-4.16,2.33-8.15,6.07-11.98,11.48c-4.66,6.49-7,14.48-7,22.79c0,2.25,0.17,4.49,0.5,6.74 c2.66,17.97,15.31,31.78,31.78,35.76c15.97,3.82,32.03-1.91,42.09-15.14c6.82-9.07,9.48-20.13,7.65-30.95 c-1.33-7.82-5.82-14.31-12.15-17.97c-7.82-4.49-17.14-4.16-24.46,0.83c-2.49,1.66-3.99,4.49-3.99,7.49c0,3.33,1.66,6.24,4.32,7.99 c2.83,1.75,6.16,1.91,9.15,0.66c7.32-2.99,11.81-10.15,10.48-17.8c-0.83-4.82-3.99-8.82-8.32-10.48c-3.82-1.41-7.99-0.83-11.15,1.66 c-2.66,2.08-4.32,5.16-4.49,8.49c-0.16,3.33,1.16,6.49,3.66,8.32c4.32,3.16,9.82,3.49,14.48,1c7.32-3.82,10.32-12.15,7.32-19.3 c-2.33-5.66-7.65-9.32-13.48-9.32c-4.32,0-8.32,1.91-11.15,5.16c-4.82,5.49-6.15,12.98-3.82,19.97c1.49,4.32,4.66,7.65,8.48,9.32 c4.16,1.75,8.65,1.58,12.48-0.42c1.83-0.92,2.99-2.83,2.99-4.99c0-2.41-1.49-4.41-3.66-5.24c-1.99-0.75-4.24-0.33-5.74,1.08 c-1.16,1.08-1.83,2.5-1.75,4.08c0.08,1.58,0.92,2.91,2.24,3.58c2.99,1.41,6.49,0.83,8.65-1.58c3.82-4.16,3.33-10.32-1.25-13.81 c-3.49-2.66-7.99-3.16-11.98-1.75c-11.31,3.99-18.13,14.48-18.13,26.62c0,7.82,2.74,15.14,7.65,20.79 c7.32,8.49,17.97,12.98,29.12,11.48c13.14-1.75,24.29-10.48,28.95-22.46c2.49-6.32,2.66-13.14,0.33-19.47 c-2.99-7.99-9.15-13.48-16.97-14.81c-7.15-1.25-14.14,0.83-19.13,5.99c-2.83,2.99-3.16,7.32-0.75,10.65 c2.08,2.91,5.82,3.82,9.15,2.08c4.49-2.33,7.32-7.15,7.32-12.31c0-7.15-4.66-13.31-11.48-14.64c-7.49-1.41-14.64,1.58-18.3,7.99 c-3.49,5.99-3.33,13.48,0.42,19.13c3.33,4.99,8.82,7.82,14.64,7.82c4.32,0,8.49-1.41,11.81-3.99c9.32-7.32,11.15-20.13,4.32-30.29 c-5.16-7.65-14.14-11.81-23.29-10.82c-10.48,1.16-19.3,7.32-23.12,16.97c-3.33,8.15-3.33,17.14-0.16,25.12 c2.58,6.49,7.41,11.81,13.48,14.81V94.98L26.22,95.31z" />
  </svg>
);

const BassClefSVG: React.FC = () => (
  <svg viewBox="0 15 50 75" className="clef-svg" preserveAspectRatio="xMidYMin meet">
    <path d="M26.12,24.27c-5.57,0-10.09,4.52-10.09,10.09c0,5.57,4.52,10.09,10.09,10.09c5.57,0,10.09-4.52,10.09-10.09 C36.21,28.79,31.69,24.27,26.12,24.27z M26.12,41.44c-3.91,0-7.09-3.18-7.09-7.09c0-3.91,3.18-7.09,7.09-7.09 c3.91,0,7.09,3.18,7.09,7.09C33.21,38.27,30.03,41.44,26.12,41.44z"/>
    <path d="M26.12,50.36c-5.57,0-10.09,4.52-10.09,10.09c0,5.57,4.52,10.09,10.09,10.09c5.57,0,10.09-4.52,10.09-10.09 C36.21,54.88,31.69,50.36,26.12,50.36z M26.12,67.53c-3.91,0-7.09-3.18-7.09-7.09c0-3.91,3.18-7.09,7.09-7.09 c3.91,0,7.09,3.18,7.09,7.09C33.21,64.36,30.03,67.53,26.12,67.53z"/>
    <path d="M29.35,73.08c-0.94-0.29-1.92-0.44-2.93-0.44c-5.13,0-9.42,3.74-10.02,8.65c-0.17,1.4,0.02,2.81,0.56,4.13 c2.45,5.92,8.37,9.79,14.88,9.79c6.88,0,12.93-4.13,15.08-10.29c0.58-1.65,0.76-3.38,0.53-5.08 c-0.74-5.4-5.27-9.49-10.59-9.86C35.03,70,32.01,70.96,29.35,73.08z M36.49,85.79c-1.45,4.12-5.4,6.79-9.98,6.79 c-4.24,0-8.01-2.34-9.66-6.02c-0.36-0.82-0.53-1.68-0.53-2.55c0.18-3.23,2.95-5.79,6.22-5.79c0.82,0,1.6,0.17,2.32,0.47 c3.33,1.42,7.14,0.19,8.87-2.94c0.49-0.88,1.49-1.37,2.5-1.16C36.79,84.78,36.73,85.34,36.49,85.79z"/>
  </svg>
);

const StaffDisplay: React.FC<StaffDisplayProps> = ({ heldNotes }) => {
  const staffHeight = 100; // Target height for one staff system
  const lineSpacing = staffHeight / 8;
  const staffGap = 40;
  const noteRadius = lineSpacing / 2.8;
  const noteNameX = 40; // X pos for note names text-anchor: end will be used
  const clefWidth = 50; // Estimated width for clef character and spacing
  const noteXPosition = clefWidth + noteNameX + 25; // Note heads to the right of names
  const ledgerLineLength = noteRadius * 3.5;
  const notesAreaWidth = 400; // Base width for the notes area, can be adjusted

  const componentStyle = {
    '--staff-height': `${staffHeight}px`,
    '--staff-gap': `${staffGap}px`,
  } as React.CSSProperties;

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
    <div className="staff-display-area" style={componentStyle}>
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
                    x2="100%" // Lines span full width of their SVG container
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
                          x={noteXPosition - noteRadius * 1.8} // Position to the left of the note
                          y={info.y + noteRadius / 2.5} // Align vertically with the note
                          className="accidental"
                          fontSize={lineSpacing * 1.2}
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
                    x2="100%" // Lines span full width
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
                          x={noteXPosition - noteRadius * 1.8} // Position to the left of the note
                          y={info.y + noteRadius / 2.5} // Align vertically with the note
                          className="accidental"
                          fontSize={lineSpacing * 1.2}
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