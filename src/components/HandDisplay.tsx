import { useMemo } from "preact/hooks";
import { Tile } from "../types";
import { TileDisplay } from "./TileDisplay";

interface HandDisplayProps {
  tiles: Tile[];
  drawnTile?: Tile | null;
  title?: string;
  onTileClick?: (tile: Tile) => void;
  clickable?: boolean;
  hidden?: boolean; // If true, show tiles face down (for CPU)
}

export function HandDisplay({ tiles, drawnTile, title, onTileClick, clickable = false, hidden = false }: HandDisplayProps) {
  // Generate unique keys using timestamp + index to ensure stable rendering
  // Use useMemo to generate keys only when tiles array changes
  const tileKeys = useMemo(() => {
    const timestamp = Date.now();
    return tiles.map((tile, index) => `${tile.id}-${timestamp}-${index}`);
  }, [tiles]);
  
  return (
    <div className="mb-4">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <div className="hand-display-container">
        {tiles.map((tile, index) => (
          <div
            key={tileKeys[index]}
            onClick={() => clickable && onTileClick?.(tile)}
            className={clickable ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}
          >
            <TileDisplay tile={tile} size="medium" hidden={hidden} />
          </div>
        ))}
        {/* Display drawn tile with spacing */}
        {drawnTile && (
          <div className="drawn-tile-wrapper">
            <div
              onClick={() => clickable && onTileClick?.(drawnTile)}
              className={clickable ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}
            >
              <TileDisplay tile={drawnTile} size="medium" hidden={hidden} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

