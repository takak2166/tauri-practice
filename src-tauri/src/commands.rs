use std::sync::Mutex;

use tauri::State;

use crate::game::game_engine::GameEngine;
use crate::models::game_state::GameState;

pub struct SharedState {
    pub engine: Mutex<GameEngine>,
}

#[tauri::command]
pub fn new_game(state: State<SharedState>) -> Result<GameState, String> {
    let mut engine = state.engine.lock().map_err(|e| e.to_string())?;
    let game_state = engine.new_game().clone();
    Ok(game_state)
}

#[tauri::command]
pub fn get_state(state: State<SharedState>) -> Result<GameState, String> {
    let engine = state.engine.lock().map_err(|e| e.to_string())?;
    Ok(engine.get_state())
}

#[tauri::command]
pub fn player_discard(state: State<SharedState>, tile_id: u8) -> Result<GameState, String> {
    let mut engine = state.engine.lock().map_err(|e| e.to_string())?;
    let game_state = engine.player_discard(tile_id)?.clone();
    Ok(game_state)
}


