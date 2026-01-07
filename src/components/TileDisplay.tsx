import { Tile } from "../types";

interface TileDisplayProps {
  tile: Tile;
  size?: "small" | "medium" | "large";
  hidden?: boolean; // If true, show tile back (face down)
}

export function TileDisplay({ tile, size = "medium", hidden = false }: TileDisplayProps) {
  // Minimize classes since size is managed by CSS variables
  const sizeClass = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  }[size];

  const depthClass = {
    small: "depth-8",
    medium: "depth-12",
    large: "depth-16",
  }[size];

  const getTileContent = (id: number): { type: "manzu" | "pinzu" | "souzu" | "honor"; number?: number; honor?: string } => {
    if (id >= 0 && id <= 8) {
      // Manzu: 1-9萬
      return { type: "manzu", number: id + 1 };
    } else if (id >= 9 && id <= 17) {
      // Pinzu: 1-9筒
      return { type: "pinzu", number: id - 8 };
    } else if (id >= 18 && id <= 26) {
      // Souzu: 1-9索
      return { type: "souzu", number: id - 17 };
    } else {
      // Honors: 27=East, 28=South, 29=West, 30=North, 31=White, 32=Green, 33=Red
      const honors = ["東", "南", "西", "北", "白", "發", "中"];
      return { type: "honor", honor: honors[id - 27] || "?" };
    }
  };

  const renderTileContent = () => {
    const content = getTileContent(tile.id);
    
    if (content.type === "manzu") {
      // Manzu: Kanji number (black) + 萬 (red)
      const kanjiNumbers = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
      return (
        <div className="tile-manzu">
          <div className="tile-number tile-number-black">{kanjiNumbers[(content.number || 1) - 1]}</div>
          <div className="tile-suit tile-suit-red">萬</div>
        </div>
      );
    } else if (content.type === "pinzu") {
      // Pinzu: Layout based on reference images
      const num = content.number || 1;
      
      if (num === 1) {
        // 1-Pin: One large circle (blue outer, red inner, complex pattern in center)
        return (
          <div className="tile-pinzu">
            <div className="tile-pinzu-special-one">
              <div className="pinzu-one-outer"></div>
              <div className="pinzu-one-inner"></div>
              <div className="pinzu-one-center"></div>
            </div>
          </div>
        );
      } else {
        // 2-9 Pin: Grid layout
        const getPinzuLayout = (n: number): { 
          columns: number; 
          circles?: Array<{ row: number; col: number; color: "blue" | "red" }>;
          special?: string;
          topHalf?: Array<{ row: number; col: number; color: "blue" | "red" }>;
          bottomHalf?: Array<{ row: number; col: number; color: "blue" | "red" }>;
        } => {
          if (n === 2) {
            // 2-Pin: Two blue circles arranged vertically
            return {
              columns: 1,
              circles: [
                { row: 1, col: 1, color: "blue" },
                { row: 2, col: 1, color: "blue" },
              ]
            };
          } else if (n === 3) {
            // 3-Pin: Three circles arranged diagonally from top-left to bottom-right. Top-left and bottom-right are blue, center is red
            return {
              columns: 3,
              circles: [
                { row: 1, col: 1, color: "blue" }, // Top-left
                { row: 2, col: 2, color: "red" },  // Center
                { row: 3, col: 3, color: "blue" }, // Bottom-right
              ]
            };
          } else if (n === 4) {
            // 4-Pin: Four blue circles arranged in 2x2 grid
            return {
              columns: 2,
              circles: [
                { row: 1, col: 1, color: "blue" },
                { row: 1, col: 2, color: "blue" },
                { row: 2, col: 1, color: "blue" },
                { row: 2, col: 2, color: "blue" },
              ]
            };
          } else if (n === 5) {
            // 5-Pin: Four blue circles in 2x2 grid with one large red circle in center
            return {
              columns: 3,
              circles: [
                { row: 1, col: 1, color: "blue" },
                { row: 1, col: 3, color: "blue" },
                { row: 2, col: 2, color: "red" }, // Center (large)
                { row: 3, col: 1, color: "blue" },
                { row: 3, col: 3, color: "blue" },
              ]
            };
          } else if (n === 6) {
            // 6-Pin: Six circles arranged in 2 columns × 3 rows. Top-left and top-right are blue. Center-left, center-right, bottom-left, and bottom-right are red
            return {
              columns: 2,
              circles: [
                { row: 1, col: 1, color: "blue" }, // Top-left
                { row: 1, col: 2, color: "blue" }, // Top-right
                { row: 2, col: 1, color: "red" },  // Center-left
                { row: 2, col: 2, color: "red" },  // Center-right
                { row: 3, col: 1, color: "red" },  // Bottom-left (red)
                { row: 3, col: 2, color: "red" },  // Bottom-right
              ]
            };
          } else if (n === 7) {
            // 7-Pin: Split grid into top and bottom halves
            // Top half (3x3): Blue circles arranged diagonally (row 1 col 1, row 2 col 2, row 3 col 3)
            // Bottom half (2x2): Red circles in 2x2 grid, centered
            return {
              columns: 3,
              special: "seven",
              topHalf: [
                { row: 1, col: 1, color: "blue" }, // Top-left (blue)
                { row: 2, col: 2, color: "blue" }, // Center (blue)
                { row: 3, col: 3, color: "blue" }, // Bottom-right (blue)
              ],
              bottomHalf: [
                { row: 1, col: 1, color: "red" },  // Top-left (red)
                { row: 1, col: 2, color: "red" },  // Top-right (red)
                { row: 2, col: 1, color: "red" },  // Bottom-left (red)
                { row: 2, col: 2, color: "red" },  // Bottom-right (red)
              ]
            };
          } else if (n === 8) {
            // 8-Pin: Eight blue circles arranged in 2 columns × 4 rows
            return {
              columns: 2,
              circles: [
                { row: 1, col: 1, color: "blue" },
                { row: 1, col: 2, color: "blue" },
                { row: 2, col: 1, color: "blue" },
                { row: 2, col: 2, color: "blue" },
                { row: 3, col: 1, color: "blue" },
                { row: 3, col: 2, color: "blue" },
                { row: 4, col: 1, color: "blue" },
                { row: 4, col: 2, color: "blue" },
              ]
            };
          } else if (n === 9) {
            // 9-Pin: Nine circles arranged in 3 columns × 3 rows. Left and right columns are blue, center column is red
            return {
              columns: 3,
              circles: [
                { row: 1, col: 1, color: "blue" }, // Left column top
                { row: 1, col: 2, color: "red" },  // Center column top
                { row: 1, col: 3, color: "blue" }, // Right column top
                { row: 2, col: 1, color: "blue" }, // Left column middle
                { row: 2, col: 2, color: "red" },  // Center column middle
                { row: 2, col: 3, color: "blue" }, // Right column middle
                { row: 3, col: 1, color: "blue" }, // Left column bottom
                { row: 3, col: 2, color: "red" },  // Center column bottom
                { row: 3, col: 3, color: "blue" }, // Right column bottom
              ]
            };
          }
          return { columns: 1, circles: [] };
        };
        
        const layout = getPinzuLayout(num);
        
        // 7-Pin uses separate grids for top and bottom halves
        if (layout.special === "seven" && layout.topHalf && layout.bottomHalf) {
          return (
            <div className="tile-pinzu">
              <div className="tile-pinzu-seven-container">
                {/* Top half: 3x3 grid */}
                <div className="tile-pinzu-grid tile-pinzu-top" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {layout.topHalf.map((circle, i) => (
                    <div
                      key={i}
                      className={`tile-pinzu-circle tile-pinzu-${circle.color}`}
                      style={{ gridRow: circle.row, gridColumn: circle.col }}
                    ></div>
                  ))}
                </div>
                {/* Bottom half: 2x2 grid, centered */}
                <div className="tile-pinzu-grid tile-pinzu-bottom" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                  {layout.bottomHalf.map((circle, i) => (
                    <div
                      key={i}
                      className={`tile-pinzu-circle tile-pinzu-${circle.color}`}
                      style={{ gridRow: circle.row, gridColumn: circle.col }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          );
        }
        
        // Normal layout
        return (
          <div className="tile-pinzu">
            <div className="tile-pinzu-grid" style={{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)` }}>
              {layout.circles?.map((circle, i) => (
                <div
                  key={i}
                  className={`tile-pinzu-circle tile-pinzu-${circle.color}`}
                  style={{ gridRow: circle.row, gridColumn: circle.col }}
                ></div>
              ))}
            </div>
          </div>
        );
      }
    } else if (content.type === "souzu") {
      // Souzu: Bamboo design (1-Sou is peacock, 2-9 Sou use bamboo stick count)
      const num = content.number || 1;
      
      if (num === 1) {
        // 1-Sou: Peacock design
        return (
          <div className="tile-souzu">
            <div className="tile-souzu-peacock">
              <div className="peacock-body"></div>
              <div className="peacock-head"></div>
              <div className="peacock-beak"></div>
              <div className="peacock-feet"></div>
              <div className="peacock-tail"></div>
            </div>
          </div>
        );
      } else {
        // 2-9 Sou: Represented by bamboo stick count (layout based on reference images and user description)
        const getSouzuLayout = (n: number): { 
          sticks: number; 
          columns: number; 
          customLayout?: Array<{ index: number; color: "green" | "red"; row?: number; col?: number; rotated?: number | boolean }>;
        } => {
          if (n === 2) {
            // 2-Sou: 1 column, 2 sticks (arranged vertically)
            return { sticks: 2, columns: 1 };
          } else if (n === 3) {
            // 3-Sou: Bamboo arranged like equilateral triangle (1 stick on top, 2 on bottom)
            // In 3 columns × 3 rows grid: top center (column 2), bottom left and right (columns 1 and 3)
            return { 
              sticks: 3, 
              columns: 3,
              customLayout: [
                { index: 0, color: "green", row: 1, col: 2 }, // Top center (row 1 col 2)
                { index: 1, color: "green", row: 3, col: 1 }, // Bottom left (row 3 col 1)
                { index: 2, color: "green", row: 3, col: 3 }, // Bottom right (row 3 col 3)
              ]
            };
          } else if (n === 4) {
            // 4-Sou: 2 columns × 2 rows
            return { sticks: 4, columns: 2 };
          } else if (n === 5) {
            // 5-Sou: Add one red stick in center of 4-Sou (2x2)
            // In 3 columns × 3 rows grid: green at 4 corners of 4-Sou (2x2), red in center
            return { 
              sticks: 5, 
              columns: 3,
              customLayout: [
                { index: 0, color: "green", row: 1, col: 1 }, // Top-left (row 1 col 1)
                { index: 1, color: "green", row: 1, col: 3 }, // Top-right (row 1 col 3)
                { index: 2, color: "red", row: 2, col: 2 },   // Center (red) - row 2 col 2
                { index: 3, color: "green", row: 3, col: 1 }, // Bottom-left (row 3 col 1)
                { index: 4, color: "green", row: 3, col: 3 }, // Bottom-right (row 3 col 3)
              ]
            };
          } else if (n === 6) {
            // 6-Sou: 3 columns × 2 rows
            return { sticks: 6, columns: 3 };
          } else if (n === 7) {
            // 7-Sou: Add one red stick on top of 6-Sou (3x2)
            // Top row: 1 stick (red), bottom rows: 3x2 (6 green sticks)
            return { 
              sticks: 7, 
              columns: 3,
              customLayout: [
                { index: 0, color: "red", row: 1, col: 2 },   // Top center (red) - row 1 center
                { index: 1, color: "green", row: 2, col: 1 }, // Bottom left (row 2 left)
                { index: 2, color: "green", row: 2, col: 2 }, // Bottom center (row 2 center)
                { index: 3, color: "green", row: 2, col: 3 }, // Bottom right (row 2 right)
                { index: 4, color: "green", row: 3, col: 1 }, // Bottommost left (row 3 left)
                { index: 5, color: "green", row: 3, col: 2 }, // Bottommost center (row 3 center)
                { index: 6, color: "green", row: 3, col: 3 }, // Bottommost right (row 3 right)
              ]
            };
          } else if (n === 8) {
            // 8-Sou: 4 green sticks in W-shape on top, 4 green sticks in M-shape on bottom
            // 4 vertical sticks, 4 diagonal sticks
            // W-shape: Top row, center dips down (diagonal)
            // M-shape: Bottom row, center rises up (diagonal)
            return { 
              sticks: 8, 
              columns: 4,
              customLayout: [
                { index: 0, color: "green", row: 1, col: 1, rotated: false }, // Top left (vertical)
                { index: 1, color: "green", row: 1, col: 2, rotated: -45 }, // Top center-left (-45deg)
                { index: 2, color: "green", row: 2, col: 3, rotated: -45 }, // Bottom center-right (-45deg)
                { index: 3, color: "green", row: 1, col: 4, rotated: false }, // Top right (vertical)
                { index: 4, color: "green", row: 2, col: 1, rotated: false }, // Bottom left (vertical)
                { index: 5, color: "green", row: 2, col: 2, rotated: 45 }, // Bottom center-left (45deg)
                { index: 6, color: "green", row: 1, col: 3, rotated: 45 }, // Top center-right (45deg)
                { index: 7, color: "green", row: 2, col: 4, rotated: false }, // Bottom right (vertical)
              ]
            };
          } else if (n === 9) {
            // 9-Sou: 3 columns × 3 rows, middle column is red
            return { 
              sticks: 9, 
              columns: 3,
              customLayout: [
                { index: 0, color: "green" }, // Top left
                { index: 1, color: "red" },   // Top center (red)
                { index: 2, color: "green" }, // Top right
                { index: 3, color: "green" }, // Middle left
                { index: 4, color: "red" },   // Middle center (red)
                { index: 5, color: "green" }, // Middle right
                { index: 6, color: "green" }, // Bottom left
                { index: 7, color: "red" },   // Bottom center (red)
                { index: 8, color: "green" }, // Bottom right
              ]
            };
          }
          return { sticks: n, columns: 1 };
        };
        
        const layout = getSouzuLayout(num);
        
        if (layout.customLayout) {
          // Use custom layout
          return (
            <div className="tile-souzu">
              <div className="tile-souzu-sticks" style={{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)` }}>
                {layout.customLayout.slice(0, layout.sticks).map((item, i) => {
                  const col = item.col !== undefined ? item.col : ((i % layout.columns) + 1);
                  const row = item.row !== undefined ? item.row : (Math.floor(i / layout.columns) + 1);
                  let rotation = 0;
                  if (typeof item.rotated === "number") {
                    rotation = item.rotated;
                  } else if (item.rotated === true) {
                    rotation = 45;
                  }
                  return (
                    <div
                      key={i}
                      className={`tile-souzu-stick ${item.color === "red" ? "tile-souzu-stick-red" : ""}`}
                      style={{ 
                        gridColumn: col, 
                        gridRow: row,
                        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
                        transformOrigin: "center",
                      }}
                    ></div>
                  );
                })}
              </div>
            </div>
          );
        } else {
          // Normal layout
          return (
            <div className="tile-souzu">
              <div className="tile-souzu-sticks" style={{ gridTemplateColumns: `repeat(${layout.columns}, 1fr)` }}>
                {Array(layout.sticks).fill(0).map((_, i) => (
                  <div
                    key={i}
                    className="tile-souzu-stick"
                  ></div>
                ))}
              </div>
            </div>
          );
        }
      }
    } else {
      // Honor tiles: East/South/West/North are black, White has white background, Green has green text, Red has red text
      const honorStyle: { [key: string]: { bg: string; text: string } } = {
        "東": { bg: "bg-white", text: "text-black" },
        "南": { bg: "bg-white", text: "text-black" },
        "西": { bg: "bg-white", text: "text-black" },
        "北": { bg: "bg-white", text: "text-black" },
        "白": { bg: "bg-white", text: "text-white" },
        "發": { bg: "bg-white", text: "text-green-600" },
        "中": { bg: "bg-white", text: "text-red-600" },
      };
      const style = honorStyle[content.honor || ""] || { bg: "bg-white", text: "text-gray-800" };
      return (
        <div className={`tile-honor ${style.bg} ${style.text}`}>
          {content.honor}
        </div>
      );
    }
  };

  const sizeDataAttr = size || "medium";
  
  return (
    <div className={`tile-3d-container ${sizeClass}`} title={hidden ? "Hidden tile" : `Tile ID: ${tile.id}`} data-size={sizeDataAttr}>
      <div className={`tile-3d ${sizeClass} ${depthClass}`}>
        {/* Front face */}
        <div className="tile-face tile-front">
          {hidden ? (
            <div className={`tile-surface border border-gray-400 rounded bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center tile-back`} data-size={sizeDataAttr}>
              <div className="tile-back-pattern"></div>
            </div>
          ) : (
            <div className={`tile-surface border border-gray-400 rounded bg-white flex items-center justify-center`} data-size={sizeDataAttr}>
              {renderTileContent()}
            </div>
          )}
        </div>
        {/* Top face */}
        <div className="tile-face tile-top"></div>
        {/* Right side face */}
        <div className="tile-face tile-right"></div>
      </div>
    </div>
  );
}

