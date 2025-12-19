use crate::models::tile::Tile;

/// Check if a hand can win (4 melds + 1 pair)
/// Hand must have exactly 14 tiles
pub fn can_win(hand: &[Tile]) -> bool {
    if hand.len() != 14 {
        return false;
    }

    // Count tiles by ID (array acts as a map: tile_id -> count)
    let mut counts = [0u8; 34];
    for tile in hand {
        counts[tile.id as usize] += 1;
    }

    // Try each possible pair (head)
    for pair_id in 0..34 {
        if counts[pair_id] >= 2 {
            let mut temp_counts = counts;
            temp_counts[pair_id] -= 2;

            // Check if remaining 12 tiles can form 4 melds
            if can_form_melds(&temp_counts, 4) {
                return true;
            }
        }
    }

    false
}

/// Check if tiles can form the specified number of melds
fn can_form_melds(counts: &[u8; 34], meld_count: usize) -> bool {
    if meld_count == 0 {
        // All tiles used
        return counts.iter().all(|&c| c == 0);
    }

    // Try to form a triplet (same tile 3 times)
    for id in 0..34 {
        if counts[id] >= 3 {
            let mut temp_counts = *counts;
            temp_counts[id] -= 3;
            if can_form_melds(&temp_counts, meld_count - 1) {
                return true;
            }
        }
    }

    // Try to form a sequence (consecutive tiles)
    for suit_start in [0, 9, 18] {
        // Manzu: 0-8, Pinzu: 9-17, Souzu: 18-26
        for start in suit_start..=(suit_start + 6) {
            // Check if we can form a sequence starting here
            if counts[start] > 0 && counts[start + 1] > 0 && counts[start + 2] > 0 {
                let mut temp_counts = *counts;
                temp_counts[start] -= 1;
                temp_counts[start + 1] -= 1;
                temp_counts[start + 2] -= 1;
                if can_form_melds(&temp_counts, meld_count - 1) {
                    return true;
                }
            }
        }
    }

    false
}

