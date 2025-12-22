import { Tile } from "../types";
import { TileDisplay } from "./TileDisplay";

interface DiscardDisplayProps {
  tiles: Tile[];
  title?: string;
}

export function DiscardDisplay({ tiles, title }: DiscardDisplayProps) {
  return (
    <div className="mb-4">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <div className="flex flex-wrap gap-1">
        {tiles.map((tile, index) => (
          <TileDisplay key={`${tile.id}-${index}`} tile={tile} size="small" />
        ))}
      </div>
    </div>
  );
}

