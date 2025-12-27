import { Tile } from "../types";
import { TileDisplay } from "./TileDisplay";

interface HandDisplayProps {
  tiles: Tile[];
  title?: string;
  onTileClick?: (tile: Tile) => void;
  clickable?: boolean;
}

export function HandDisplay({ tiles, title, onTileClick, clickable = false }: HandDisplayProps) {
  return (
    <div className="mb-4">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <div className="hand-display-container">
        {tiles.map((tile, index) => (
          <div
            key={`${tile.id}-${index}`}
            onClick={() => clickable && onTileClick?.(tile)}
            className={clickable ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}
          >
            <TileDisplay tile={tile} size="medium" />
          </div>
        ))}
      </div>
    </div>
  );
}

