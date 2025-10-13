import React, { useState, useEffect, useRef } from 'react';

interface ChordDisplayProps {
  chordText: string;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({ chordText }) => {
  const [displayedChord, setDisplayedChord] = useState<string>("");
  const debounceTimeoutRef = useRef<number | null>(null);

  // Debounce chord changes to avoid flickering
  useEffect(() => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set up new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setDisplayedChord(chordText);
    }, 30); // 30ms debounce delay

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [chordText]);

  return (
    <div className="chord-display-container">
      {displayedChord && (
        <div className="chord-instance">
          {displayedChord}
        </div>
      )}
    </div>
  );
};

export default ChordDisplay;