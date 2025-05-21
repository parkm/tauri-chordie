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

function App() {
  const [midiDevices, setMidiDevices] = useState<MidiDevice[]>([]);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number | null>(
    null
  );
  const [heldNotes, setHeldNotes] = useState<number[]>([]);
  const [detectedChordString, setDetectedChordString] = useState<string>("");
  const [isDeviceSelectorOpen, setIsDeviceSelectorOpen] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMidiDevices() {
      try {
        const devices = await invoke<MidiDevice[]>("get_midi_devices");
        setMidiDevices(devices);
        if (devices.length === 0) {
          setError("No MIDI devices found. Please connect a device and refresh.");
        } else {
          setError(null);
        }
      } catch (err) {
        console.error("Failed to fetch MIDI devices:", err);
        setMidiDevices([]);
        setError("Failed to load MIDI devices. Is the backend running?");
      }
    }
    fetchMidiDevices();
  }, []);

  async function handleDeviceClick(index: number) {
    if (selectedDeviceIndex === index) {
      return;
    }
    setSelectedDeviceIndex(index);
    setHeldNotes([]);
    setDetectedChordString("");
    setIsDeviceSelectorOpen(false);
    setError(null);
    try {
      await invoke("listen_to_midi_device", { portIndex: index });
      console.log(`Started listening to device index: ${index}`);
    } catch (err) {
      console.error(`Failed to listen to MIDI device index ${index}:`, err);
      setError(`Failed to connect to ${midiDevices.find(d => d.index === index)?.name || `device ${index}`}.`);
      setSelectedDeviceIndex(null);
    }
  }

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    if (selectedDeviceIndex !== null) {
      const setupListener = async () => {
        try {
          unlisten = await listen<number[]>("midi_held_notes", (event) => {
            const currentNotes = event.payload.sort((a, b) => a - b);
            setHeldNotes(currentNotes);
            setDetectedChordString(detectChord(currentNotes));
          });
        } catch (err) {
          console.error(
            `Failed to set up MIDI held notes listener for device index ${selectedDeviceIndex}:`,
            err
          );
          setError("Error receiving MIDI data.");
        }
      };
      setupListener();
    }

    return () => {
      if (unlisten) {
        unlisten();
        console.log(
          `Stopped listening for MIDI held notes from device index: ${selectedDeviceIndex}`
        );
      }
    };
  }, [selectedDeviceIndex]);

  const getSelectedDeviceName = () => {
    if (selectedDeviceIndex === null) return "Select MIDI Device";
    const device = midiDevices.find(d => d.index === selectedDeviceIndex);
    return device ? device.name : `Device ${selectedDeviceIndex}`;
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>tauri-chordie</h1>
        <div className="midi-selector-container">
          <button
            onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
            className={`midi-selector-toggle ${isDeviceSelectorOpen ? 'active' : ''}`}
            aria-expanded={isDeviceSelectorOpen}
            aria-controls="midi-device-list-popup"
          >
            {getSelectedDeviceName()}
          </button>
          {isDeviceSelectorOpen && (
            <div id="midi-device-list-popup" className="midi-device-list-popup">
              {midiDevices.length > 0 ? (
                <ul>
                  {midiDevices.map((device) => (
                    <li
                      key={device.index}
                      onClick={() => handleDeviceClick(device.index)}
                      className={selectedDeviceIndex === device.index ? "selected-device" : ""}
                      role="option"
                      aria-selected={selectedDeviceIndex === device.index}
                    >
                      {device.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-devices-message-popup">No MIDI devices found</p>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        {error && <p className="message error-message">{error}</p>}
        {selectedDeviceIndex === null && !error && midiDevices.length > 0 && (
           <p className="message info-message">Please select a MIDI device to start</p>
        )}

        <div className="staff-and-chord-container">
          <div className="staff-display-wrapper">
            <StaffDisplay heldNotes={heldNotes} />
          </div>
          <div className="detected-chord-display-wrapper">
            <p className={`detected-chord-text ${detectedChordString ? 'visible' : ''}`}>
              {detectedChordString || ''}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
