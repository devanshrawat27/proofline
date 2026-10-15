import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginSupplier, DEMO } from "./helpers";

test.describe("supplier portal", () => {
  test("supplier signs in and sees shared cases", async ({ page }) => {
    await loginSupplier(page, DEMO.supplier);
    await expect(page.getByRole("heading", { name: /dispute cases/i })).toBeVisible();
    await expect(page.locator('a[href^="/supplier/cases/"]').first()).toBeVisible();
  });

  test("supplier can open a case and reach the response form", async ({ page }) => {
    await loginSupplier(page, DEMO.supplier);
    await page.locator('a[href^="/supplier/cases/"]').first().click();
    await page.waitForURL(/\/supplier\/cases\/[0-9a-f-]{36}$/);
    await expect(page.getByText("What was found")).toBeVisible();
    await expect(page.getByRole("heading", { name: /conversation/i })).toBeVisible();
  });

  test("supplier portal has no serious accessibility violations", async ({ page }) => {
    await loginSupplier(page, DEMO.supplier);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a"]).analyze();
    const serious = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
