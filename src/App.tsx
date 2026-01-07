import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { invoke } from "@tauri-apps/api/core";
import { GameState } from "./types";
import { HandDisplay } from "./components/HandDisplay";
import { DiscardDisplay } from "./components/DiscardDisplay";
import { DebugPanel } from "./components/DebugPanel";
import { GameEndModal } from "./components/GameEndModal";

// Check if Tauri is available
// Debug: Log window object to see what Tauri properties are available
function isTauriAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  
  // Check both __TAURI__ (Tauri 1.x) and __TAURI_INTERNALS__ (Tauri 2.x)
  const hasTauri1 = "__TAURI__" in window;
  const hasTauri2 = "__TAURI_INTERNALS__" in window;
  
  // Debug: Log window object to console
  // To debug, uncomment the following lines and check the browser console:
  console.log("Tauri debug - window keys with TAURI:", Object.keys(window).filter(k => k.includes("TAURI")));
  console.log("Tauri debug - __TAURI__:", hasTauri1);
  console.log("Tauri debug - __TAURI_INTERNALS__:", hasTauri2);
  if (hasTauri1) {
    console.log("Tauri debug - window.__TAURI__:", (window as any).__TAURI__);
  }
  if (hasTauri2) {
    console.log("Tauri debug - window.__TAURI_INTERNALS__:", (window as any).__TAURI_INTERNALS__);
  }
  
  // Tauri 2.x uses __TAURI_INTERNALS__ instead of __TAURI__
  // Check both for compatibility
  return hasTauri1 || hasTauri2;
}

// Wrapper for Tauri invoke with availability check and error handling
async function safeInvoke<T>(
  command: string,
  args?: Record<string, unknown>,
  options?: { showAlert?: boolean; onError?: (error: unknown) => void }
): Promise<T | null> {
  if (!isTauriAvailable()) {
    const message = "Tauri is not available. Please run this app in Tauri.";
    if (options?.showAlert !== false) {
      alert(message);
    }
    console.error(message);
    return null;
  }

  try {
    return await invoke<T>(command, args);
  } catch (error) {
    console.error(`Failed to invoke ${command}:`, error);
    if (options?.onError) {
      options.onError(error);
    } else if (options?.showAlert !== false) {
      alert(`Failed to ${command}: ${error}`);
    }
    return null;
  }
}

