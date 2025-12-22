import { Tile } from "../types";
import { TileDisplay } from "./TileDisplay";

interface HandDisplayProps {
  tiles: Tile[];
  title?: string;
}

export function HandDisplay({ tiles, title }: HandDisplayProps) {
  return (
    <div className="mb-4">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <div className="flex flex-wrap gap-1">
        {tiles.map((tile, index) => (
          <TileDisplay key={`${tile.id}-${index}`} tile={tile} size="medium" />
        ))}
      </div>
    </div>
  );
}

