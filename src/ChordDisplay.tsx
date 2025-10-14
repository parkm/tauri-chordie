import React, { useState, useEffect, useRef } from "react";

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
    <div className="relative flex h-[60px] w-full items-center justify-center overflow-hidden">
      {displayedChord && (
        <div className="text-primary compact:text-[clamp(1.5rem,5vw,2rem)] compact-h:text-[clamp(1.5rem,5vw,2rem)] tablet:text-[clamp(1.25rem,4.5vw,1.75rem)] mobile:text-[clamp(1rem,4vw,1.5rem)] text-center text-[2rem] font-semibold whitespace-nowrap">
          {displayedChord}
        </div>
      )}
    </div>
  );
};

export default ChordDisplay;
