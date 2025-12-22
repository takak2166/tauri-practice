import { Tile } from "../types";

interface TileDisplayProps {
  tile: Tile;
  size?: "small" | "medium" | "large";
}

export function TileDisplay({ tile, size = "medium" }: TileDisplayProps) {
  const sizeClass = {
    small: "w-8 h-12 text-xs",
    medium: "w-12 h-16 text-sm",
    large: "w-16 h-20 text-base",
  }[size];

  const getTileDisplay = (id: number): string => {
    if (id >= 0 && id <= 8) {
      // Manzu
      return `${id + 1}m`;
    } else if (id >= 9 && id <= 17) {
      // Pinzu
      return `${id - 8}p`;
    } else if (id >= 18 && id <= 26) {
      // Souzu
      return `${id - 17}s`;
    } else {
      // Honors: 27=東, 28=南, 29=西, 30=北, 31=白, 32=發, 33=中
      const honors = ["東", "南", "西", "北", "白", "發", "中"];
      return honors[id - 27] || "?";
    }
  };

  return (
    <div
      className={`${sizeClass} border border-gray-400 rounded bg-white flex items-center justify-center font-mono shadow-sm`}
      title={`Tile ID: ${tile.id}`}
    >
      {getTileDisplay(tile.id)}
    </div>
  );
}

