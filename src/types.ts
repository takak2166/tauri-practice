// Type definitions matching Rust backend

export type Player = "Player" | "Cpu1" | "Cpu2" | "Cpu3";
export type GamePhase = "Draw" | "Discard" | "End";

export interface Tile {
  id: number; // 0-33
}

export interface GameState {
  hands: Tile[][]; // [Player, Cpu1, Cpu2, Cpu3]
  discards: Tile[][]; // [Player, Cpu1, Cpu2, Cpu3]
  wall_count: number;
  current_player: Player;
  phase: GamePhase;
  can_tsumo: boolean;
  can_ron: boolean;
}

