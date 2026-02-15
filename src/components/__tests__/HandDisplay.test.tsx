import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { HandDisplay } from "../HandDisplay";

describe("HandDisplay", () => {
  it("calls onTileClick when a tile is clicked and clickable is true", async () => {
    expect.assertions(2);
    const tiles = [{ id: 0 }, { id: 1 }];
    const onTileClick = vi.fn();
    const { container } = render(
      <HandDisplay tiles={tiles} clickable onTileClick={onTileClick} />
    );
    const firstTile = container.querySelector(".tile-3d-container");
    expect(firstTile).toBeInTheDocument();
    await userEvent.click(firstTile as HTMLElement);
    expect(onTileClick).toHaveBeenCalledWith(expect.objectContaining({ id: 0 }));
  });

  it("does not call onTileClick when clickable is false", async () => {
    expect.assertions(1);
    const tiles = [{ id: 0 }];
    const onTileClick = vi.fn();
    const { container } = render(
      <HandDisplay tiles={tiles} clickable={false} onTileClick={onTileClick} />
    );
    await userEvent.click(container.querySelector(".tile-3d-container") as HTMLElement);
    expect(onTileClick).not.toHaveBeenCalled();
  });

  it("shows drawnTile separately from hand tiles", () => {
    const tiles = [{ id: 0 }, { id: 1 }];
    const drawnTile = { id: 5 };
    const { container } = render(
      <HandDisplay tiles={tiles} drawnTile={drawnTile} />
    );
    const wrappers = container.querySelectorAll(".hand-display-container .tile-3d-container");
    expect(wrappers.length).toBe(3);
    expect(container.querySelector(".drawn-tile-wrapper")).toBeInTheDocument();
  });

  it("renders all tiles as hidden when hidden is true", () => {
    const tiles = [{ id: 0 }];
    const { container } = render(<HandDisplay tiles={tiles} hidden />);
    expect(container.querySelector('[title="Hidden tile"]')).toBeInTheDocument();
  });

  it("shows title when provided", () => {
    render(<HandDisplay tiles={[{ id: 0 }]} title="Your Hand" />);
    expect(screen.getByText("Your Hand")).toBeInTheDocument();
  });
});
