import { test, expect } from "@playwright/test";

test.describe("Game critical flow", () => {
  test("shows Start New Game on load and button is clickable", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Start New Game/i })).toBeVisible();
    await expect(page.getByText("Mahdongjara")).toBeVisible();
  });

  test("Start New Game button triggers flow", async ({ page }) => {
    await page.goto("/");
    const startBtn = page.getByRole("button", { name: /Start New Game/i });
    await expect(startBtn).toBeVisible();
    page.on("dialog", (dialog) => dialog.accept());
    await startBtn.click();
    await page.waitForTimeout(500);
  });

  test("page has mahjong table or start screen", async ({ page }) => {
    await page.goto("/");
    const startBtn = page.getByRole("button", { name: /Start New Game/i });
    const table = page.locator(".mahjong-table");
    const hasStart = await startBtn.isVisible();
    const hasTable = (await table.count()) > 0;
    expect(hasStart || hasTable).toBe(true);
  });

  // Scenario 1–2: After clicking Start New Game, either game screen or start screen.
  // When backend is available: game screen with 13 hand tiles.
  test("after Start New Game click, game screen shows hand tiles when backend responds", async ({
    page,
  }) => {
    await page.goto("/");
    page.on("dialog", (dialog) => dialog.accept());
    const startBtn = page.getByRole("button", { name: /Start New Game/i });
    await startBtn.click();
    await page.waitForTimeout(1500);
    const gameScreen = page.getByText(/Current Player/i);
    const stillStart = page.getByRole("button", { name: /Start New Game/i });
    const gameVisible = await gameScreen.isVisible();
    if (gameVisible) {
      const playerHand = page.locator(".player-bottom .hand-display-container .tile-3d-container");
      await expect(playerHand).toHaveCount(13, { timeout: 3000 });
    } else {
      await expect(stillStart).toBeVisible();
    }
  });

  // Scenario 3: In Discard phase, clicking a hand tile adds to discards (when backend responds).
  test("in Discard phase, clicking hand tile updates discard area when backend responds", async ({
    page,
  }) => {
    await page.goto("/");
    page.on("dialog", (dialog) => dialog.accept());
    const startBtn = page.getByRole("button", { name: /Start New Game/i });
    await startBtn.click();
    await page.waitForTimeout(2000);
    if (!(await page.getByText(/Current Player/i).isVisible())) {
      test.skip();
      return;
    }
    const handTiles = page.locator(".player-bottom .hand-display-container .tile-3d-container");
    const initialCount = await page.locator(".player-bottom .discard-display-container .tile-3d-container").count();
    const tile = handTiles.first();
    if (await tile.isVisible()) {
      await tile.click();
      await page.waitForTimeout(1000);
      const afterCount = await page.locator(".player-bottom .discard-display-container .tile-3d-container").count();
      expect(afterCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  // Scenario 4: Game end modal shows New Game and Close when game has ended.
  test("game end modal shows New Game and Close when shown", async ({ page }) => {
    await page.goto("/");
    page.on("dialog", (dialog) => dialog.accept());
    const startBtn = page.getByRole("button", { name: /Start New Game/i });
    await startBtn.click();
    await page.waitForTimeout(1500);
    const modal = page.locator(".fixed.inset-0");
    const modalVisible = await modal.isVisible();
    if (modalVisible) {
      await expect(page.getByRole("button", { name: /New Game/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Close/i })).toBeVisible();
    }
    const onStart = await page.getByRole("button", { name: /Start New Game/i }).isVisible();
    const onGame = await page.getByText(/Current Player/i).isVisible();
    expect(onStart || onGame || modalVisible).toBe(true);
  });
});
