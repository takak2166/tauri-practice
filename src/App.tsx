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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Mahdongjara</h1>
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Mahdongjara</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player Hand */}
          <div className="bg-white p-4 rounded-lg shadow">
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

          {/* Player Discards */}
          <div className="bg-white p-4 rounded-lg shadow">
            <DiscardDisplay
              tiles={gameState.discards[0]}
              title="Your Discards"
            />
          </div>

          {/* CPU Hands */}
          <div className="bg-white p-4 rounded-lg shadow">
            <HandDisplay tiles={gameState.hands[1]} title="CPU1 Hand" />
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <DiscardDisplay tiles={gameState.discards[1]} title="CPU1 Discards" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <HandDisplay tiles={gameState.hands[2]} title="CPU2 Hand" />
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <DiscardDisplay tiles={gameState.discards[2]} title="CPU2 Discards" />
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <HandDisplay tiles={gameState.hands[3]} title="CPU3 Hand" />
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <DiscardDisplay tiles={gameState.discards[3]} title="CPU3 Discards" />
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <p>
                <strong>Current Player:</strong> {gameState.current_player}
              </p>
              <p>
                <strong>Phase:</strong> {gameState.phase}
              </p>
              <p>
                <strong>Wall Count:</strong> {gameState.wall_count}
              </p>
            </div>
            <div>
              <button
                onClick={startNewGame}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
              >
                New Game
              </button>
              <button
                onClick={loadGameState}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Refresh
              </button>
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

