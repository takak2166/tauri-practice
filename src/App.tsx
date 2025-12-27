import { useState, useEffect } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { GameState } from "./types";
import { HandDisplay } from "./components/HandDisplay";
import { DiscardDisplay } from "./components/DiscardDisplay";
import { DebugPanel } from "./components/DebugPanel";

export function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);

  const loadGameState = async () => {
    try {
      const state = await invoke<GameState>("get_state");
      setGameState(state);
    } catch (error) {
      console.error("Failed to load game state:", error);
    }
  };

  const startNewGame = async () => {
    try {
      const state = await invoke<GameState>("new_game");
      setGameState(state);
    } catch (error) {
      console.error("Failed to start new game:", error);
    }
  };

  const handleDiscard = async (tile: { id: number }) => {
    try {
      const state = await invoke<GameState>("player_discard", { tileId: tile.id });
      setGameState(state);
    } catch (error) {
      console.error("Failed to discard tile:", error);
      alert(`Failed to discard: ${error}`);
    }
  };

  const handleTsumo = async () => {
    // TODO: Implement tsumo command
    alert("Tsumo win! (Not yet implemented)");
  };

  const handleRon = async () => {
    // TODO: Implement ron command
    alert("Ron win! (Not yet implemented)");
  };

  useEffect(() => {
    loadGameState();
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--mahjong-table-bg)" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Mahdongjara</h1>
          <button
            onClick={startNewGame}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--mahjong-table-bg)" }}>
      <div className="w-full">
        {/* Mahjong table layout: configuration (facing each other) */}
        <div className="mahjong-table">
          {/* Top: CPU2 (facing Player) - 180deg rotation, hand on outside (bottom), discards on inside (top) */}
          <div className="player-area player-top">
            <div className="player-area-rotated player-rotate-180">
              <div className="p-1 rounded-lg mb-1">
                <DiscardDisplay tiles={gameState.discards[2]} title="CPU2 Discards" />
              </div>
              <div className="p-1 rounded-lg">
                <HandDisplay tiles={gameState.hands[2]} title="CPU2" />
              </div>
            </div>
          </div>

          {/* Left: CPU3 (facing CPU1) - 90deg rotation to right, hand on outside (right), discards on inside (left) */}
          <div className="player-area player-left">
            <div className="player-area-rotated player-rotate-90">
              <div className="p-1 rounded-lg mr-1">
                <DiscardDisplay tiles={gameState.discards[3]} title="CPU3 Discards" />
              </div>
              <div className="p-1 rounded-lg">
                <HandDisplay tiles={gameState.hands[3]} title="CPU3" />
              </div>
            </div>
          </div>

          {/* Center: Game info */}
          <div className="game-center">
            <div className="bg-white/90 p-2 rounded-lg shadow-lg">
              <div className="text-center">
                <p className="text-sm mb-2">
                  <strong>Current Player:</strong> {gameState.current_player}
                </p>
                <p className="text-sm mb-2">
                  <strong>Phase:</strong> {gameState.phase}
                </p>
                <p className="text-sm mb-4">
                  <strong>Wall Count:</strong> {gameState.wall_count}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={startNewGame}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                  >
                    New Game
                  </button>
                  <button
                    onClick={loadGameState}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: CPU1 (facing CPU3) - 90deg rotation to left, hand on outside (left), discards on inside (right) */}
          <div className="player-area player-right">
            <div className="player-area-rotated player-rotate-270">
              <div className="p-1 rounded-lg ml-1">
                <DiscardDisplay tiles={gameState.discards[1]} title="CPU1 Discards" />
              </div>
              <div className="p-1 rounded-lg">
                <HandDisplay tiles={gameState.hands[1]} title="CPU1" />
              </div>
            </div>
          </div>

          {/* Bottom: Player (facing CPU2) - hand on outside (bottom), discards on inside (top) */}
          <div className="player-area player-bottom">
            <div className="p-1 rounded-lg mb-1">
              <DiscardDisplay
                tiles={gameState.discards[0]}
                title="Your Discards"
              />
            </div>
            <div className="p-1 rounded-lg">
              <HandDisplay
                tiles={gameState.hands[0]}
                title="Your Hand"
                clickable={
                  gameState.current_player === "Player" &&
                  gameState.phase === "Discard"
                }
                onTileClick={handleDiscard}
              />
              {/* Win buttons */}
              {gameState.current_player === "Player" && gameState.phase === "Discard" && (
                <div className="mt-4 flex gap-2">
                  {gameState.can_tsumo && (
                    <button
                      onClick={handleTsumo}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Tsumo
                    </button>
                  )}
                  {gameState.can_ron && (
                    <button
                      onClick={handleRon}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Ron
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <DebugPanel
        gameState={gameState}
        isOpen={debugOpen}
        onToggle={() => setDebugOpen(!debugOpen)}
      />
    </div>
  );
}

