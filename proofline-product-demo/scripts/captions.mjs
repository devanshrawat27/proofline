// Renders editorial caption overlays (transparent PNG) + hook/end cards.
import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "captions");
const BASE = process.argv[2] ?? "https://proofline-inky.vercel.app";

const SCENES = [
  { id: "01", kicker: "Landing", title: "Every delivery. Verified.", sub: "Order → receive → bill → detect → resolve → verify." },
  { id: "02", kicker: "Procurement manager", title: "Procurement manager signs in", sub: "Manish — orders, cases, reports, members." },
  { id: "03", kicker: "Live workspace", title: "One view of every exception", sub: "Open cases, disputed value, discrepancies by type." },
  { id: "04", kicker: "Step 1 · Order", title: "Create and issue a PO", sub: "Supplier, line items, integer minor-unit money." },
  { id: "05", kicker: "Warehouse receiver", title: "Warehouse receiver signs in", sub: "Ravi — receiving-only navigation. No invoices or cases." },
  { id: "06", kicker: "Step 2 · Receive", title: "Record the delivery", sub: "Received, damaged, delivery reference — then submit." },
  { id: "07", kicker: "Finance", title: "Finance signs in", sub: "Fatima — invoices, discrepancies, verification." },
  { id: "08", kicker: "Step 3 · Bill", title: "Bill against the order", sub: "The invoice is matched line-by-line to the PO." },
  { id: "09", kicker: "Step 4 · Detect", title: "The engine flags four issues", sub: "Quantity, over-delivery, price and damage — expected vs actual." },
  { id: "10", kicker: "Step 5 · Dispute", title: "Open a case from an exception", sub: "Guarded transitions and a full audit timeline." },
  { id: "11", kicker: "Step 6 · Review", title: "Propose a resolution", sub: "Open → under review → credit note proposed." },
  { id: "12", kicker: "Step 7 · Approve", title: "Approve the credit note", sub: "Every transition is written to the case timeline." },
  { id: "13", kicker: "Step 8 · Verify", title: "Finance verifies", sub: "Verified by a second role — the case resolves." },
  { id: "14", kicker: "Step 9 · Supplier", title: "Supplier responds", sub: "Their own identity — only their own cases." },
];

const total = SCENES.length;

function shell(body, { opaque = false, index = 0 } = {}) {
  const bars = Array.from({ length: total })
    .map((_, i) => `<i><span style="transform:scaleX(${i < index ? 1 : i === index ? 1 : 0})"></span></i>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8" />
  <style>
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:${opaque ? "#07130e" : "transparent"}}
    #root{position:relative;width:1920px;height:1080px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}
    .scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(5,15,11,.92) 0%,rgba(5,15,11,.42) 28%,rgba(5,15,11,0) 55%)}
    .body{position:absolute;left:72px;bottom:96px;max-width:1040px}
    .kicker{display:inline-flex;align-items:center;gap:10px;font-size:17px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#d6f36a}
    .kicker:before{content:"";width:26px;height:2px;background:#d6f36a}
    .title{margin-top:16px;font-size:64px;line-height:1.05;font-weight:640;letter-spacing:-.025em}
    .sub{margin-top:14px;font-size:23px;line-height:1.45;color:rgba(255,255,255,.72);max-width:900px}
    .progress{position:absolute;left:72px;right:72px;bottom:44px;display:flex;gap:7px}
    .progress i{flex:1;height:3px;border-radius:99px;background:rgba(255,255,255,.16);overflow:hidden;position:relative}
    .progress i span{position:absolute;inset:0;background:#d6f36a;transform-origin:left center}
    .step{position:absolute;right:72px;bottom:52px;font-size:15px;letter-spacing:.16em;color:rgba(255,255,255,.45);font-variant-numeric:tabular-nums}
  </style></head><body><div id="root">${body}</div></body></html>`;
}

function captionHtml(scene, index) {
  return shell(
    `<div class="scrim"></div>
     <div class="body">
       <div class="kicker">${scene.id} · ${scene.kicker}</div>
       <div class="title">${scene.title}</div>
       <div class="sub">${scene.sub}</div>
     </div>
     <div class="progress">${Array.from({ length: total })
       .map((_, i) => `<i><span style="transform:scaleX(${i <= index ? 1 : 0})"></span></i>`)
       .join("")}</div>
     <div class="step">${scene.id} / ${String(total).padStart(2, "0")}</div>`,
  );
}

const hookHtml = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(70% 80% at 50% 0%,rgba(23,107,82,.5),transparent 60%),linear-gradient(165deg,#0a1f18 0%,#07130e 62%)">
  <div style="width:1280px">
    <div style="font-size:17px;letter-spacing:.24em;text-transform:uppercase;color:rgba(214,243,106,.9);margin-bottom:34px">Supplier delivery exception management</div>
    <div style="font-size:92px;line-height:1.06;font-weight:640;letter-spacing:-.03em">100 ordered.</div>
    <div style="font-size:92px;line-height:1.06;font-weight:640;letter-spacing:-.03em">94 arrived.</div>
    <div style="font-size:92px;line-height:1.06;font-weight:640;letter-spacing:-.03em;color:rgba(255,255,255,.55)">100 billed.</div>
    <div style="margin-top:40px;font-size:40px;font-weight:600;letter-spacing:-.02em">Proofline reconciles the gap — <span style="color:#d6f36a">with evidence.</span></div>
    <div style="margin-top:16px;font-size:22px;color:rgba(255,255,255,.62)">Purchase orders, receiving records and invoices, matched deterministically.</div>
  </div>
</div>`;

const endHtml = (logo) => `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:radial-gradient(55% 65% at 50% 24%,rgba(23,107,82,.55),transparent 66%),linear-gradient(160deg,#0b1f18 0%,#07130e 62%)">
  <img src="${logo}" style="width:104px;height:104px;object-fit:contain" />
  <div style="font-size:86px;letter-spacing:-.035em;font-weight:700">Proofline</div>
  <div style="font-size:27px;color:rgba(255,255,255,.7)">Every delivery. Every discrepancy. Proven.</div>
  <div style="margin-top:8px;font-size:23px;font-weight:600;color:#d6f36a">${BASE.replace(/^https?:\/\//, "")}</div>
</div>`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

  for (const [index, scene] of SCENES.entries()) {
    await page.setContent(captionHtml(scene, index), { waitUntil: "load" });
    await page.screenshot({ path: path.join(OUT, `${scene.id}.png`), omitBackground: true });
    console.log(`caption ${scene.id}`);
  }

  await page.setContent(shell(hookHtml, { opaque: true }), { waitUntil: "load" });
  await page.screenshot({ path: path.join(OUT, "hook.png") });

  const logo = `data:image/png;base64,${(await readFile(path.join(ROOT, "assets", "logo.png"))).toString("base64")}`;
  await page.setContent(shell(endHtml(logo), { opaque: true }), { waitUntil: "load" });
  await page.screenshot({ path: path.join(OUT, "end.png") });
  await browser.close();

  await writeFile(path.join(OUT, "scenes.json"), JSON.stringify(SCENES, null, 2));
  console.log("captions done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
