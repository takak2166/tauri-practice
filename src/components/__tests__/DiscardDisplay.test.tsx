import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import { DiscardDisplay } from "../DiscardDisplay";

describe("DiscardDisplay", () => {
  it("renders all given tiles", () => {
    const tiles = [{ id: 0 }, { id: 1 }, { id: 2 }];
    const { container } = render(<DiscardDisplay tiles={tiles} />);
    const tileContainers = container.querySelectorAll(".discard-display-container .tile-3d-container");
    expect(tileContainers.length).toBe(3);
  });

  it("shows title when provided", () => {
    render(<DiscardDisplay tiles={[]} title="Your Discards" />);
    expect(screen.getByText("Your Discards")).toBeInTheDocument();
  });

  it("renders nothing in container when tiles is empty", () => {
    const { container } = render(<DiscardDisplay tiles={[]} />);
    const tileContainers = container.querySelectorAll(".discard-display-container .tile-3d-container");
    expect(tileContainers.length).toBe(0);
  });
});
