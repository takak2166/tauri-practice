import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/preact";
import { App } from "../App";
import { GameEndModal } from "../components/GameEndModal";
import { createMockGameState } from "../test/tauri-mock";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("App VRT", () => {
  beforeEach(() => {
    (globalThis.window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    mockInvoke.mockReset();
  });

  afterEach(() => {
    delete (globalThis.window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("game table layout structure when game is active", async () => {
    const state = createMockGameState({ phase: "Discard", current_player: "Player" });
    mockInvoke.mockResolvedValue(state);
    const { container } = render(<App />);
    await waitFor(() => {
      const table = container.querySelector(".mahjong-table");
      expect(table).toBeInTheDocument();
    });
    expect(container.querySelector(".mahjong-table")).toMatchSnapshot();
  });

  it("game end modal structure", () => {
    const state = createMockGameState({ wall_count: 0, phase: "End" });
    const { container } = render(
      <GameEndModal gameState={state} onClose={() => {}} onNewGame={() => {}} />
    );
    expect(container.querySelector(".fixed.inset-0")).toMatchSnapshot();
  });
});