export function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [hideCpuTiles, setHideCpuTiles] = useState(true); // Hide CPU tiles by default
  const isProcessingRef = useRef(false);

  const loadGameState = async () => {
    const state = await safeInvoke<GameState>("get_state", undefined, { showAlert: false });
    if (state) {
      setGameState(state);
    }
  };

  const startNewGame = async () => {
    setShowEndModal(false);
    isProcessingRef.current = false;
    const state = await safeInvoke<GameState>("new_game");
    if (state) {
      setGameState(state);
    }
  };

  const handleDiscard = async (tile: { id: number }) => {
    const state = await safeInvoke<GameState>("player_discard", { tileId: tile.id });
    if (state) {
      setGameState(state);
    }
  };

  const processPlayerDraw = useCallback(async () => {
    if (isProcessingRef.current) return;
    
    if (!gameState) return;
    
    // Check if it's player's turn and in Draw phase
    if (gameState.current_player !== "Player" || gameState.phase !== "Draw") {
      return;
    }
    
    // Check if game has ended
    if (gameState.wall_count === 0) {
      setShowEndModal(true);
      return;
    }
    
    isProcessingRef.current = true;
    
    const state = await safeInvoke<GameState>("player_draw", undefined, {
      showAlert: false,
      onError: (error) => {
        // If error is "Game has ended", show end modal
        if (error && typeof error === "string" && error.includes("ended")) {
          setShowEndModal(true);
        }
      },
    });
    
    if (state) {
      setGameState(state);
      // Check if game ended after draw
      if (state.phase === "End" || state.wall_count === 0) {
        setShowEndModal(true);
      }
    }
    
    isProcessingRef.current = false;
  }, [gameState]);

  const processCpuTurn = useCallback(async () => {
    if (isProcessingRef.current) return;
    
    if (!gameState) return;
    
    // Check if it's a CPU turn
    const isCpuTurn = gameState.current_player === "Cpu1" || 
                      gameState.current_player === "Cpu2" || 
                      gameState.current_player === "Cpu3";
    
    if (!isCpuTurn) return;
    
    // Check if game has ended
    if (gameState.phase === "End" || gameState.wall_count === 0) {
      setShowEndModal(true);
      return;
    }
    
    isProcessingRef.current = true;
    
    const state = await safeInvoke<GameState>("cpu_step", undefined, {
      showAlert: false,
      onError: (error) => {
        // If error is "Game has ended", show end modal
        if (error && typeof error === "string" && error.includes("ended")) {
          setShowEndModal(true);
        }
      },
    });
    
    if (state) {
      setGameState(state);
      // Check if game ended after CPU step
      if (state.phase === "End" || state.wall_count === 0) {
        setShowEndModal(true);
      }
    }
    
    isProcessingRef.current = false;
  }, [gameState]);

  const handleTsumo = async () => {
    // TODO: Implement tsumo command
    alert("Tsumo win! (Not yet implemented)");
  };

  const handleRon = async () => {
    const state = await safeInvoke<GameState>("player_ron");
    if (state) {
      setGameState(state);
      if (state.phase === "End") {
        setShowEndModal(true);
      }
    }
  };

  const handlePass = async () => {
    const state = await safeInvoke<GameState>("player_pass");
    if (state) {
      setGameState(state);
    }
  };

  useEffect(() => {
    loadGameState();
  }, []);

  // Auto-process player draw phase
  useEffect(() => {
    if (!gameState) return;
    
    if (gameState.current_player === "Player" && 
        gameState.phase === "Draw" && 
        gameState.wall_count > 0) {
      // Add a small delay to allow UI to update
      const timer = setTimeout(() => {
        processPlayerDraw();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [gameState, processPlayerDraw]);

  // Auto-process CPU turns
  useEffect(() => {
    if (!gameState) return;
    
    const isCpuTurn = gameState.current_player === "Cpu1" || 
                      gameState.current_player === "Cpu2" || 
                      gameState.current_player === "Cpu3";
    
    if (isCpuTurn && gameState.phase !== "End" && gameState.wall_count > 0) {
      // Add a small delay to allow UI to update
      const timer = setTimeout(() => {
        processCpuTurn();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [gameState, processCpuTurn]);

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
                <HandDisplay tiles={gameState.hands[2]} drawnTile={gameState.drawn_tile[2]} title="CPU2" hidden={hideCpuTiles} />
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
                <HandDisplay tiles={gameState.hands[3]} drawnTile={gameState.drawn_tile[3]} title="CPU3" hidden={hideCpuTiles} />
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
                <div className="flex gap-2 justify-center mb-2">
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
                <div className="flex gap-2 justify-center items-center">
                  <label className="text-sm flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideCpuTiles}
                      onChange={(e) => setHideCpuTiles(e.currentTarget.checked)}
                      className="w-4 h-4"
                    />
                    <span>Hide CPU Tiles</span>
                  </label>
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
                <HandDisplay tiles={gameState.hands[1]} drawnTile={gameState.drawn_tile[1]} title="CPU1" hidden={hideCpuTiles} />
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
                drawnTile={gameState.drawn_tile[0]}
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
                  {gameState.can_tsumo[0] && (
                    <button
                      onClick={handleTsumo}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Tsumo
                    </button>
                  )}
                </div>
              )}
              {/* Ron phase buttons */}
              {gameState.current_player === "Player" && gameState.phase === "Ron" && (
                <div className="mt-4 flex gap-2">
                  {gameState.can_ron[0] && (
                    <button
                      onClick={handleRon}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Ron
                    </button>
                  )}
                  <button
                    onClick={handlePass}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Pass
                  </button>
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

      {showEndModal && gameState && (
        <GameEndModal
          gameState={gameState}
          onClose={() => setShowEndModal(false)}
          onNewGame={startNewGame}
        />
      )}
    </div>
  );
}

