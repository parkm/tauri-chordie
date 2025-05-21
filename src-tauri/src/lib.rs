use midir::{MidiInput, Ignore, MidiInputConnection};
use std::sync::{Mutex, Arc};
use std::collections::HashSet;
use tauri::{AppHandle, State, Window, Emitter};

#[derive(serde::Serialize, Clone)]
struct MidiDevice {
    index: usize,
    name: String,
}

#[tauri::command]
fn get_midi_devices() -> Result<Vec<MidiDevice>, String> {
    let midi_in = MidiInput::new("tauri-chordie-input");
    match midi_in {
        Ok(midi_in) => {
            let mut devices = Vec::new();
            for (i, p) in midi_in.ports().iter().enumerate() {
                devices.push(MidiDevice {
                    index: i,
                    name: midi_in.port_name(p).unwrap_or_else(|_| "Unknown Device".to_string()),
                });
            }
            Ok(devices)
        }
        Err(e) => Err(format!("Failed to initialize MIDI: {}", e)),
    }
}

struct MidiConnectionState {
    connection: Option<MidiInputConnection<()>>,
}

#[tauri::command]
async fn listen_to_midi_device(
    app_handle: AppHandle,
    window: Window,
    port_index: usize,
    state: State<'_, Mutex<MidiConnectionState>>,
) -> Result<(), String> {
    let mut midi_in = MidiInput::new(&format!("tauri-chordie-conn-{}", port_index))
        .map_err(|e| format!("Failed to create MidiInput: {}", e))?;

    midi_in.ignore(Ignore::None);

    let ports = midi_in.ports();
    let selected_port = ports
        .get(port_index)
        .ok_or_else(|| format!("Port index {} out of range", port_index))?;

    let port_name = midi_in.port_name(selected_port).unwrap_or_else(|_| "Unknown Port".to_string());
    println!("Listening to MIDI port: {}", port_name);

    // Shared state for held notes for this specific connection
    let held_notes = Arc::new(Mutex::new(HashSet::<u8>::new()));

    let conn = midi_in
        .connect(
            selected_port,
            &format!("midir-read-input-{}", port_index),
            move |_stamp, message, _| {
                if message.len() < 3 { // Basic Note On/Off messages are 3 bytes
                    // Optionally log other messages or handle them differently
                    // window.emit("midi_other_message", message.to_vec()).ok();
                    return;
                }

                let status = message[0];
                let key = message[1];
                let velocity = message[2];

                let mut notes = held_notes.lock().unwrap();

                // Note On: 0x90 - 0x9F. Note Off: 0x80 - 0x8F
                // A Note On with velocity 0 is often treated as Note Off.
                if (status & 0xF0) == 0x90 && velocity > 0 {
                    notes.insert(key);
                } else if (status & 0xF0) == 0x80 || ((status & 0xF0) == 0x90 && velocity == 0) {
                    notes.remove(&key);
                }

                let current_held_notes: Vec<u8> = notes.iter().cloned().collect();
                // Sort for consistent display, though not strictly necessary for correctness
                // current_held_notes.sort();

                // Emit the current set of held notes
                let _ = window.emit("midi_held_notes", current_held_notes);
            },
            (),
        )
        .map_err(|e| format!("Failed to connect to MIDI port: {}", e))?;

    let mut app_state = state.lock().unwrap();
    app_state.connection = Some(conn);

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(MidiConnectionState { connection: None }))
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_midi_devices,
            listen_to_midi_device
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
