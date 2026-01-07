import { GameState } from "../types";

interface DebugPanelProps {
  gameState: GameState;
  isOpen: boolean;
  onToggle: () => void;
}

export function DebugPanel({ gameState, isOpen, onToggle }: DebugPanelProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gray-600 text-white px-4 py-2 rounded shadow-lg"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded shadow-lg max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">Debug Info</h2>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      <div className="text-xs space-y-2">
        <div>
          <strong>Current Player:</strong> {gameState.current_player}
        </div>
        <div>
          <strong>Phase:</strong> {gameState.phase}
        </div>
        <div>
          <strong>Wall Count:</strong> {gameState.wall_count}
        </div>
        <div>
          <strong>Can Tsumo:</strong> {gameState.can_tsumo.map((v, i) => `${i}:${v ? "Yes" : "No"}`).join(", ")}
        </div>
        <div>
          <strong>Can Ron:</strong> {gameState.can_ron.map((v, i) => `${i}:${v ? "Yes" : "No"}`).join(", ")}
        </div>
        <div className="mt-4">
          <strong>Hand Sizes:</strong>
          <ul className="list-disc list-inside ml-2">
            <li>Player: {gameState.hands[0].length}</li>
            <li>Cpu1: {gameState.hands[1].length}</li>
            <li>Cpu2: {gameState.hands[2].length}</li>
            <li>Cpu3: {gameState.hands[3].length}</li>
          </ul>
        </div>
        <div className="mt-4">
          <strong>Discard Sizes:</strong>
          <ul className="list-disc list-inside ml-2">
            <li>Player: {gameState.discards[0].length}</li>
            <li>Cpu1: {gameState.discards[1].length}</li>
            <li>Cpu2: {gameState.discards[2].length}</li>
            <li>Cpu3: {gameState.discards[3].length}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

