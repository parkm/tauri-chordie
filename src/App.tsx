import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import StaffDisplay from "./StaffDisplay";
import ChordDisplay from "./ChordDisplay";
import { detectChord } from "./ChordDetector";
import { MusicalKey } from "./types";

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
  const [enforceRootNote, setEnforceRootNote] = useState<boolean>(false);
  const [selectedKey, setSelectedKey] = useState<string>("C");
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

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
            setDetectedChordString(detectChord(currentNotes, enforceRootNote, selectedKey));
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
  }, [selectedDeviceIndex, enforceRootNote, selectedKey]);

  const getSelectedDeviceName = () => {
    if (selectedDeviceIndex === null) return "Select MIDI Device";
    const device = midiDevices.find(d => d.index === selectedDeviceIndex);
    return device ? device.name : `Device ${selectedDeviceIndex}`;
  };

  return (
    <div className="grid grid-rows-[auto_1fr] h-screen w-screen overflow-hidden relative">
      {/* Hamburger menu button - only visible in compact mode */}
      <button
        className="hidden max-[900px]:flex max-h-[550px]:flex fixed top-4 left-4 z-[1000] bg-primary border-none rounded-lg w-12 h-12 flex-col justify-center items-center gap-1.5 cursor-pointer shadow-lg transition-all duration-300 hover:bg-primary-dark hover:scale-105 active:scale-95 max-[480px]:w-11 max-[480px]:h-11 max-[480px]:top-2 max-[480px]:left-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
      >
        <span className="block w-6 h-0.5 bg-white rounded transition-all duration-300"></span>
        <span className="block w-6 h-0.5 bg-white rounded transition-all duration-300"></span>
        <span className="block w-6 h-0.5 bg-white rounded transition-all duration-300"></span>
      </button>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          className="hidden max-[900px]:block max-h-[550px]:block fixed inset-0 bg-black/50 z-[999] animate-fade-in"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sliding menu panel */}
      <div className={`hidden max-[900px]:block max-h-[550px]:block fixed top-0 w-80 h-screen bg-card shadow-lg z-[1000] overflow-y-auto transition-[left] duration-300 max-[480px]:w-full ${isMenuOpen ? 'left-0' : '-left-80 max-[480px]:-left-full'}`}>
        <div className="flex justify-between items-center p-6 bg-gradient-to-br from-primary to-primary-dark text-white sticky top-0 z-10">
          <h2 className="m-0 text-2xl font-semibold">Settings</h2>
          <button
            className="bg-transparent border-none text-white text-2xl cursor-pointer p-1 w-8 h-8 flex items-center justify-center rounded transition-colors duration-200 hover:bg-white/20"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="m-0 mb-4 text-lg font-semibold text-foreground">Key Signature</h3>
            <div>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full p-4 rounded-lg border-2 border-gray-300 bg-background text-foreground text-base cursor-pointer transition-all duration-200 hover:border-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="C">C/Am (0♯/♭)</option>
                <option value="G">G/Em (1♯)</option>
                <option value="D">D/Bm (2♯)</option>
                <option value="A">A/F#m (3♯)</option>
                <option value="E">E/C#m (4♯)</option>
                <option value="B">B/G#m (5♯)</option>
                <option value="F#">F#/D#m (6♯)</option>
                <option value="Gb">Gb/Ebm (6♭)</option>
                <option value="Db">Db/Bbm (5♭)</option>
                <option value="Ab">Ab/Fm (4♭)</option>
                <option value="Eb">Eb/Cm (3♭)</option>
                <option value="Bb">Bb/Gm (2♭)</option>
                <option value="F">F/Dm (1♭)</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="m-0 mb-4 text-lg font-semibold text-foreground">Chord Detection</h3>
            <div>
              <label className="flex items-center gap-4 text-base text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enforceRootNote}
                  onChange={(e) => setEnforceRootNote(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
                Enforce Root Note
              </label>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="m-0 mb-4 text-lg font-semibold text-foreground">MIDI Device</h3>
            <div>
              <button
                onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
                className={`w-full p-4 bg-primary border-none rounded-lg text-white font-medium text-base cursor-pointer transition-all duration-200 text-left relative hover:bg-primary-dark after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-0 after:h-0 after:border-l-[6px] after:border-l-transparent after:border-r-[6px] after:border-r-transparent after:border-t-[6px] after:border-t-white after:transition-transform after:duration-200 ${isDeviceSelectorOpen ? 'after:rotate-180' : ''}`}
              >
                {getSelectedDeviceName()}
              </button>
              {isDeviceSelectorOpen && (
                <div className="mt-2 bg-background rounded-lg overflow-hidden shadow-sm">
                  {midiDevices.length > 0 ? (
                    <ul className="list-none m-0 p-0">
                      {midiDevices.map((device) => (
                        <li
                          key={device.index}
                          onClick={() => {
                            handleDeviceClick(device.index);
                            setIsMenuOpen(false);
                          }}
                          className={`p-4 cursor-pointer transition-colors duration-200 border-b border-gray-300 last:border-b-0 ${selectedDeviceIndex === device.index ? "bg-primary text-white font-semibold" : "text-foreground hover:bg-gray-100"}`}
                        >
                          {device.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-4 text-center text-gray-600 italic">No MIDI devices found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && <div className="p-4 bg-error/10 text-error rounded-lg border-l-4 border-error text-sm">{error}</div>}
        </div>
      </div>

      <header className="flex items-center justify-between px-6 h-16 bg-gradient-to-br from-primary to-primary-dark text-white shadow-md z-50 max-[900px]:hidden max-h-[550px]:hidden">
        <h1 className="text-2xl font-semibold tracking-wide m-0">tauri-chordie</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-white font-medium select-none">
              <input
                type="checkbox"
                checked={enforceRootNote}
                onChange={(e) => setEnforceRootNote(e.target.checked)}
                className="w-[18px] h-[18px] accent-secondary cursor-pointer"
              />
              Enforce Root Note
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-white font-medium select-none">
              Key:
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="py-1 px-2 rounded border-2 border-white/30 bg-white/20 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-white/25 hover:border-white/40 focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                <option value="C" className="bg-card text-foreground">C/Am (0♯/♭)</option>
                <option value="G" className="bg-card text-foreground">G/Em (1♯)</option>
                <option value="D" className="bg-card text-foreground">D/Bm (2♯)</option>
                <option value="A" className="bg-card text-foreground">A/F#m (3♯)</option>
                <option value="E" className="bg-card text-foreground">E/C#m (4♯)</option>
                <option value="B" className="bg-card text-foreground">B/G#m (5♯)</option>
                <option value="F#" className="bg-card text-foreground">F#/D#m (6♯)</option>
                <option value="Gb" className="bg-card text-foreground">Gb/Ebm (6♭)</option>
                <option value="Db" className="bg-card text-foreground">Db/Bbm (5♭)</option>
                <option value="Ab" className="bg-card text-foreground">Ab/Fm (4♭)</option>
                <option value="Eb" className="bg-card text-foreground">Eb/Cm (3♭)</option>
                <option value="Bb" className="bg-card text-foreground">Bb/Gm (2♭)</option>
                <option value="F" className="bg-card text-foreground">F/Dm (1♭)</option>
              </select>
            </label>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
              className={`flex items-center justify-between py-2 px-4 min-w-[200px] bg-white/20 border-2 border-white/30 rounded-lg text-white font-medium cursor-pointer transition-all duration-200 shadow-sm hover:bg-white/25 hover:border-white/40 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-white/50 after:content-[''] after:w-0 after:h-0 after:border-l-[6px] after:border-l-transparent after:border-r-[6px] after:border-r-transparent after:border-t-[6px] after:border-t-white after:transition-transform after:duration-200 after:ml-4 ${isDeviceSelectorOpen ? 'after:rotate-180' : ''}`}
              aria-expanded={isDeviceSelectorOpen}
              aria-controls="midi-device-list-popup"
            >
              {getSelectedDeviceName()}
            </button>
            {isDeviceSelectorOpen && (
              <div id="midi-device-list-popup" className="absolute top-[calc(100%+8px)] right-0 bg-card rounded-lg w-full min-w-[250px] max-h-[400px] overflow-y-auto shadow-lg z-[100]">
                {midiDevices.length > 0 ? (
                  <ul className="list-none">
                    {midiDevices.map((device) => (
                      <li
                        key={device.index}
                        onClick={() => handleDeviceClick(device.index)}
                        className={`p-4 block cursor-pointer transition-colors duration-200 border-b border-gray-200 last:border-b-0 ${selectedDeviceIndex === device.index ? "bg-primary text-white font-medium" : "text-foreground hover:bg-gray-100"}`}
                        role="option"
                        aria-selected={selectedDeviceIndex === device.index}
                      >
                        {device.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-6 text-center text-gray-600 italic">No MIDI devices found</p>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center p-4 overflow-hidden bg-background h-[calc(100vh-var(--header-height))] min-h-0 max-[900px]:h-screen max-h-[550px]:h-screen max-[900px]:p-0 max-h-[550px]:p-0">
        {error && <p className="w-full max-w-[800px] mb-6 p-4 rounded-lg text-[0.95rem] shadow-sm text-center bg-error/5 text-error border-l-4 border-error max-[900px]:hidden max-h-[550px]:hidden">{error}</p>}
        {selectedDeviceIndex === null && !error && midiDevices.length > 0 && (
           <p className="w-full max-w-[800px] mb-6 p-4 rounded-lg text-[0.95rem] shadow-sm text-center bg-primary/5 text-primary border-l-4 border-primary max-[900px]:hidden max-h-[550px]:hidden">Please select a MIDI device to start</p>
        )}

        <div className="w-full max-w-[1000px] h-full flex flex-col items-center justify-center gap-6 min-h-0 flex-1 max-[900px]:w-full max-[900px]:h-full max-[900px]:p-6 max-[900px]:pt-[calc(48px+1.5rem+1rem)] max-h-[550px]:w-full max-h-[550px]:h-full max-h-[550px]:p-6 max-h-[550px]:pt-[calc(48px+1.5rem+1rem)] max-[900px]:gap-4 max-h-[550px]:gap-4 max-[900px]:max-w-none max-h-[550px]:max-w-none max-[768px]:p-4 max-[768px]:pt-[calc(48px+1rem+0.5rem)] max-[480px]:p-2 max-[480px]:pt-[calc(44px+0.5rem+0.25rem)] max-[480px]:gap-2">
          <div className="w-full flex-1 min-h-0 bg-card p-6 rounded-2xl shadow-md flex items-center justify-center overflow-hidden max-[900px]:p-4 max-h-[550px]:p-4 max-[768px]:p-2 max-[480px]:p-1">
            <StaffDisplay heldNotes={heldNotes} musicalKey={selectedKey as MusicalKey} />
          </div>
          <div className="h-[60px] min-h-[60px] w-full flex justify-center items-center shrink-0 max-[900px]:h-auto max-[900px]:min-h-[60px] max-[900px]:py-4 max-h-[550px]:h-auto max-h-[550px]:min-h-[60px] max-h-[550px]:py-4 max-[480px]:min-h-[50px] max-[480px]:py-2">
            <ChordDisplay chordText={detectedChordString} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
