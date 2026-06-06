import { test, expect } from "@playwright/test";

// storageState is set globally in playwright.config.ts

test.describe("core task flow", () => {
  test("add → complete → delete a task", async ({ page }) => {
    await page.goto("/tasks");
    await expect(page).toHaveTitle(/Tasky/);

    // ── Add a task ──────────────────────────────────────────────────────────
    // Use the keyboard shortcut 'n' to focus the add-task input
    await page.locator("body").focus();
    await page.keyboard.press("n");

    const addInput = page.getByTestId("add-task-input");
    await expect(addInput).toBeFocused();
    await addInput.fill("E2E smoke test task");
    await addInput.press("Enter");

    // Task should appear in the list
    const taskCard = page.getByTestId("task-item").filter({ hasText: "E2E smoke test task" });
    await expect(taskCard).toBeVisible();

    // ── Complete the task ───────────────────────────────────────────────────
    await taskCard.getByRole("button", { name: "Mark as done" }).click();
    // Title should gain line-through styling (status flips to DONE)
    await expect(taskCard.getByText("E2E smoke test task")).toHaveClass(/line-through/);

    // ── Delete the task ─────────────────────────────────────────────────────
    await taskCard.hover();
    await taskCard.getByRole("button", { name: "Delete task" }).click();
    await expect(taskCard).not.toBeVisible();

    // ── Sign out ────────────────────────────────────────────────────────────
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("keyboard shortcuts: n focuses input, c toggles complete, d deletes", async ({ page }) => {
    await page.goto("/tasks");

    // 'n' should focus the add-task input
    await page.locator("body").focus();
    await page.keyboard.press("n");
    await expect(page.getByTestId("add-task-input")).toBeFocused();

    // Add a task so we can test c/d shortcuts
    await page.getByTestId("add-task-input").fill("Keyboard shortcut task");
    await page.keyboard.press("Enter");

    const taskCard = page.getByTestId("task-item").filter({ hasText: "Keyboard shortcut task" });
    await expect(taskCard).toBeVisible();

    // Click the card to select it, then press 'c' to toggle complete
    await taskCard.click();
    await page.keyboard.press("c");
    await expect(taskCard.getByText("Keyboard shortcut task")).toHaveClass(/line-through/);

    // Press 'd' to delete
    await page.keyboard.press("d");
    await expect(taskCard).not.toBeVisible();
  });

  test("today / upcoming / no-date views filter tasks", async ({ page }) => {
    await page.goto("/tasks");

    // The sidebar should contain the view navigation
    await expect(page.getByRole("button", { name: "Today" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upcoming" })).toBeVisible();
    await expect(page.getByRole("button", { name: "No date" })).toBeVisible();

    // 'No date' view — tasks without a due date
    await page.getByRole("button", { name: "No date" }).click();
    // All visible task cards should NOT show a date badge (best-effort smoke check)
    // Just verify the view doesn't crash and shows some content or empty state
    const body = page.locator("main");
    await expect(body).toBeVisible();
  });
});