/// Check if player can win by claiming a specific discarded tile (ron)
/// Hand must have exactly 13 tiles, and the specific discarded tile makes it 14 tiles that can win
/// This checks if the player can ron the specific tile discarded by another player
pub fn can_win_by_ron(hand: &[Tile], discarded_tile: Tile) -> bool {
    if hand.len() != 13 {
        return false;
    }

    let mut test_hand = hand.to_vec();
    test_hand.push(discarded_tile);
    can_win(&test_hand)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_can_win_with_four_melds_and_pair() {
        // Example: 4 sequences + 1 pair
        let hand = vec![
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(1).unwrap(), // 2 Man
            Tile::new(2).unwrap(), // 3 Man
            Tile::new(3).unwrap(), // 4 Man
            Tile::new(4).unwrap(), // 5 Man
            Tile::new(5).unwrap(), // 6 Man
            Tile::new(9).unwrap(), // 1 Pin
            Tile::new(10).unwrap(), // 2 Pin
            Tile::new(11).unwrap(), // 3 Pin
            Tile::new(18).unwrap(), // 1 Sou
            Tile::new(19).unwrap(), // 2 Sou
            Tile::new(20).unwrap(), // 3 Sou
            Tile::new(27).unwrap(), // East
            Tile::new(27).unwrap(), // East
        ];
        assert!(can_win(&hand));
    }

    #[test]
    fn test_can_win_with_triplets() {
        // Example: 4 triplets + 1 pair
        let hand = vec![
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(9).unwrap(), // 1 Pin
            Tile::new(9).unwrap(), // 1 Pin
            Tile::new(9).unwrap(), // 1 Pin
            Tile::new(18).unwrap(), // 1 Sou
            Tile::new(18).unwrap(), // 1 Sou
            Tile::new(18).unwrap(), // 1 Sou
            Tile::new(27).unwrap(), // East
            Tile::new(27).unwrap(), // East
            Tile::new(27).unwrap(), // East
            Tile::new(28).unwrap(), // South
            Tile::new(28).unwrap(), // South
        ];
        assert!(can_win(&hand));
    }

    #[test]
    fn test_cannot_win() {
        // 14 tiles but cannot form 4 melds + 1 pair
        let hand = vec![
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(1).unwrap(), // 2 Man
            Tile::new(1).unwrap(), // 2 Man
            Tile::new(2).unwrap(), // 3 Man
            Tile::new(2).unwrap(), // 3 Man
            Tile::new(3).unwrap(), // 4 Man
            Tile::new(3).unwrap(), // 4 Man
            Tile::new(4).unwrap(), // 5 Man
            Tile::new(4).unwrap(), // 5 Man
            Tile::new(5).unwrap(), // 6 Man
            Tile::new(5).unwrap(), // 6 Man
            Tile::new(6).unwrap(), // 7 Man
            Tile::new(7).unwrap(), // 8 Man (cannot form meld)
        ];
        assert!(!can_win(&hand));
    }

    #[test]
    fn test_can_win_by_ron() {
        // 13 tiles that can win with discarded tile
        let hand = vec![
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(1).unwrap(), // 2 Man
            Tile::new(2).unwrap(), // 3 Man
            Tile::new(3).unwrap(), // 4 Man
            Tile::new(4).unwrap(), // 5 Man
            Tile::new(5).unwrap(), // 6 Man
            Tile::new(9).unwrap(), // 1 Pin
            Tile::new(10).unwrap(), // 2 Pin
            Tile::new(11).unwrap(), // 3 Pin
            Tile::new(18).unwrap(), // 1 Sou
            Tile::new(19).unwrap(), // 2 Sou
            Tile::new(20).unwrap(), // 3 Sou
            Tile::new(27).unwrap(), // East
        ];
        let discarded = Tile::new(27).unwrap(); // East
        assert!(can_win_by_ron(&hand, discarded));
    }

    #[test]
    fn test_can_win_with_multiple_pair_options() {
        // Can form pairs with 1m, 2m, 3m, 4m, 5m, 6m, or 7m
        let hand = vec![
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(1).unwrap(), // 2 Man
            Tile::new(1).unwrap(), // 2 Man
            Tile::new(2).unwrap(), // 3 Man
            Tile::new(2).unwrap(), // 3 Man
            Tile::new(3).unwrap(), // 4 Man
            Tile::new(3).unwrap(), // 4 Man
            Tile::new(4).unwrap(), // 5 Man
            Tile::new(4).unwrap(), // 5 Man
            Tile::new(5).unwrap(), // 6 Man
            Tile::new(5).unwrap(), // 6 Man
            Tile::new(6).unwrap(), // 7 Man
            Tile::new(6).unwrap(), // 7 Man
        ];
        assert!(can_win(&hand));
    }

    #[test]
    fn test_can_win_with_mixed_sequences_and_triplets() {
        // Example: 2 sequences + 2 triplets + 1 pair
        let hand = vec![
            Tile::new(0).unwrap(), // 1 Man
            Tile::new(1).unwrap(), // 2 Man
            Tile::new(2).unwrap(), // 3 Man (sequence)
            Tile::new(9).unwrap(), // 1 Pin
            Tile::new(9).unwrap(), // 1 Pin
            Tile::new(9).unwrap(), // 1 Pin (triplet)
            Tile::new(18).unwrap(), // 1 Sou
            Tile::new(19).unwrap(), // 2 Sou
            Tile::new(20).unwrap(), // 3 Sou (sequence)
            Tile::new(27).unwrap(), // East
            Tile::new(27).unwrap(), // East
            Tile::new(27).unwrap(), // East (triplet)
            Tile::new(28).unwrap(), // South
            Tile::new(28).unwrap(), // South (pair)
        ];
        assert!(can_win(&hand));
    }
}

