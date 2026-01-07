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

        // First draw for the starting player (store in drawn_tile, not in hand)
        if let Some(tile) = self.wall.pop() {
            self.state.drawn_tile[0] = Some(tile);
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

    /// Player draws a tile; validates turn and phase.
    pub fn player_draw(&mut self) -> Result<&GameState, String> {
        // Validate turn and phase
        if self.state.current_player != Player::Player {
            return Err("Not player's turn".into());
        }
        if self.state.phase != GamePhase::Draw {
            return Err("Not in draw phase".into());
        }

        // Draw a tile and store it separately (don't add to hand yet)
        if let Some(tile) = self.wall.pop() {
            self.state.drawn_tile[0] = Some(tile);
            self.state.wall_count = self.wall.len();
            self.state.phase = GamePhase::Discard;
            
            // Update win flags (check if player can tsumo with drawn tile)
            self.update_win_flags();
        } else {
            // Wall exhausted
            self.state.phase = GamePhase::End;
            return Ok(&self.state);
        }

        Ok(&self.state)
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

        // Check if discarding the drawn tile
        if let Some(drawn) = self.state.drawn_tile[0] {
            if drawn.id == tile_id {
                // Discard the drawn tile (no sorting needed, hand is already sorted)
                self.state.discards[0].push(drawn);
                self.state.drawn_tile[0] = None;
            } else {
                // Discard from hand: first add drawn_tile to hand, sort, then discard
                let hand = &mut self.state.hands[0];
                hand.push(drawn);
                sort_hand(hand);
                self.state.drawn_tile[0] = None;
                
                // Now discard the specified tile from hand
                if let Some(pos) = hand.iter().position(|t| t.id == tile_id) {
                    let tile = hand.remove(pos);
                    self.state.discards[0].push(tile);
                } else {
                    return Err("Tile not found in hand".into());
                }
            }
        } else {
            // No drawn tile, discard from hand
            let hand = &mut self.state.hands[0];
            if let Some(pos) = hand.iter().position(|t| t.id == tile_id) {
                let tile = hand.remove(pos);
                self.state.discards[0].push(tile);
            } else {
                return Err("Tile not found in hand".into());
            }
        }

        // Update last_discarder to Player
        self.state.last_discarder = Some(Player::Player);

        // Update win flags (check if any player can ron the discarded tile)
        // Note: Don't advance current_player yet, as handle_ron_phase will set it
        self.update_win_flags();
        
        // Handle ron phase (check if any player can ron)
        // This will set current_player to the first player who can ron, or advance to next if none
        self.handle_ron_phase();

        Ok(&self.state)
    }

    /// Player chooses to ron (win by claiming discarded tile)
    pub fn player_ron(&mut self) -> Result<&GameState, String> {
        // Validate turn and phase
        if self.state.current_player != Player::Player {
            return Err("Not player's turn".into());
        }
        if self.state.phase != GamePhase::Ron {
            return Err("Not in ron phase".into());
        }
        if !self.state.can_ron[0] {
            return Err("Player cannot ron".into());
        }

        // Player rons: game ends
        self.state.phase = GamePhase::End;
        Ok(&self.state)
    }

    /// Player chooses to pass (skip ron)
    pub fn player_pass(&mut self) -> Result<&GameState, String> {
        // Validate turn and phase
        if self.state.current_player != Player::Player {
            return Err("Not player's turn".into());
        }
        if self.state.phase != GamePhase::Ron {
            return Err("Not in ron phase".into());
        }

        // Player passes: reset player's ron flag first
        self.state.can_ron[0] = false;
        
        // Update win flags to check if other players can still ron the same discarded tile
        // (in case multiple players could ron, we need to check the next one)
        self.update_win_flags();
        
        // Ensure player's ron flag remains false after update_win_flags
        // (player has already passed, so they cannot ron even if they could)
        self.state.can_ron[0] = false;
        
        // If another player can ron, set phase to Ron for that player
        // Otherwise, proceed with Draw phase for next player
        self.handle_ron_phase();
        
        Ok(&self.state)
    }

    /// CPU step: draw if in Draw phase, discard randomly if in Discard phase, auto-ron if in Ron phase.
    pub fn cpu_step(&mut self) -> Result<&GameState, String> {

        // Validate it's a CPU turn
        match self.state.current_player {
            Player::Cpu1 | Player::Cpu2 | Player::Cpu3 => {}
            Player::Player => return Err("Not CPU turn".into()),
        }

        match self.state.phase {
            GamePhase::Draw => {
                // Draw a tile and store it separately (don't add to hand yet)
                if let Some(tile) = self.wall.pop() {
                    let cpu_index = match self.state.current_player {
                        Player::Cpu1 => 1,
                        Player::Cpu2 => 2,
                        Player::Cpu3 => 3,
                        Player::Player => unreachable!(),
                    };
                    self.state.drawn_tile[cpu_index] = Some(tile);
                    self.state.wall_count = self.wall.len();
                    self.state.phase = GamePhase::Discard;
                    
                    // Update win flags (check if CPU can tsumo with drawn tile)
                    self.update_win_flags();
                } else {
                    // Wall exhausted
                    self.state.phase = GamePhase::End;
                    return Ok(&self.state);
                }
            }
            GamePhase::Discard => {
                // Discard a random tile from hand (including drawn_tile if present)
                let cpu_index = match self.state.current_player {
                    Player::Cpu1 => 1,
                    Player::Cpu2 => 2,
                    Player::Cpu3 => 3,
                    Player::Player => unreachable!(),
                };
                
                // Add drawn_tile to hand if present, then discard randomly
                let hand = &mut self.state.hands[cpu_index];
                if let Some(drawn) = self.state.drawn_tile[cpu_index] {
                    hand.push(drawn);
                    self.state.drawn_tile[cpu_index] = None;
                }
                
                if hand.is_empty() {
                    return Err("CPU hand is empty".into());
                }
                
                // Discard a random tile from hand
                let mut rng = rand::thread_rng();
                let discard_index = rng.gen_range(0..hand.len());
                let discarded_tile = hand.remove(discard_index);
                
                // Sort hand after discarding
                sort_hand(hand);
                
                self.state.discards[cpu_index].push(discarded_tile);

                // Update last_discarder to current CPU player
                self.state.last_discarder = Some(self.state.current_player);

                // Update win flags (check if any player can ron the discarded tile)
                // Note: Don't advance current_player yet, as handle_ron_phase will set it
                self.update_win_flags();
                
                // Handle ron phase (check if any player can ron)
                // This will set current_player to the first player who can ron, or advance to next if none
                self.handle_ron_phase();
            }
            GamePhase::Ron => {
                // Ron phase: CPU automatically rons, player can choose
                let ron_player_index = match self.state.current_player {
                    Player::Player => 0,
                    Player::Cpu1 => 1,
                    Player::Cpu2 => 2,
                    Player::Cpu3 => 3,
                };
                
                // Check if this player can actually ron
                if !self.state.can_ron[ron_player_index] {
                    // Player cannot ron (should not happen, but handle gracefully)
                    self.state.phase = GamePhase::Draw;
                    return Ok(&self.state);
                }
                
                // CPU automatically rons
                match self.state.current_player {
                    Player::Cpu1 | Player::Cpu2 | Player::Cpu3 => {
                        // CPU rons: game ends
                        self.state.phase = GamePhase::End;
                    }
                    Player::Player => {
                        // Player can choose to ron or pass (handled by frontend)
                        // Do nothing here, wait for player_ron or player_pass command
                        // Return current state so frontend can show ron/pass buttons
                    }
                }
            }
            GamePhase::End => {
                return Err("Game has ended".into());
            }
        }

        Ok(&self.state)
    }

    /// Handle ron phase: check if any player can ron and set phase accordingly
    /// If no one can ron, advance to the next player after the one who discarded and set phase to Draw
    fn handle_ron_phase(&mut self) {
        // If any player can ron, set phase to Ron for the first player who can ron
        // Otherwise, set phase to Draw for the next player after the one who discarded
        let mut ron_player_found = false;
        for (index, can_ron) in self.state.can_ron.iter().enumerate() {
            if *can_ron {
                let ron_player = match index {
                    0 => Player::Player,
                    1 => Player::Cpu1,
                    2 => Player::Cpu2,
                    3 => Player::Cpu3,
                    _ => continue,
                };
                // Set current player to the one who can ron and phase to Ron
                self.state.current_player = ron_player;
                self.state.phase = GamePhase::Ron;
                ron_player_found = true;
                break;
            }
        }
        
        // If no one can ron, advance to the next player after the one who discarded
        if !ron_player_found {
            if let Some(discarder) = self.state.last_discarder {
                self.state.current_player = discarder.next();
            } else {
                // Fallback: advance current player (should not happen in normal game flow)
                self.state.current_player = self.state.current_player.next();
            }
            self.state.phase = GamePhase::Draw;
        }
    }

    /// Update win flags (can_tsumo and can_ron) for all players
    fn update_win_flags(&mut self) {
        // Reset flags
        self.state.can_tsumo = [false; 4];
        self.state.can_ron = [false; 4];

        // Check tsumo for each player (if in Discard phase after drawing, hand + drawn_tile = 14 tiles)
        if self.state.phase == GamePhase::Discard {
            for index in 0..4 {
                // Combine hand and drawn_tile for win check
                let mut full_hand = self.state.hands[index].clone();
                if let Some(drawn) = self.state.drawn_tile[index] {
                    full_hand.push(drawn);
                }
                
                if full_hand.len() == 14 && can_win(&full_hand) {
                    self.state.can_tsumo[index] = true;
                }
            }
        }

        // Check ron for each player (if last discarded tile can complete their hand)
        // Use last_discarder to find the last discarded tile
        if let Some(discarder) = self.state.last_discarder {
            let discarder_index = match discarder {
                Player::Player => 0,
                Player::Cpu1 => 1,
                Player::Cpu2 => 2,
                Player::Cpu3 => 3,
            };
            
            // Get the last discarded tile from the discarder's discards
            if let Some(discarded_tile) = self.state.discards[discarder_index].last() {
                // Check ron for all players except the one who discarded
                for (index, hand) in self.state.hands.iter().enumerate() {
                    if index == discarder_index {
                        continue; // Don't check ron for the player who just discarded
                    }
                    if can_win_by_ron(hand, *discarded_tile) {
                        self.state.can_ron[index] = true;
                    }
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

        // All players have 13 tiles in hand, player has 1 drawn tile
        assert_eq!(state.hands[0].len(), 13);
        assert_eq!(state.hands[1].len(), 13);
        assert_eq!(state.hands[2].len(), 13);
        assert_eq!(state.hands[3].len(), 13);
        assert!(state.drawn_tile[0].is_some());
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
    fn test_player_draw() {
        let mut engine = GameEngine::new();
        engine.new_game();
        
        // Player discards to set up for next turn
        let tile_id = engine.state.hands[0][0].id;
        engine.player_discard(tile_id).unwrap(); // Player discards, turn goes to Cpu1
        
        // Simulate CPU turns to get back to player
        engine.cpu_step().unwrap(); // Cpu1 draws
        engine.cpu_step().unwrap(); // Cpu1 discards, turn goes to Cpu2
        engine.cpu_step().unwrap(); // Cpu2 draws
        engine.cpu_step().unwrap(); // Cpu2 discards, turn goes to Cpu3
        engine.cpu_step().unwrap(); // Cpu3 draws
        engine.cpu_step().unwrap(); // Cpu3 discards, turn goes to Player
        
        // Now player should be in Draw phase
        assert_eq!(engine.state.current_player, Player::Player);
        assert_eq!(engine.state.phase, GamePhase::Draw);
        
        let before_wall = engine.state.wall_count;
        let before_hand_len = engine.state.hands[0].len();
        let res = engine.player_draw();
        assert!(res.is_ok());
        
        let state = res.unwrap();
        // Player should have drawn a tile (stored in drawn_tile, not in hand)
        assert_eq!(state.hands[0].len(), before_hand_len);
        assert!(state.drawn_tile[0].is_some());
        assert_eq!(state.wall_count, before_wall - 1);
        assert_eq!(state.phase, GamePhase::Discard);
        assert_eq!(state.current_player, Player::Player);
    }

    #[test]
    fn test_player_discard() {
        let mut engine = GameEngine::new();
        engine.new_game();

        // Test discarding the drawn tile
        let drawn_tile_id = engine.state.drawn_tile[0].map(|t| t.id);
        assert!(drawn_tile_id.is_some(), "Player should have a drawn tile after new_game");
        
        let before_hand_len = engine.state.hands[0].len();
        let res = engine.player_discard(drawn_tile_id.unwrap());
        assert!(res.is_ok());

        let state = res.unwrap();
        // Hand length should be unchanged when discarding drawn tile
        assert_eq!(state.hands[0].len(), before_hand_len);
        assert!(state.drawn_tile[0].is_none());
        assert!(state.discards[0].iter().any(|t| t.id == drawn_tile_id.unwrap()));
        assert_eq!(state.current_player, Player::Cpu1);
        assert_eq!(state.phase, GamePhase::Draw);
    }

    #[test]
    fn test_player_discard_from_hand() {
        let mut engine = GameEngine::new();
        engine.new_game();

        // Test discarding from hand (not the drawn tile)
        let drawn_tile_id = engine.state.drawn_tile[0].map(|t| t.id).unwrap();
        let hand_tile_id = engine.state.hands[0][0].id;
        
        // Make sure we're not discarding the drawn tile
        assert_ne!(hand_tile_id, drawn_tile_id, "Hand tile should be different from drawn tile");
        
        let before_hand_len = engine.state.hands[0].len();
        let res = engine.player_discard(hand_tile_id);
        assert!(res.is_ok());

        let state = res.unwrap();
        // When discarding from hand, drawn_tile should be added to hand first, then discarded tile removed
        // So hand length should be: before_hand_len + 1 (drawn_tile added) - 1 (discarded) = before_hand_len
        assert_eq!(state.hands[0].len(), before_hand_len);
        assert!(state.drawn_tile[0].is_none()); // drawn_tile should be cleared
        assert!(state.discards[0].iter().any(|t| t.id == hand_tile_id));
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
        // Cpu1 should have drawn a tile (stored in drawn_tile, not in hand)
        assert_eq!(state.hands[1].len(), before_hand_len);
        assert!(state.drawn_tile[1].is_some());
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
        // Cpu1 should have discarded the drawn tile (hand length unchanged, drawn_tile cleared)
        assert_eq!(state.hands[1].len(), before_hand_len);
        assert!(state.drawn_tile[1].is_none());
        assert_eq!(state.discards[1].len(), before_discard_len + 1);
        // Turn should advance to Cpu2
        assert_eq!(state.current_player, Player::Cpu2);
        assert_eq!(state.phase, GamePhase::Draw);
    }
}


