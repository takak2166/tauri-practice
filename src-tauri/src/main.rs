// Prevents an extra console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use tauri::{generate_context, Builder};

use tauri_practice::commands;
use tauri_practice::commands::SharedState;
use tauri_practice::game::game_engine::GameEngine;

fn main() {
    let shared_state = SharedState {
        engine: Mutex::new(GameEngine::new()),
    };

    Builder::default()
        .manage(shared_state)
        .invoke_handler(tauri::generate_handler![
            commands::new_game,
            commands::get_state
        ])
        .run(generate_context!())
        .expect("error while running tauri application");
}
