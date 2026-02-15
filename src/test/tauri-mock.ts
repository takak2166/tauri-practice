import type { GameState, Tile } from "../types";

/**
 * Creates a mock GameState for tests. Override any field via overrides.
 */
export function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const defaultHand = (count: number): Tile[] =>
    Array.from({ length: count }, (_, i) => ({ id: i % 34 }));

  return {
    hands: [defaultHand(13), defaultHand(13), defaultHand(13), defaultHand(13)],
    discards: [[], [], [], []],
    wall_count: 70,
    current_player: "Player",
    phase: "Draw",
    can_tsumo: [false, false, false, false],
    can_ron: [false, false, false, false],
    drawn_tile: [null, null, null, null],
    last_discarder: null,
    ...overrides,
  };
}

/**
 * Helper to mock @tauri-apps/api/core invoke per test.
 * In tests: vi.mock("@tauri-apps/api/core") and then use this to set return values.
 */
export type InvokeHandler = (
  command: string,
  args?: Record<string, unknown>
) => Promise<unknown>;

export function createInvokeMock(handler: InvokeHandler) {
  return async (command: string, args?: Record<string, unknown>) =>
    handler(command, args);
}
