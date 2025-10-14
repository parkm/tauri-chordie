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
    <div className="relative h-[60px] w-full flex justify-center items-center overflow-hidden">
      {displayedChord && (
        <div className="text-[2rem] font-semibold text-primary text-center whitespace-nowrap max-[900px]:text-[clamp(1.5rem,5vw,2rem)] max-h-[550px]:text-[clamp(1.5rem,5vw,2rem)] max-[768px]:text-[clamp(1.25rem,4.5vw,1.75rem)] max-[480px]:text-[clamp(1rem,4vw,1.5rem)]">
          {displayedChord}
        </div>
      )}
    </div>
  );
};

export default ChordDisplay;