import { describe, it, expect } from "vitest";
import { render } from "@testing-library/preact";
import { getTileContent } from "../../lib/tileContent";
import { TileDisplay } from "../TileDisplay";

describe("getTileContent", () => {
  it("returns manzu for id 0-8 with number 1-9", () => {
    expect(getTileContent(0)).toEqual({ type: "manzu", number: 1 });
    expect(getTileContent(4)).toEqual({ type: "manzu", number: 5 });
    expect(getTileContent(8)).toEqual({ type: "manzu", number: 9 });
  });

  it("returns pinzu for id 9-17 with number 1-9", () => {
    expect(getTileContent(9)).toEqual({ type: "pinzu", number: 1 });
    expect(getTileContent(13)).toEqual({ type: "pinzu", number: 5 });
    expect(getTileContent(17)).toEqual({ type: "pinzu", number: 9 });
  });

  it("returns souzu for id 18-26 with number 1-9", () => {
    expect(getTileContent(18)).toEqual({ type: "souzu", number: 1 });
    expect(getTileContent(22)).toEqual({ type: "souzu", number: 5 });
    expect(getTileContent(26)).toEqual({ type: "souzu", number: 9 });
  });

  it("returns honor for id 27-33 with correct character", () => {
    expect(getTileContent(27)).toEqual({ type: "honor", honor: "\u6771" });
    expect(getTileContent(28)).toEqual({ type: "honor", honor: "\u5357" });
    expect(getTileContent(29)).toEqual({ type: "honor", honor: "\u897F" });
    expect(getTileContent(30)).toEqual({ type: "honor", honor: "\u5317" });
    expect(getTileContent(31)).toEqual({ type: "honor", honor: "\u767D" });
    expect(getTileContent(32)).toEqual({ type: "honor", honor: "\u767C" });
    expect(getTileContent(33)).toEqual({ type: "honor", honor: "\u4E2D" });
  });

  it("returns honor with ? for out-of-range id", () => {
    expect(getTileContent(34)).toEqual({ type: "honor", honor: "?" });
    expect(getTileContent(-1)).toEqual({ type: "honor", honor: "?" });
  });
});

describe("TileDisplay", () => {
  it("renders tile with correct title for visible tile", () => {
    render(<TileDisplay tile={{ id: 0 }} />);
    expect(document.querySelector('[title="Tile ID: 0"]')).toBeInTheDocument();
  });

  it("renders hidden tile with hidden title", () => {
    render(<TileDisplay tile={{ id: 5 }} hidden />);
    expect(document.querySelector('[title="Hidden tile"]')).toBeInTheDocument();
  });

  it("applies tile-3d-container class", () => {
    const { container } = render(<TileDisplay tile={{ id: 0 }} />);
    const wrapper = container.querySelector(".tile-3d-container");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders manzu tile with tile-manzu class", () => {
    const { container } = render(<TileDisplay tile={{ id: 0 }} />);
    expect(container.querySelector(".tile-manzu")).toBeInTheDocument();
  });

  it("renders pinzu tile with tile-pinzu class", () => {
    const { container } = render(<TileDisplay tile={{ id: 9 }} />);
    expect(container.querySelector(".tile-pinzu")).toBeInTheDocument();
  });

  it("renders souzu tile with tile-souzu class", () => {
    const { container } = render(<TileDisplay tile={{ id: 18 }} />);
    expect(container.querySelector(".tile-souzu")).toBeInTheDocument();
  });

  it("renders honor tile with tile-honor class", () => {
    const { container } = render(<TileDisplay tile={{ id: 27 }} />);
    expect(container.querySelector(".tile-honor")).toBeInTheDocument();
  });
});
