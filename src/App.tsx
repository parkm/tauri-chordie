import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import StaffDisplay from "./StaffDisplay";
import { detectChord } from "./ChordDetector";

interface MidiDevice {
  index: number;
  name: string;
}

// Simple mapping for note numbers to names (enharmonic equivalents are not handled, focuses on sharps)
const NOTE_NAMES: { [key: number]: string } = {
  0: "C", 1: "C#", 2: "D", 3: "D#", 4: "E", 5: "F",
  6: "F#", 7: "G", 8: "G#", 9: "A", 10: "A#", 11: "B",
};

function getNoteName(noteNumber: number): string {
  const octave = Math.floor(noteNumber / 12) - 1;
  const note = NOTE_NAMES[noteNumber % 12];
  return note ? `${note}${octave}` : `Note ${noteNumber}`;
}

function App() {
  const [midiDevices, setMidiDevices] = useState<MidiDevice[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number | null>(
    null
  );
  const [heldNotes, setHeldNotes] = useState<number[]>([]);
  const [detectedChord, setDetectedChord] = useState<string>("");
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState<boolean>(true);

  useEffect(() => {
    async function fetchMidiDevices() {
      try {
        const devices = await invoke<MidiDevice[]>("get_midi_devices");
        setMidiDevices(devices);
      } catch (error) {
        console.error("Failed to fetch MIDI devices:", error);
        setMidiDevices([]); // Set to empty array on error
      }
    }
    fetchMidiDevices();
  }, []);

  async function handleDeviceClick(index: number) {
    setSelectedDeviceIndex(index);
    setHeldNotes([]); // Clear previous notes when changing device
    setIsDeviceSelectorOpen(false); // Collapse after selection
    try {
      await invoke("listen_to_midi_device", { portIndex: index });
      console.log(`Started listening to device index: ${index}`);
    } catch (error) {
      console.error(`Failed to listen to MIDI device index ${index}:`, error);
    }
  }

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    if (selectedDeviceIndex !== null) {
      const setupListener = async () => {
        try {
          // Listen for 'midi_held_notes' and expect a number[] payload
          unlisten = await listen<number[]>("midi_held_notes", (event) => {
            console.log("Held Notes Updated:", event.payload);
            const currentNotes = event.payload.sort((a,b) => a - b);
            setHeldNotes(currentNotes); // Update state with the array of note numbers, sorted
            setDetectedChord(detectChord(currentNotes)); // Detect and set chord
          });
        } catch (error) {
          console.error(
            `Failed to set up MIDI held notes listener for device index ${selectedDeviceIndex}:`,
            error
          );
        }
      };
      setupListener();
    }

    return () => {
      if (unlisten) {
        unlisten();
        // Optional: send a command to backend to explicitly stop listening on this port if needed
        // or clear held notes on the backend for this connection if it doesn't reset automatically.
        console.log(
          `Stopped listening for MIDI held notes from device index: ${selectedDeviceIndex}`
        );
      }
    };
  }, [selectedDeviceIndex]);

  return (
    <main className="container">
      <header className="app-header">
        <h1>Tauri Chordie</h1>
      </header>
      <section className="app-section midi-devices-section">
        <div className="midi-selector-header">
          <h2>MIDI Devices</h2>
          {selectedDeviceIndex !== null && (
            <button
              onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
              className="toggle-device-selector-btn"
              aria-expanded={isDeviceSelectorOpen}
            >
              {isDeviceSelectorOpen ? "Hide Devices" : "Show Devices"}
            </button>
          )}
        </div>
        {(isDeviceSelectorOpen || selectedDeviceIndex === null) && (
          midiDevices.length > 0 ? (
            <ul className="midi-device-list">
              {midiDevices.map((device) => (
                <li
                  key={device.index}
                  onClick={() => handleDeviceClick(device.index)}
                  className={selectedDeviceIndex === device.index ? "selected-device" : ""}
                >
                  {device.name} (Port: {device.index})
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-devices-message">No MIDI devices found or failed to load. Please ensure a MIDI device is connected.</p>
          )
        )}
      </section>

      {selectedDeviceIndex !== null && (
        <section className="app-section staff-visualization-section">
          <h2>Live Note Display</h2>
          <StaffDisplay heldNotes={heldNotes} />
          {detectedChord && (
            <div className="detected-chord-display">
              <h3>Detected Chord: {detectedChord}</h3>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;
