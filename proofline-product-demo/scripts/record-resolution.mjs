// Re-records the dispute-resolution beat with generous dwell times so the
// approved -> verified -> resolved state is actually visible on screen.
// Manager: create case, move under review, propose credit note, approve.
// Finance: open the same case and verify the resolution.
import { chromium } from "@playwright/test";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REC = path.join(ROOT, "recordings");
const BASE = process.argv[2] ?? "https://proofline-inky.vercel.app";
const VIEWPORT = { width: 1920, height: 1080 };

async function newContext(browser, state) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: REC, size: VIEWPORT },
    storageState: state,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);
  return { context, page };
}

async function save(page, context, name) {
  const raw = await page.video().path();
  await context.close();
  const target = path.join(REC, name);
  await rm(target, { force: true }).catch(() => {});
  await rename(raw, target);
  console.log(`recorded ${name}`);
}

async function main() {
  await mkdir(REC, { recursive: true });
  const managerState = JSON.parse(await readFile(path.join(REC, "manager.json"), "utf8"));
  const financeState = JSON.parse(await readFile(path.join(REC, "finance.json"), "utf8"));
  const browser = await chromium.launch();
  let caseUrl = null;

  {
    const { context, page } = await newContext(browser, managerState);
    await page.goto(`${BASE}/exceptions`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1300);
    await page.getByRole("link", { name: "New case" }).click();
    await page.waitForURL(/\/cases\/new/);
    await page.waitForTimeout(1300);
    // Over-delivery on the video PO (free discrepancy; rows already in a case are rejected).
    await page.locator('input[type="checkbox"]').nth(4).check();
    await page.getByLabel("Summary").click();
    await page.getByLabel("Summary").pressSequentially("Over-delivery on video demo order", { delay: 28 });
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Create case" }).click();
    await page.waitForURL(/\/cases\/[0-9a-f-]{36}$/, { timeout: 120_000 });
    caseUrl = new URL(page.url()).pathname;
    await page.waitForTimeout(2400);

    const moveTo = page.getByRole("heading", { name: "Move to" });
    await moveTo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Under Review" }).click();
    await page.getByText("Under Review", { exact: false }).first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(2400);

    const propose = page.getByRole("heading", { name: "Propose a resolution" });
    await propose.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Propose resolution" }).click();
    await page.getByText("Proposed by", { exact: false }).first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(2400);

    const resolutions = page.getByRole("heading", { name: /Resolutions/ });
    await resolutions.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Approve" }).first().click();
    await page.getByText("approved by", { exact: false }).first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(2800);

    await save(page, context, "09-manager-case.webm");
  }

  {
    const { context, page } = await newContext(browser, financeState);
    await page.goto(`${BASE}${caseUrl}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const resolutions = page.getByRole("heading", { name: /Resolutions/ });
    await resolutions.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Verify" }).first().click();
    await page.getByText("verified by", { exact: false }).first().waitFor({ timeout: 60_000 });
    await page.waitForTimeout(4200);
    await save(page, context, "10-finance-verify.webm");
  }

  await browser.close();
  const sessionPath = path.join(REC, "session.json");
  const session = JSON.parse(await readFile(sessionPath, "utf8"));
  session.caseUrl = caseUrl;
  await writeFile(sessionPath, JSON.stringify(session, null, 2), "utf8");
  console.log(JSON.stringify({ caseUrl }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
