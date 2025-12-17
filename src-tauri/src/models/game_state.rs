use serde::{Deserialize, Serialize};
use super::tile::Tile;

/// Game phase
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GamePhase {
    Draw,    // Draw a tile
    Discard, // Discard a tile
    End,     // Game over
}

/// Player seat
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Player {
    Player, // Human player
    Cpu1,
    Cpu2,
    Cpu3,
}

impl Player {
    /// Next player (counter-clockwise)
    pub fn next(&self) -> Player {
        match self {
            Player::Player => Player::Cpu1,
            Player::Cpu1 => Player::Cpu2,
            Player::Cpu2 => Player::Cpu3,
            Player::Cpu3 => Player::Player,
        }
    }
}

/// Game state snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub hands: [Vec<Tile>; 4],
    pub discards: [Vec<Tile>; 4],
    pub wall_count: usize,
    pub current_player: Player,
    pub phase: GamePhase,
}

impl GameState {
    /// Create initial game state
    pub fn new() -> Self {
        GameState {
            hands: [Vec::new(), Vec::new(), Vec::new(), Vec::new()],
            discards: [Vec::new(), Vec::new(), Vec::new(), Vec::new()],
            wall_count: 136,
            current_player: Player::Player,
            phase: GamePhase::Draw,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_player_next() {
        assert_eq!(Player::Player.next(), Player::Cpu1);
        assert_eq!(Player::Cpu1.next(), Player::Cpu2);
        assert_eq!(Player::Cpu2.next(), Player::Cpu3);
        assert_eq!(Player::Cpu3.next(), Player::Player);
    }

    #[test]
    fn test_game_state_new() {
        let state = GameState::new();
        assert_eq!(state.hands.len(), 4);
        assert_eq!(state.discards.len(), 4);
        assert_eq!(state.wall_count, 136);
        assert_eq!(state.current_player, Player::Player);
        assert_eq!(state.phase, GamePhase::Draw);
    }
}

