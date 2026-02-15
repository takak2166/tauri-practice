import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { isTauriAvailable, safeInvoke } from "../lib/tauri";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("isTauriAvailable", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.stubGlobal("window", { ...originalWindow });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(isTauriAvailable()).toBe(false);
  });

  it("returns false when neither __TAURI__ nor __TAURI_INTERNALS__ is present", () => {
    vi.stubGlobal("window", {});
    expect(isTauriAvailable()).toBe(false);
  });

  it("returns true when __TAURI__ is present", () => {
    vi.stubGlobal("window", { __TAURI__: {} });
    expect(isTauriAvailable()).toBe(true);
  });

  it("returns true when __TAURI_INTERNALS__ is present", () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    expect(isTauriAvailable()).toBe(true);
  });
});

describe("safeInvoke", () => {
  const originalWindow = globalThis.window;
  const originalAlert = globalThis.alert;

  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.alert = originalAlert;
  });

  it("returns null and calls alert when Tauri is not available", async () => {
    expect.assertions(3);
    const result = await safeInvoke<unknown>("get_state", undefined, {
      showAlert: true,
    });
    expect(result).toBeNull();
    expect(alert).toHaveBeenCalledWith(
      "Tauri is not available. Please run this app in Tauri."
    );
    expect(alert).toHaveBeenCalledTimes(1);
  });

  it("returns null without alert when Tauri is not available and showAlert is false", async () => {
    expect.assertions(2);
    const result = await safeInvoke<unknown>("get_state", undefined, {
      showAlert: false,
    });
    expect(result).toBeNull();
    expect(alert).not.toHaveBeenCalled();
  });

  it("calls onError when invoke throws and returns null", async () => {
    expect.assertions(2);
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    vi.mocked(invoke).mockRejectedValueOnce(new Error("backend error"));

    const onError = vi.fn();
    const result = await safeInvoke<unknown>("get_state", undefined, {
      showAlert: false,
      onError,
    });

    expect(result).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
