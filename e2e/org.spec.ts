import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginOrg, DEMO } from "./helpers";

test.describe("organisation workspace", () => {
  test("owner signs in and sees the workspace overview", async ({ page }) => {
    await loginOrg(page, DEMO.owner);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText("Open cases", { exact: true })).toBeVisible();
    await expect(page.getByText("Disputed value", { exact: true })).toBeVisible();
  });

  test("owner can open a dispute case workspace", async ({ page }) => {
    await loginOrg(page, DEMO.owner);
    await page.locator('nav[aria-label="Primary"] a[href="/cases"]').click();
    await page.waitForURL(/\/cases$/);
    await expect(page.getByRole("heading", { name: "Cases", exact: true })).toBeVisible();

    await page.locator('table a[href^="/cases/"]').first().click();
    await page.waitForURL(/\/cases\/[0-9a-f-]{36}$/);
    await expect(page.getByText("Discrepancies in this case")).toBeVisible();
    await expect(page.getByText("Activity")).toBeVisible();
  });

  test("receiver can view purchase orders and receiving", async ({ page }) => {
    await loginOrg(page, DEMO.receiver);
    await page.locator('nav[aria-label="Primary"] a[href="/receiving"]').click();
    await page.waitForURL(/\/receiving$/);
    await expect(page.getByRole("heading", { name: "Receiving" })).toBeVisible();
  });

  test("finance can see exceptions needing verification", async ({ page }) => {
    await loginOrg(page, DEMO.finance);
    await page.locator('nav[aria-label="Primary"] a[href="/exceptions"]').click();
    await page.waitForURL(/\/exceptions$/);
    await expect(page.getByRole("heading", { name: "Exceptions" })).toBeVisible();
  });

  test("overview has no serious accessibility violations", async ({ page }) => {
    await loginOrg(page, DEMO.owner);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a"]).analyze();
    const serious = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
