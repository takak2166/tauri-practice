import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { GameEndModal } from "../GameEndModal";
import { createMockGameState } from "../../test/tauri-mock";

describe("GameEndModal", () => {
  it("shows Wall Exhausted when wall_count is 0", () => {
    const state = createMockGameState({ wall_count: 0, phase: "End" });
    render(<GameEndModal gameState={state} onClose={() => {}} onNewGame={() => {}} />);
    expect(screen.getByText(/Wall Exhausted/)).toBeInTheDocument();
  });

  it("shows Game Ended when wall_count is not 0", () => {
    const state = createMockGameState({ wall_count: 10, phase: "End" });
    render(<GameEndModal gameState={state} onClose={() => {}} onNewGame={() => {}} />);
    expect(screen.getByRole("heading", { name: "Game Ended" })).toBeInTheDocument();
  });

  it("calls onNewGame when New Game button is clicked", async () => {
    expect.assertions(1);
    const state = createMockGameState({ wall_count: 0 });
    const onNewGame = vi.fn();
    render(<GameEndModal gameState={state} onClose={() => {}} onNewGame={onNewGame} />);
    await userEvent.click(screen.getByRole("button", { name: /New Game/i }));
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close button is clicked", async () => {
    expect.assertions(1);
    const state = createMockGameState({ wall_count: 0 });
    const onClose = vi.fn();
    render(<GameEndModal gameState={state} onClose={onClose} onNewGame={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /Close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
