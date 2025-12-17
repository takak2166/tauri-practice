use serde::{Deserialize, Serialize};

/// Tile ID (0-33)
/// - 0-8: Manzu (1-9)
/// - 9-17: Pinzu (1-9)
/// - 18-26: Souzu (1-9)
/// - 27-33: Honors (East, South, West, North, White, Green, Red)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct Tile {
    pub id: u8,
}

impl Tile {
    /// Create a tile; returns error if id is out of range
    pub fn new(id: u8) -> Result<Self, String> {
        if id > 33 {
            return Err(format!("Invalid tile ID: {}", id));
        }
        Ok(Tile { id })
    }

    /// Get tile suit
    pub fn suit(&self) -> TileSuit {
        match self.id {
            0..=8 => TileSuit::Manzu,
            9..=17 => TileSuit::Pinzu,
            18..=26 => TileSuit::Souzu,
            27..=33 => TileSuit::Jihai,
            _ => unreachable!(),
        }
    }

    /// Get number (1-9) for suited tiles; None for honors
    pub fn number(&self) -> Option<u8> {
        match self.id {
            0..=8 => Some(self.id + 1),
            9..=17 => Some(self.id - 8),
            18..=26 => Some(self.id - 17),
            _ => None,
        }
    }

    /// Get honor type if this is an honor tile
    pub fn honor(&self) -> Option<HonorTile> {
        match self.id {
            27 => Some(HonorTile::Ton),   // East
            28 => Some(HonorTile::Nan),   // South
            29 => Some(HonorTile::Sha),   // West
            30 => Some(HonorTile::Pei),   // North
            31 => Some(HonorTile::Haku),  // White
            32 => Some(HonorTile::Hatsu), // Green
            33 => Some(HonorTile::Chun),  // Red
            _ => None,
        }
    }

    /// Sort key (Manzu -> Pinzu -> Souzu -> Honors)
    pub fn sort_order(&self) -> u8 {
        self.id
    }
}

/// Tile suit
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TileSuit {
    Manzu,
    Pinzu,
    Souzu,
    Jihai,
}

/// Honor tile kind
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HonorTile {
    Ton,   // East
    Nan,   // South
    Sha,   // West
    Pei,   // North
    Haku,  // White
    Hatsu, // Green
    Chun,  // Red
}

/// Create full wall (136 tiles, 4 copies each)
pub fn create_wall() -> Vec<Tile> {
    let mut wall = Vec::with_capacity(136);
    
    // Add 4 copies of each tile id (0-33)
    for id in 0..=33 {
        for _ in 0..4 {
            wall.push(Tile { id });
        }
    }
    
    wall
}

/// Shuffle wall in place
pub fn shuffle_wall(wall: &mut Vec<Tile>) {
    use rand::seq::SliceRandom;
    use rand::thread_rng;
    
    let mut rng = thread_rng();
    wall.shuffle(&mut rng);
}

/// Sort a hand (Manzu -> Pinzu -> Souzu -> Honors)
pub fn sort_hand(hand: &mut Vec<Tile>) {
    hand.sort_by_key(|tile| tile.sort_order());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tile_creation() {
        let tile = Tile::new(0).unwrap();
        assert_eq!(tile.id, 0);
        
        let tile = Tile::new(33).unwrap();
        assert_eq!(tile.id, 33);
        
        assert!(Tile::new(34).is_err());
    }

    #[test]
    fn test_tile_suit() {
        assert_eq!(Tile::new(0).unwrap().suit(), TileSuit::Manzu);
        assert_eq!(Tile::new(9).unwrap().suit(), TileSuit::Pinzu);
        assert_eq!(Tile::new(18).unwrap().suit(), TileSuit::Souzu);
        assert_eq!(Tile::new(27).unwrap().suit(), TileSuit::Jihai);
    }

    #[test]
    fn test_tile_number() {
        assert_eq!(Tile::new(0).unwrap().number(), Some(1));
        assert_eq!(Tile::new(8).unwrap().number(), Some(9));
        assert_eq!(Tile::new(9).unwrap().number(), Some(1));
        assert_eq!(Tile::new(17).unwrap().number(), Some(9));
        assert_eq!(Tile::new(27).unwrap().number(), None);
    }

    #[test]
    fn test_honor_tile() {
        assert_eq!(Tile::new(27).unwrap().honor(), Some(HonorTile::Ton));
        assert_eq!(Tile::new(33).unwrap().honor(), Some(HonorTile::Chun));
        assert_eq!(Tile::new(0).unwrap().honor(), None);
    }

    #[test]
    fn test_create_wall() {
        let wall = create_wall();
        assert_eq!(wall.len(), 136);
        
        // Ensure each tile id appears exactly 4 times
        let mut counts = [0u8; 34];
        for tile in &wall {
            counts[tile.id as usize] += 1;
        }
        for count in counts.iter() {
            assert_eq!(*count, 4);
        }
    }

    #[test]
    fn test_sort_hand() {
        let mut hand = vec![
            Tile::new(27).unwrap(), // East
            Tile::new(0).unwrap(),  // 1 Man
            Tile::new(18).unwrap(), // 1 Sou
            Tile::new(9).unwrap(),  // 1 Pin
        ];
        
        sort_hand(&mut hand);
        
        assert_eq!(hand[0].id, 0);   // 1 Man
        assert_eq!(hand[1].id, 9);   // 1 Pin
        assert_eq!(hand[2].id, 18);  // 1 Sou
        assert_eq!(hand[3].id, 27);  // East
    }
}

