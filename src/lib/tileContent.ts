/**
 * Pure function: tile id (0-33) to content descriptor.
 * Exported for unit testing.
 */
export type TileContent =
  | { type: "manzu"; number: number }
  | { type: "pinzu"; number: number }
  | { type: "souzu"; number: number }
  | { type: "honor"; honor: string };

export function getTileContent(id: number): TileContent {
  if (id >= 0 && id <= 8) {
    // Manzu: 1-9萬
    return { type: "manzu", number: id + 1 };
  }
  if (id >= 9 && id <= 17) {
    // Pinzu: 1-9筒
    return { type: "pinzu", number: id - 8 };
  }
  if (id >= 18 && id <= 26) {
    // Souzu: 1-9索
    return { type: "souzu", number: id - 17 };
  }
  // Honors: 27=East, 28=South, 29=West, 30=North, 31=White, 32=Green, 33=Red
  const honors = ["東", "南", "西", "北", "白", "發", "中"];
  return { type: "honor", honor: honors[id - 27] ?? "?" };
}
