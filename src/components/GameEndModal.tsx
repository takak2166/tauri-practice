import { GameState } from "../types";

interface GameEndModalProps {
  gameState: GameState;
  onClose: () => void;
  onNewGame: () => void;
}

export function GameEndModal({ gameState, onClose, onNewGame }: GameEndModalProps) {
  const isWallExhausted = gameState.wall_count === 0;
  const reason = isWallExhausted ? "Wall Exhausted (流局)" : "Game Ended";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Game Ended</h2>
        <div className="mb-6">
          <p className="text-center text-gray-700 mb-2">
            <strong>Reason:</strong> {reason}
          </p>
          <p className="text-center text-gray-700 mb-2">
            <strong>Wall Count:</strong> {gameState.wall_count}
          </p>
          <p className="text-center text-gray-700">
            <strong>Phase:</strong> {gameState.phase}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onNewGame}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            New Game
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

