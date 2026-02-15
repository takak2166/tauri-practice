import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { createMockGameState } from "../test/tauri-mock";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("App", () => {
  beforeEach(() => {
    (globalThis.window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    mockInvoke.mockReset();
  });

  afterEach(() => {
    delete (globalThis.window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("shows Start New Game button on initial screen when no game state", async () => {
    expect.assertions(1);
    mockInvoke.mockResolvedValue(null);
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByRole("button", { name: /Start New Game/i })).toBeInTheDocument();
    });
  });

  it("calls new_game and shows game screen when Start New Game is clicked", async () => {
    expect.assertions(3);
    mockInvoke.mockImplementation(async (cmd) => {
      if (cmd === "get_state") return null;
      if (cmd === "new_game") return createMockGameState({ phase: "Discard" });
      return null;
    });
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByRole("button", { name: /Start New Game/i })).toBeInTheDocument();
    });
    await userEvent.click(within(container).getByRole("button", { name: /Start New Game/i }));
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("new_game", undefined);
    });
    await waitFor(() => {
      expect(within(container).getByText(/Current Player/i)).toBeInTheDocument();
    });
  });

  it("calls get_state on initial load", async () => {
    expect.assertions(1);
    mockInvoke.mockResolvedValue(null);
    render(<App />);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_state", undefined);
    });
  });

  it("restores game when get_state returns existing state", async () => {
    expect.assertions(2);
    const state = createMockGameState({ current_player: "Player", phase: "Discard" });
    mockInvoke.mockResolvedValue(state);
    const { container } = render(<App />);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_state", undefined);
    });
    await waitFor(() => {
      expect(within(container).getByText(/Current Player/i)).toBeInTheDocument();
    });
  });

  it("does not call player_discard when hand is clicked in Draw phase", async () => {
    expect.assertions(3);
    const state = createMockGameState({
      current_player: "Player",
      phase: "Draw",
      hands: [[{ id: 0 }, { id: 1 }], [], [], []],
    });
    mockInvoke.mockResolvedValue(state);
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByText(/Current Player/i)).toBeInTheDocument();
    });
    const tiles = container.querySelectorAll(".player-bottom .tile-3d-container");
    expect(tiles.length).toBeGreaterThan(0);
    await userEvent.click(tiles[0] as HTMLElement);
    const discardCalls = mockInvoke.mock.calls.filter((c) => c[0] === "player_discard");
    expect(discardCalls.length).toBe(0);
  });

  it("calls player_discard when hand tile is clicked in Discard phase", async () => {
    expect.assertions(3);
    const state = createMockGameState({
      current_player: "Player",
      phase: "Discard",
      hands: [[{ id: 0 }, { id: 1 }, { id: 2 }], [], [], []],
    });
    mockInvoke.mockImplementation(async (cmd) => {
      if (cmd === "get_state") return state;
      if (cmd === "player_discard") return createMockGameState({ ...state, discards: [[{ id: 0 }], [], [], []] });
      return null;
    });
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByText(/Current Player/i)).toBeInTheDocument();
    });
    const tiles = container.querySelectorAll(".tile-3d-container");
    expect(tiles.length).toBeGreaterThan(0);
    await userEvent.click(tiles[0] as HTMLElement);
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("player_discard", expect.objectContaining({ tileId: expect.any(Number) }));
    });
  });

  it("shows Ron and Pass buttons in Ron phase when can_ron", async () => {
    expect.assertions(2);
    const state = createMockGameState({
      current_player: "Player",
      phase: "Ron",
      can_ron: [true, false, false, false],
    });
    mockInvoke.mockResolvedValue(state);
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByRole("button", { name: /Ron/i })).toBeInTheDocument();
    });
    expect(within(container).getByRole("button", { name: /Pass/i })).toBeInTheDocument();
  });

  it("calls player_ron when Ron is clicked", async () => {
    expect.assertions(2);
    const state = createMockGameState({
      current_player: "Player",
      phase: "Ron",
      can_ron: [true, false, false, false],
    });
    mockInvoke.mockImplementation(async (cmd) => {
      if (cmd === "get_state") return state;
      if (cmd === "player_ron") return createMockGameState({ ...state, phase: "End" });
      return null;
    });
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByRole("button", { name: /Ron/i })).toBeInTheDocument();
    });
    await userEvent.click(within(container).getByRole("button", { name: /Ron/i }));
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("player_ron", undefined);
    });
  });

  it("calls player_pass when Pass is clicked", async () => {
    expect.assertions(2);
    const state = createMockGameState({
      current_player: "Player",
      phase: "Ron",
      can_ron: [false, false, false, false],
    });
    mockInvoke.mockImplementation(async (cmd) => {
      if (cmd === "get_state") return state;
      if (cmd === "player_pass") return createMockGameState({ ...state, phase: "Draw" });
      return null;
    });
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByRole("button", { name: /Pass/i })).toBeInTheDocument();
    });
    await userEvent.click(within(container).getByRole("button", { name: /Pass/i }));
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("player_pass", undefined);
    });
  });

  it("does not show Ron button when can_ron[0] is false in Ron phase", async () => {
    expect.assertions(2);
    const state = createMockGameState({
      current_player: "Player",
      phase: "Ron",
      can_ron: [false, false, false, false],
    });
    mockInvoke.mockResolvedValue(state);
    const { container } = render(<App />);
    await waitFor(() => {
      expect(within(container).getByRole("button", { name: /Pass/i })).toBeInTheDocument();
    });
    expect(within(container).queryByRole("button", { name: /Ron/i })).not.toBeInTheDocument();
  });
});
