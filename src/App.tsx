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
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number | null>(null);
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
      setError(`Failed to connect to ${midiDevices.find((d) => d.index === index)?.name || `device ${index}`}.`);
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
          console.error(`Failed to set up MIDI held notes listener for device index ${selectedDeviceIndex}:`, err);
          setError("Error receiving MIDI data.");
        }
      };
      setupListener();
    }

    return () => {
      if (unlisten) {
        unlisten();
        console.log(`Stopped listening for MIDI held notes from device index: ${selectedDeviceIndex}`);
      }
    };
  }, [selectedDeviceIndex, enforceRootNote, selectedKey]);

  const getSelectedDeviceName = () => {
    if (selectedDeviceIndex === null) return "Select MIDI Device";
    const device = midiDevices.find((d) => d.index === selectedDeviceIndex);
    return device ? device.name : `Device ${selectedDeviceIndex}`;
  };

  return (
    <div className="relative grid h-screen w-screen grid-rows-[auto_1fr] overflow-hidden">
      {/* Hamburger menu button - only visible in compact mode */}
      <button
        className="show-compact show-compact-flex bg-primary hover:bg-primary-dark mobile:top-2 mobile:left-2 mobile:h-11 mobile:w-11 fixed top-4 left-4 z-[1000] h-12 w-12 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-lg border-none shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
        aria-expanded={isMenuOpen}
      >
        <span className="block h-[3px] w-6 rounded bg-white transition-all duration-300"></span>
        <span className="block h-[3px] w-6 rounded bg-white transition-all duration-300"></span>
        <span className="block h-[3px] w-6 rounded bg-white transition-all duration-300"></span>
      </button>

      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div
          className="show-compact show-compact-block animate-fade-in fixed inset-0 z-[999] bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Sliding menu panel - visible only in compact mode */}
      <div
        className={`show-compact show-compact-block bg-card mobile:w-full fixed top-0 z-[1000] h-screen w-80 overflow-y-auto shadow-lg transition-[left] duration-300 ${isMenuOpen ? "left-0" : "mobile:-left-full -left-80"}`}
      >
        <div className="from-primary to-primary-dark sticky top-0 z-10 flex items-center justify-between bg-gradient-to-br p-6 text-white">
          <h2 className="m-0 text-2xl font-semibold">Settings</h2>
          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border-none bg-transparent p-1 text-2xl text-white transition-colors duration-200 hover:bg-white/20"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h3 className="text-foreground m-0 mb-4 text-lg font-semibold">Key Signature</h3>
            <div>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="bg-background text-foreground hover:border-primary focus:border-primary focus:ring-primary/10 w-full cursor-pointer rounded-lg border-2 border-gray-300 p-4 text-base transition-all duration-200 focus:ring-4 focus:outline-none"
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
            <h3 className="text-foreground m-0 mb-4 text-lg font-semibold">Chord Detection</h3>
            <div>
              <label className="text-foreground flex cursor-pointer items-center gap-4 text-base select-none">
                <input
                  type="checkbox"
                  checked={enforceRootNote}
                  onChange={(e) => setEnforceRootNote(e.target.checked)}
                  className="accent-primary h-5 w-5 cursor-pointer"
                />
                Enforce Root Note
              </label>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-foreground m-0 mb-4 text-lg font-semibold">MIDI Device</h3>
            <div>
              <button
                onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
                className={`bg-primary hover:bg-primary-dark relative w-full cursor-pointer rounded-lg border-none p-4 text-left text-base font-medium text-white transition-all duration-200 after:absolute after:top-1/2 after:right-4 after:h-0 after:w-0 after:-translate-y-1/2 after:border-t-[6px] after:border-r-[6px] after:border-l-[6px] after:border-t-white after:border-r-transparent after:border-l-transparent after:transition-transform after:duration-200 after:content-[''] ${isDeviceSelectorOpen ? "after:rotate-180" : ""}`}
              >
                {getSelectedDeviceName()}
              </button>
              {isDeviceSelectorOpen && (
                <div className="bg-background mt-2 overflow-hidden rounded-lg shadow-sm">
                  {midiDevices.length > 0 ? (
                    <ul className="m-0 list-none p-0">
                      {midiDevices.map((device) => (
                        <li
                          key={device.index}
                          onClick={() => {
                            handleDeviceClick(device.index);
                            setIsMenuOpen(false);
                          }}
                          className={`cursor-pointer border-b border-gray-300 p-4 transition-colors duration-200 last:border-b-0 ${selectedDeviceIndex === device.index ? "bg-primary font-semibold text-white" : "text-foreground hover:bg-gray-100"}`}
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

          {error && (
            <div className="bg-error/10 text-error border-error rounded-lg border-l-4 p-4 text-sm">{error}</div>
          )}
        </div>
      </div>

      {/* Header - hidden in compact mode */}
      <header className="hide-compact from-primary to-primary-dark z-50 flex h-16 items-center justify-between bg-gradient-to-br px-6 text-white shadow-md">
        <h1 className="m-0 text-2xl font-semibold tracking-wide">tauri-chordie</h1>
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <label className="flex items-center gap-2 font-medium text-white select-none">
              <input
                type="checkbox"
                checked={enforceRootNote}
                onChange={(e) => setEnforceRootNote(e.target.checked)}
                className="accent-secondary h-[18px] w-[18px] cursor-pointer"
              />
              Enforce Root Note
            </label>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 font-medium text-white select-none">
              Key:
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="cursor-pointer rounded border-2 border-white/30 bg-white/20 px-2 py-1 font-medium text-white transition-all duration-200 hover:border-white/40 hover:bg-white/25 focus:ring-4 focus:ring-white/30 focus:outline-none"
              >
                <option value="C" className="bg-card text-foreground">
                  C/Am (0♯/♭)
                </option>
                <option value="G" className="bg-card text-foreground">
                  G/Em (1♯)
                </option>
                <option value="D" className="bg-card text-foreground">
                  D/Bm (2♯)
                </option>
                <option value="A" className="bg-card text-foreground">
                  A/F#m (3♯)
                </option>
                <option value="E" className="bg-card text-foreground">
                  E/C#m (4♯)
                </option>
                <option value="B" className="bg-card text-foreground">
                  B/G#m (5♯)
                </option>
                <option value="F#" className="bg-card text-foreground">
                  F#/D#m (6♯)
                </option>
                <option value="Gb" className="bg-card text-foreground">
                  Gb/Ebm (6♭)
                </option>
                <option value="Db" className="bg-card text-foreground">
                  Db/Bbm (5♭)
                </option>
                <option value="Ab" className="bg-card text-foreground">
                  Ab/Fm (4♭)
                </option>
                <option value="Eb" className="bg-card text-foreground">
                  Eb/Cm (3♭)
                </option>
                <option value="Bb" className="bg-card text-foreground">
                  Bb/Gm (2♭)
                </option>
                <option value="F" className="bg-card text-foreground">
                  F/Dm (1♭)
                </option>
              </select>
            </label>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDeviceSelectorOpen(!isDeviceSelectorOpen)}
              className={`flex min-w-[200px] cursor-pointer items-center justify-between rounded-lg border-2 border-white/30 bg-white/20 px-4 py-2 font-medium text-white shadow-sm transition-all duration-200 after:ml-4 after:h-0 after:w-0 after:border-t-[6px] after:border-r-[6px] after:border-l-[6px] after:border-t-white after:border-r-transparent after:border-l-transparent after:transition-transform after:duration-200 after:content-[''] hover:border-white/40 hover:bg-white/25 hover:shadow-md focus:ring-4 focus:ring-white/50 focus:outline-none ${isDeviceSelectorOpen ? "after:rotate-180" : ""}`}
              aria-expanded={isDeviceSelectorOpen}
              aria-controls="midi-device-list-popup"
            >
              {getSelectedDeviceName()}
            </button>
            {isDeviceSelectorOpen && (
              <div
                id="midi-device-list-popup"
                className="bg-card absolute top-[calc(100%+8px)] right-0 z-[100] max-h-[400px] w-full min-w-[250px] overflow-y-auto rounded-lg shadow-lg"
              >
                {midiDevices.length > 0 ? (
                  <ul className="list-none">
                    {midiDevices.map((device) => (
                      <li
                        key={device.index}
                        onClick={() => handleDeviceClick(device.index)}
                        className={`block cursor-pointer border-b border-gray-200 p-4 transition-colors duration-200 last:border-b-0 ${selectedDeviceIndex === device.index ? "bg-primary font-medium text-white" : "text-foreground hover:bg-gray-100"}`}
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

      {/* Main content area - responsive layout */}
      <main className="bg-background compact:h-screen compact:w-screen compact:p-0 compact-h:h-screen compact-h:w-screen compact-h:p-0 flex h-[calc(100vh-var(--header-height))] min-h-0 flex-col items-center justify-center overflow-hidden p-4">
        {/* Error message - hidden in compact mode */}
        {error && (
          <p className="hide-compact bg-error/5 text-error border-error mb-6 w-full max-w-[800px] rounded-lg border-l-4 p-4 text-center text-[0.95rem] shadow-sm">
            {error}
          </p>
        )}

        {/* Info message - hidden in compact mode */}
        {selectedDeviceIndex === null && !error && midiDevices.length > 0 && (
          <p className="hide-compact bg-primary/5 text-primary border-primary mb-6 w-full max-w-[800px] rounded-lg border-l-4 p-4 text-center text-[0.95rem] shadow-sm">
            Please select a MIDI device to start
          </p>
        )}

        {/* Content container - responsive spacing and sizing */}
        <div className="compact:w-screen compact:h-screen compact:max-w-none compact:gap-0 compact:p-4 compact:pt-[calc(3rem+1rem)] compact-h:w-screen compact-h:h-screen compact-h:max-w-none compact-h:gap-0 compact-h:p-4 compact-h:pt-[calc(3rem+1rem)] mobile:pt-[calc(2.75rem+0.5rem)] flex h-full min-h-0 w-full max-w-[1000px] flex-1 flex-col items-center justify-center gap-6">
          {/* Staff display card - responsive padding */}
          <div className="bg-card compact:rounded-none compact:shadow-none compact:flex-[2] compact:p-4 compact-h:rounded-none compact-h:shadow-none compact-h:flex-[2] compact-h:p-4 tablet:p-3 mobile:p-2 flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-2xl p-6 shadow-md">
            <StaffDisplay heldNotes={heldNotes} musicalKey={selectedKey as MusicalKey} />
          </div>

          {/* Chord display area - responsive height */}
          <div className="compact:h-auto compact:flex-1 compact:min-h-[80px] compact:bg-card compact-h:h-auto compact-h:flex-1 compact-h:min-h-[80px] compact-h:bg-card mobile:min-h-[70px] flex h-[60px] min-h-[60px] w-full shrink-0 items-center justify-center">
            <ChordDisplay chordText={detectedChordString} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
