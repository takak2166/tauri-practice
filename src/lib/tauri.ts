import { invoke } from "@tauri-apps/api/core";

/**
 * Check if Tauri is available (Tauri 1.x or 2.x).
 * Exported for testing.
 */
export function isTauriAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const hasTauri1 = "__TAURI__" in window;
  const hasTauri2 = "__TAURI_INTERNALS__" in window;
  return hasTauri1 || hasTauri2;
}

/**
 * Wrapper for Tauri invoke with availability check and error handling.
 * Exported for testing.
 */
export async function safeInvoke<T>(
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
