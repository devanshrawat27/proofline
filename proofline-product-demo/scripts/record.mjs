// Records REAL multi-role interactions in narrative order (no staged errors).
// manager → receiver → finance → case/resolution → supplier.
import { chromium } from "@playwright/test";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REC = path.join(ROOT, "recordings");
const BASE = process.argv[2] ?? process.env.DEMO_BASE_URL ?? "https://proofline-inky.vercel.app";

const VIEWPORT = { width: 1920, height: 1080 };
const USERS = {
  manager: { email: "manager@meridian.local", password: "Proofline@123" },
  finance: { email: "finance@meridian.local", password: "Proofline@123" },
  receiver: { email: "receiver@meridian.local", password: "Proofline@123" },
  supplier: { email: "supplier@brighttech.local", password: "Supplier@123" },
};
const STAMP = Date.now().toString().slice(-6);
const PO_NUMBER = `VID-${STAMP}`;
const INVOICE_NUMBER = `INV-VID-${STAMP}`;
const marks = {};
let caseUrl = null;

async function login(page, who, { supplier = false } = {}) {
  const account = USERS[who];
  await page.goto(`${BASE}${supplier ? "/supplier/login" : "/login"}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const emailLabel = supplier ? "Email" : "Work email";
  await page.getByLabel(emailLabel).click();
  await page.getByLabel(emailLabel).pressSequentially(account.email, { delay: 40 });
  await page.getByLabel("Password").click();
  await page.getByLabel("Password").pressSequentially(account.password, { delay: 40 });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(supplier ? /\/supplier$/ : /\/overview/, { timeout: 150_000 });
  await page.waitForTimeout(1600);
}

async function main() {
  await mkdir(REC, { recursive: true });
  const browser = await chromium.launch();
  const states = {};

  async function record(name, fn, storageState) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      recordVideo: { dir: REC, size: VIEWPORT },
      ...(storageState ? { storageState } : {}),
    });
    const page = await context.newPage();
    page.setDefaultTimeout(120_000);
    const started = Date.now();
    try {
      await fn(page);
    } catch (error) {
      marks[name] = { error: String(error).slice(0, 240) };
      console.error(`segment ${name} failed: ${error}`);
    }
    const video = page.video();
    const raw = video ? await video.path() : null;
    const state = storageState ? undefined : await context.storageState().catch(() => undefined);
    await context.close();
    if (raw) {
      const target = path.join(REC, `${name}.webm`);
      await rm(target, { force: true }).catch(() => {});
      await rename(raw, target).catch(() => {});
      marks[name] = { ...(marks[name] ?? {}), seconds: Math.round((Date.now() - started) / 100) / 10 };
      console.log(`recorded ${name}`);
    }
    return state;
  }

  await record("01-landing", async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2600);
    await page.evaluate(() => document.querySelector("#how")?.scrollIntoView({ behavior: "smooth" }));
    await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector("#product")?.scrollIntoView({ behavior: "smooth" }));
    await page.waitForTimeout(1500);
  });

  states.manager = await record("02-manager-login", (page) => login(page, "manager"));
  if (states.manager) await writeFile(path.join(REC, "manager.json"), JSON.stringify(states.manager), "utf8");

  await record(
    "03-manager-overview",
    async (page) => {
      await page.goto(`${BASE}/overview`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2200);
    },
    states.manager,
  );

  await record(
    "04-manager-po",
    async (page) => {
      await page.goto(`${BASE}/purchase-orders/new`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await page.getByLabel("PO number").click();
      await page.getByLabel("PO number").pressSequentially(PO_NUMBER, { delay: 60 });
      await page.getByLabel("Description").first().click();
      await page.getByLabel("Description").first().pressSequentially("LED Driver 12W", { delay: 35 });
      await page.getByLabel("Quantity").first().fill("10");
      await page.getByLabel("Unit price (₹)").first().click();
      await page.getByLabel("Unit price (₹)").first().pressSequentially("500", { delay: 60 });
      await page.waitForTimeout(600);
      await page.getByRole("button", { name: "Create purchase order" }).click();
      await page.waitForURL(/\/purchase-orders\/[0-9a-f-]{36}$/, { timeout: 120_000 });
      await page.waitForTimeout(1300);
      await page.getByRole("button", { name: "Issue purchase order" }).click();
      await page.waitForTimeout(2200);
    },
    states.manager,
  );

  states.receiver = await record("05-receiver-login", (page) => login(page, "receiver"));
  if (states.receiver) await writeFile(path.join(REC, "receiver.json"), JSON.stringify(states.receiver), "utf8");

  await record(
    "06-receiver-receiving",
    async (page) => {
      await page.goto(`${BASE}/purchase-orders?search=${PO_NUMBER}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);
      await page.locator('table a[href^="/purchase-orders/"]').first().click();
      await page.waitForURL(/\/purchase-orders\/[0-9a-f-]{36}$/);
      await page.waitForTimeout(800);
      await page.getByRole("link", { name: "Record delivery" }).click();
      await page.waitForURL(/\/receiving\/new/);
      await page.waitForTimeout(1000);
      await page.getByLabel("Received", { exact: true }).first().fill("10");
      await page.getByLabel("Damaged (of received)").first().fill("1");
      await page.getByLabel("Delivery reference").fill("DC-VIDEO");
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "Save draft receipt" }).click();
      await page.waitForURL(/\/receiving\/[0-9a-f-]{36}$/, { timeout: 120_000 });
      await page.waitForTimeout(1300);
      await page.getByRole("button", { name: "Submit receipt" }).click();
      await page.waitForTimeout(2400);
    },
    states.receiver,
  );

  states.finance = await record("07-finance-login", (page) => login(page, "finance"));
  if (states.finance) await writeFile(path.join(REC, "finance.json"), JSON.stringify(states.finance), "utf8");

  await record(
    "08-finance-invoice",
    async (page) => {
      await page.goto(`${BASE}/invoices/new`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await page.getByLabel("Invoice number").click();
      await page.getByLabel("Invoice number").pressSequentially(INVOICE_NUMBER, { delay: 50 });
      const poSelect = page.getByLabel("Purchase order (for matching)");
      await poSelect.selectOption({ label: PO_NUMBER }).catch(async () => {
        await poSelect.selectOption({ index: 1 });
      });
      await page.waitForTimeout(1600);
      await page.getByLabel("Description").first().click();
      await page.getByLabel("Description").first().pressSequentially("LED Driver 12W", { delay: 30 });
      await page.getByLabel("Quantity").first().fill("12");
      await page.getByLabel("Unit price (₹)").first().click();
      await page.getByLabel("Unit price (₹)").first().pressSequentially("600", { delay: 50 });
      await page.getByLabel("Match to PO line").first().selectOption({ index: 1 }).catch(() => {});
      await page.waitForTimeout(600);
      await page.getByRole("button", { name: "Create invoice" }).click();
      await page.waitForURL(/\/invoices\/[0-9a-f-]{36}$/, { timeout: 120_000 });
      await page.waitForTimeout(1300);
      await page.getByRole("button", { name: "Review & detect discrepancies" }).click();
      await page.waitForTimeout(2600);
    },
    states.finance,
  );

  // Manager: open a case, move it under review, propose and approve a resolution.
  await record(
    "09-manager-case",
    async (page) => {
      await page.goto(`${BASE}/exceptions`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1100);
      await page.getByRole("link", { name: "New case" }).click();
      await page.waitForURL(/\/cases\/new/);
      await page.waitForTimeout(1100);
      await page.locator('input[type="checkbox"]').first().check();
      await page.getByLabel("Summary").click();
      await page.getByLabel("Summary").pressSequentially("Short delivery on video demo order", { delay: 28 });
      await page.waitForTimeout(450);
      await page.getByRole("button", { name: "Create case" }).click();
      await page.waitForURL(/\/cases\/[0-9a-f-]{36}$/, { timeout: 120_000 });
      caseUrl = new URL(page.url()).pathname;
      await page.waitForTimeout(1600);

      await page.getByRole("button", { name: "Under Review" }).click().catch(() => {});
      await page.waitForTimeout(1500);
      await page.getByRole("button", { name: "Propose resolution" }).click().catch(() => {});
      await page.waitForTimeout(1600);
      await page.getByRole("button", { name: "Approve" }).first().click().catch(() => {});
      await page.waitForTimeout(2000);
    },
    states.manager,
  );

  // Finance: verify the approved resolution on that case.
  await record(
    "10-finance-verify",
    async (page) => {
      if (!caseUrl) throw new Error("no case url");
      await page.goto(`${BASE}${caseUrl}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1400);
      await page.getByRole("button", { name: "Verify" }).first().click();
      await page.waitForTimeout(2400);
    },
    states.finance,
  );

  await record("11-supplier", async (page) => {
    await login(page, "supplier", { supplier: true });
    await page.waitForTimeout(800);
    const firstCase = page.locator('a[href^="/supplier/cases/"]').first();
    if (await firstCase.count()) {
      await firstCase.click();
      await page.waitForURL(/\/supplier\/cases\//);
      await page.waitForTimeout(1200);
      const box = page.getByLabel("Message").first();
      await box.click();
      await box.pressSequentially("We will ship the remaining units tomorrow.", { delay: 28 });
      await page.waitForTimeout(450);
      await page.getByRole("button", { name: "Send response" }).click();
      await page.waitForTimeout(2400);
    }
  });

  await browser.close();
  const session = { poNumber: PO_NUMBER, invoiceNumber: INVOICE_NUMBER, caseUrl, marks };
  await writeFile(path.join(REC, "session.json"), JSON.stringify(session, null, 2), "utf8");
  console.log(JSON.stringify(session, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
