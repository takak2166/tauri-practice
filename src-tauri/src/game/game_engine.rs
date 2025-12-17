use crate::models::game_state::{GamePhase, GameState, Player};
use crate::models::tile::{create_wall, shuffle_wall, sort_hand, Tile};

pub struct GameEngine {
    wall: Vec<Tile>,
    state: GameState,
}

impl GameEngine {
    pub fn new() -> Self {
        GameEngine {
            wall: Vec::new(),
            state: GameState::new(),
        }
    }

    /// Start a new game: build wall, shuffle, deal 13 tiles to each player, set phase/player.
    pub fn new_game(&mut self) -> &GameState {
        self.wall = create_wall();
        shuffle_wall(&mut self.wall);

        // Reset state
        self.state = GameState::new();

        // Deal 13 tiles to each seat (Player, Cpu1, Cpu2, Cpu3)
        for hand in self.state.hands.iter_mut() {
            for _ in 0..13 {
                if let Some(tile) = self.wall.pop() {
                    hand.push(tile);
                }
            }
            sort_hand(hand);
        }

        self.state.wall_count = self.wall.len();
        self.state.current_player = Player::Player;
        self.state.phase = GamePhase::Draw;

        &self.state
    }

    pub fn get_state(&self) -> GameState {
        self.state.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_game_deals_tiles() {
        let mut engine = GameEngine::new();
        let state = engine.new_game();

        // 13 tiles each
        for hand in state.hands.iter() {
            assert_eq!(hand.len(), 13);
        }
        // Wall count should be 136 - 52 = 84
        assert_eq!(state.wall_count, 84);
        // Phase and current player set
        assert_eq!(state.phase, GamePhase::Draw);
        assert_eq!(state.current_player, Player::Player);
    }

    #[test]
    fn test_get_state_returns_clone() {
        let mut engine = GameEngine::new();
        engine.new_game();
        let state = engine.get_state();
        assert_eq!(state.hands.len(), 4);
    }
}


