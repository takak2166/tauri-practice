use crate::models::game_state::{GamePhase, GameState, Player};
use crate::models::tile::{create_wall, shuffle_wall, sort_hand, Tile};
use crate::game::win_checker::{can_win, can_win_by_ron};
use rand::Rng;

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

        // First draw for the starting player
        if let Some(tile) = self.wall.pop() {
            self.state.hands[0].push(tile);
            sort_hand(&mut self.state.hands[0]);
        }

        self.state.wall_count = self.wall.len();
        self.state.current_player = Player::Player;
        // After initial deal and first draw, player can discard
        self.state.phase = GamePhase::Discard;
        
        // Update win flags
        self.update_win_flags();

        &self.state
    }

    pub fn get_state(&self) -> GameState {
        self.state.clone()
    }

    /// Player discards a tile; validates turn, phase, and tile existence.
    pub fn player_discard(&mut self, tile_id: u8) -> Result<&GameState, String> {
        // Validate turn and phase
        if self.state.current_player != Player::Player {
            return Err("Not player's turn".into());
        }
        if self.state.phase != GamePhase::Discard {
            return Err("Not in discard phase".into());
        }

        // Remove one occurrence from player's hand
        let hand = &mut self.state.hands[0];
        if let Some(pos) = hand.iter().position(|t| t.id == tile_id) {
            let tile = hand.remove(pos);
            self.state.discards[0].push(tile);
        } else {
            return Err("Tile not found in hand".into());
        }

        // Advance turn to CPU1 and set phase to Draw for next actor
        self.state.current_player = Player::Cpu1;
        self.state.phase = GamePhase::Draw;
        
        // Update win flags (check if CPU1 can ron the discarded tile)
        self.update_win_flags();

        Ok(&self.state)
    }

    /// CPU step: draw if in Draw phase, discard randomly if in Discard phase.
    pub fn cpu_step(&mut self) -> Result<&GameState, String> {

        // Validate it's a CPU turn
        match self.state.current_player {
            Player::Cpu1 | Player::Cpu2 | Player::Cpu3 => {}
            Player::Player => return Err("Not CPU turn".into()),
        }

        match self.state.phase {
            GamePhase::Draw => {
                // Draw a tile
                if let Some(tile) = self.wall.pop() {
                    let cpu_index = match self.state.current_player {
                        Player::Cpu1 => 1,
                        Player::Cpu2 => 2,
                        Player::Cpu3 => 3,
                        Player::Player => unreachable!(),
                    };
                    self.state.hands[cpu_index].push(tile);
                    sort_hand(&mut self.state.hands[cpu_index]);
                    self.state.wall_count = self.wall.len();
                    self.state.phase = GamePhase::Discard;
                    
                    // Update win flags (check if CPU can tsumo)
                    self.update_win_flags();
                } else {
                    // Wall exhausted
                    self.state.phase = GamePhase::End;
                    return Ok(&self.state);
                }
            }
            GamePhase::Discard => {
                // Discard a random tile
                let cpu_index = match self.state.current_player {
                    Player::Cpu1 => 1,
                    Player::Cpu2 => 2,
                    Player::Cpu3 => 3,
                    Player::Player => unreachable!(),
                };
                let hand = &mut self.state.hands[cpu_index];
                if hand.is_empty() {
                    return Err("CPU hand is empty".into());
                }

                let mut rng = rand::thread_rng();
                let discard_index = rng.gen_range(0..hand.len());
                let tile = hand.remove(discard_index);
                self.state.discards[cpu_index].push(tile);

                // Advance to next player
                self.state.current_player = self.state.current_player.next();
                self.state.phase = GamePhase::Draw;
                
                // Update win flags (check if next player can ron the discarded tile)
                self.update_win_flags();
            }
            GamePhase::End => {
                return Err("Game has ended".into());
            }
        }

        Ok(&self.state)
    }

    /// Update win flags (can_tsumo and can_ron) for all players
    fn update_win_flags(&mut self) {
        // Reset flags
        self.state.can_tsumo = false;
        self.state.can_ron = false;

        // Check tsumo for current player (if in Discard phase after drawing, hand has 14 tiles)
        if self.state.phase == GamePhase::Discard {
            let current_index = match self.state.current_player {
                Player::Player => 0,
                Player::Cpu1 => 1,
                Player::Cpu2 => 2,
                Player::Cpu3 => 3,
            };
            if can_win(&self.state.hands[current_index]) {
                self.state.can_tsumo = true;
            }
        }

        // Check ron for other players (if last discarded tile can complete their hand)
        // Find the last discarded tile
        let last_discarded = self.state.discards.iter()
            .flat_map(|discards| discards.last())
            .last()
            .copied();

        if let Some(discarded_tile) = last_discarded {
            for (index, hand) in self.state.hands.iter().enumerate() {
                let player = match index {
                    0 => Player::Player,
                    1 => Player::Cpu1,
                    2 => Player::Cpu2,
                    3 => Player::Cpu3,
                    _ => continue,
                };
                // Don't check ron for the player who just discarded
                if player == self.state.current_player {
                    continue;
                }
                if can_win_by_ron(hand, discarded_tile) {
                    self.state.can_ron = true;
                    break;
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_game_deals_tiles() {
        let mut engine = GameEngine::new();
        let state = engine.new_game();

        // Player has 14 tiles (13 dealt + 1 initial draw), others have 13
        assert_eq!(state.hands[0].len(), 14);
        assert_eq!(state.hands[1].len(), 13);
        assert_eq!(state.hands[2].len(), 13);
        assert_eq!(state.hands[3].len(), 13);
        // Wall count should be 136 - 52 - 1 = 83
        assert_eq!(state.wall_count, 83);
        // Phase and current player set
        assert_eq!(state.phase, GamePhase::Discard);
        assert_eq!(state.current_player, Player::Player);
    }

    #[test]
    fn test_get_state_returns_clone() {
        let mut engine = GameEngine::new();
        engine.new_game();
        let state = engine.get_state();
        assert_eq!(state.hands.len(), 4);
    }

    #[test]
    fn test_player_discard() {
        let mut engine = GameEngine::new();
        engine.new_game();

        // Ensure player has tile 0 after new_game
        let had_tile0 = engine.state.hands[0].iter().any(|t| t.id == 0);
        if !had_tile0 {
            engine.state.hands[0].push(Tile::new(0).unwrap());
        }
        let before_len = engine.state.hands[0].len();
        let res = engine.player_discard(0);
        assert!(res.is_ok());

        let state = res.unwrap();
        assert_eq!(state.hands[0].len(), before_len - 1);
        assert!(state.discards[0].iter().any(|t| t.id == 0));
        assert_eq!(state.current_player, Player::Cpu1);
        assert_eq!(state.phase, GamePhase::Draw);
    }

    #[test]
    fn test_cpu_step_draw() {
        let mut engine = GameEngine::new();
        engine.new_game();
        
        // Ensure player has a tile to discard
        let tile_id = engine.state.hands[0][0].id;
        engine.player_discard(tile_id).unwrap(); // Player discards, turn goes to Cpu1

        let before_wall = engine.state.wall_count;
        let before_hand_len = engine.state.hands[1].len();
        let res = engine.cpu_step();
        assert!(res.is_ok());

        let state = res.unwrap();
        // Cpu1 should have drawn a tile
        assert_eq!(state.hands[1].len(), before_hand_len + 1);
        assert_eq!(state.wall_count, before_wall - 1);
        assert_eq!(state.phase, GamePhase::Discard);
        assert_eq!(state.current_player, Player::Cpu1);
    }

    #[test]
    fn test_cpu_step_discard() {
        let mut engine = GameEngine::new();
        engine.new_game();
        
        // Ensure player has a tile to discard
        let tile_id = engine.state.hands[0][0].id;
        engine.player_discard(tile_id).unwrap(); // Player discards, turn goes to Cpu1
        engine.cpu_step().unwrap(); // Cpu1 draws

        let before_hand_len = engine.state.hands[1].len();
        let before_discard_len = engine.state.discards[1].len();
        let res = engine.cpu_step();
        assert!(res.is_ok());

        let state = res.unwrap();
        // Cpu1 should have discarded a tile
        assert_eq!(state.hands[1].len(), before_hand_len - 1);
        assert_eq!(state.discards[1].len(), before_discard_len + 1);
        // Turn should advance to Cpu2
        assert_eq!(state.current_player, Player::Cpu2);
        assert_eq!(state.phase, GamePhase::Draw);
    }
}


