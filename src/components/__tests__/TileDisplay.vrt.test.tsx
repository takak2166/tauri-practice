import { describe, it, expect } from "vitest";
import { render } from "@testing-library/preact";
import { TileDisplay } from "../TileDisplay";

describe("TileDisplay VRT", () => {
  it("manzu tile structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 0 }} />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("pinzu one tile structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 9 }} />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("souzu one tile structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 18 }} />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("honor tile East (東) structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 27 }} />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("honor tile White (白) structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 31 }} />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("honor tile Green (發) structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 32 }} />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("honor tile Red (中) structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 33 }} />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("hidden tile structure", () => {
    const { container } = render(<TileDisplay tile={{ id: 0 }} hidden />);
    expect(container.querySelector(".tile-3d-container")).toMatchSnapshot();
  });
  it("size variants have correct data attribute", () => {
    const { container: cSmall } = render(<TileDisplay tile={{ id: 0 }} size="small" />);
    const { container: cLarge } = render(<TileDisplay tile={{ id: 0 }} size="large" />);
    expect(cSmall.querySelector(".tile-3d-container")?.getAttribute("data-size")).toBe("small");
    expect(cLarge.querySelector(".tile-3d-container")?.getAttribute("data-size")).toBe("large");
  });
});
