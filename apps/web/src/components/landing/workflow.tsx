import { ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import { Reveal } from "./reveal";

const stages = [
  {
    icon: ClipboardCheck,
    step: "01",
    title: "Receive",
    body: "Record actual quantities, partial deliveries, damaged items and photos — on any device, in the yard.",
    visual: (
      <div className="rounded-xl border border-line bg-app p-3">
        <p className="text-[11px] font-medium text-subtle">Receiving · LED Driver 12W</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-subtle">Received</span>
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-surface text-subtle">−</span>
            <span className="w-9 text-center text-sm font-semibold tabular-nums text-ink">94</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-surface text-subtle">+</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-md bg-warn-surface px-2 py-0.5 text-[11px] font-medium text-warn">2 damaged</span>
          <span className="rounded-md bg-brand-tint px-2 py-0.5 text-[11px] font-medium text-brand-deep">2 photos</span>
        </div>
      </div>
    ),
  },
  {
    icon: FileSearch,
    step: "02",
    title: "Verify",
    body: "Compare purchase order, receipt and invoice. Deterministic rules flag every mismatch with its source value.",
    visual: (
      <div className="rounded-xl border border-line bg-app p-3">
        <p className="text-[11px] font-medium text-subtle">Cross-check · PF-1042</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            { l: "Ordered", v: "100" },
            { l: "Received", v: "94" },
            { l: "Invoiced", v: "100" },
          ].map((c) => (
            <div key={c.l} className="rounded-lg border border-line bg-surface py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-subtle">{c.l}</p>
              <p className="text-sm font-semibold tabular-nums text-ink">{c.v}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-md bg-warn-surface px-2 py-1 text-[11px] font-medium text-warn">
          Quantity mismatch flagged
        </div>
      </div>
    ),
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Resolve",
    body: "Build a case with evidence, collaborate with the supplier, and verify the outcome before it is closed.",
    visual: (
      <div className="rounded-xl border border-line bg-app p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-subtle">Case PF-1042</p>
          <span className="rounded-full bg-info-surface px-2 py-0.5 text-[11px] font-medium text-info">
            Sent to supplier
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] text-subtle">PO</span>
          <span className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] text-subtle">Receiving photo</span>
          <span className="rounded-md border border-line bg-surface px-2 py-0.5 text-[11px] text-subtle">Invoice</span>
        </div>
        <div className="mt-2 rounded-md bg-brand-tint px-2 py-1 text-[11px] font-medium text-brand-deep">
          Awaiting supplier response
        </div>
      </div>
    ),
  },
];

export function Workflow() {
  return (
    <section id="how" className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">The Proofline workflow</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Receive → Verify → Resolve
        </h2>
        <p className="mt-3 text-base text-subtle">
          One continuous loop from the loading bay to a verified resolution — with proof attached to every step.
        </p>
      </Reveal>

      <div className="relative mt-12">
        <div
          aria-hidden
          className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-line to-transparent lg:block"
        />
        <ol className="grid gap-6 lg:grid-cols-3">
          {stages.map((stage, index) => (
            <Reveal key={stage.title} delay={index * 0.08}>
              <li className="relative rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-card">
                    <stage.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                      Step {stage.step}
                    </span>
                    <h3 className="text-base font-semibold text-ink">{stage.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-subtle">{stage.body}</p>
                <div className="mt-4">{stage.visual}</div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
