// Records the reviewed invoice (with the discrepancies produced by the engine).
import { chromium } from "@playwright/test";
import { mkdir, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REC = path.join(ROOT, "recordings");
const BASE = process.argv[2] ?? "https://proofline-inky.vercel.app";
const AUTH = path.join(REC, "finance.json");

async function resolveInvoice() {
  if (process.argv[3]) return process.argv[3];
  try {
    const session = JSON.parse(await readFile(path.join(REC, "session.json"), "utf8"));
    return session.invoiceNumber;
  } catch {
    return "INV-VID-503048";
  }
}

async function main() {
  await mkdir(REC, { recursive: true });
  const invoice = await resolveInvoice();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: REC, size: { width: 1920, height: 1080 } },
    storageState: AUTH,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120_000);

  await page.goto(`${BASE}/invoices?search=${invoice}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.locator('table a[href^="/invoices/"]').first().click();
  await page.waitForURL(/\/invoices\/[0-9a-f-]{36}$/);
  await page.waitForTimeout(1800);
  // Scroll to the discrepancy list so it is clearly visible.
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h3"));
    const target = headings.find((h) => h.textContent?.includes("Discrepancies"));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  await page.waitForTimeout(2600);

  const video = page.video();
  const raw = video ? await video.path() : null;
  await context.close();
  if (raw) {
    const target = path.join(REC, "05b-invoice-reviewed.webm");
    await rm(target, { force: true }).catch(() => {});
    await rename(raw, target).catch(() => {});
    console.log("recorded 05b-invoice-reviewed");
  }
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
