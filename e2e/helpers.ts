import type { Page } from "@playwright/test";

export const DEMO = {
  owner: { email: "owner@meridian.local", password: "Proofline@123" },
  manager: { email: "manager@meridian.local", password: "Proofline@123" },
  receiver: { email: "receiver@meridian.local", password: "Proofline@123" },
  finance: { email: "finance@meridian.local", password: "Proofline@123" },
  supplier: { email: "supplier@brighttech.local", password: "Supplier@123" },
};

export async function loginOrg(page: Page, account = DEMO.owner): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/overview/);
}

export async function loginSupplier(page: Page, account = DEMO.supplier): Promise<void> {
  await page.goto("/supplier/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/supplier$/);
}
