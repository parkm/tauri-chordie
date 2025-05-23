import React, { useState, useEffect, useRef } from 'react';

interface ChordInstance {
  id: string;
  text: string;
  isExiting: boolean;
}

interface ChordDisplayProps {
  chordText: string;
}

const ChordDisplay: React.FC<ChordDisplayProps> = ({ chordText }) => {
  const [chordInstances, setChordInstances] = useState<ChordInstance[]>([]);
  const [displayedChord, setDisplayedChord] = useState<string>("");
  const nextIdRef = useRef(0);
  const cleanupTimeoutRef = useRef<number | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Debounce chord changes to avoid rapid transitions
  useEffect(() => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set up new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      // Only update if the chord actually changed
      if (chordText !== displayedChord) {
        setDisplayedChord(chordText);
      }
    }, 100); // 150ms debounce delay

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [chordText, displayedChord]);

  // Handle chord transitions when displayedChord changes
  useEffect(() => {
    // Clear any pending cleanup
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    if (displayedChord) {
      // If there's currently a visible chord, mark it as exiting
      setChordInstances(prev => {
        const updated = prev.map(instance => ({
          ...instance,
          isExiting: true
        }));

        // Add the new chord
        const newChord: ChordInstance = {
          id: `chord-${nextIdRef.current++}`,
          text: displayedChord,
          isExiting: false
        };

        return [...updated, newChord];
      });

      // Clean up exiting chords after animation completes
      cleanupTimeoutRef.current = setTimeout(() => {
        setChordInstances(prev => prev.filter(instance => !instance.isExiting));
      }, 600); // Match the CSS animation duration
    } else {
      // No chord text, mark all as exiting
      setChordInstances(prev => prev.map(instance => ({
        ...instance,
        isExiting: true
      })));

      // Clean up after animation
      cleanupTimeoutRef.current = setTimeout(() => {
        setChordInstances([]);
      }, 600);
    }

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
    };
  }, [displayedChord]);

  return (
    <div className="chord-display-container">
      {chordInstances.map(instance => (
        <div
          key={instance.id}
          className={`chord-instance ${instance.isExiting ? 'exiting' : 'entering'}`}
        >
          {instance.text}
        </div>
      ))}
    </div>
  );
};

export default ChordDisplay;