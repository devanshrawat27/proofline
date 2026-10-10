import { Camera, FileText, ReceiptText, CheckCircle2 } from "lucide-react";
import { Reveal } from "./reveal";
import { StatusBadge } from "@/components/ui/status-badge";

const metrics = [
  { label: "Ordered", value: "100", unit: "pcs", tone: "text-ink" },
  { label: "Received", value: "94", unit: "pcs", tone: "text-warn" },
  { label: "Damaged", value: "2", unit: "of received", tone: "text-critical" },
  { label: "Invoiced", value: "100", unit: "pcs", tone: "text-info" },
];

const evidence = [
  { icon: FileText, label: "Purchase order", detail: "PO-4471 · line 3" },
  { icon: Camera, label: "Receiving photo", detail: "2 images · 14 Oct" },
  { icon: ReceiptText, label: "Supplier invoice", detail: "INV-9021" },
];

const timeline = [
  { title: "Receipt submitted", detail: "94 received · 2 damaged", tone: "done" as const },
  { title: "Discrepancy flagged", detail: "Deterministic rule: quantity", tone: "active" as const },
  { title: "Awaiting review", detail: "Assign owner to continue", tone: "pending" as const },
];

export function CasePreview() {
  return (
    <section id="product" className="py-16 sm:py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">One discrepancy, end to end</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          From mismatch to evidence-backed case
        </h2>
        <p className="mt-3 text-base text-subtle">
          Every value traces back to its source. Damaged units are a subset of received — they are never
          double-counted as missing.
        </p>
      </Reveal>

      <Reveal className="mt-10">
        <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-raised">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4"
          >
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-ink">Case PF-1042</h3>
              <span className="rounded-full border border-line bg-app px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-subtle">
                Example
              </span>
            </div>
            <StatusBadge tone="warning">Needs review</StatusBadge>
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-line p-6 md:border-b-0 md:border-r">
              <p className="text-sm font-medium text-ink">LED Driver 12W · quantity mismatch</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-line bg-app px-3.5 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">{metric.label}</p>
                    <p className={`mt-1 text-2xl font-semibold tabular-nums ${metric.tone}`}>{metric.value}</p>
                    <p className="text-[11px] text-subtle">{metric.unit}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-warn/20 bg-warn-surface px-4 py-3 text-xs text-warn">
                PO line says 100; receipt totals 94 (2 damaged); invoice line says 100. Short delivery flagged for review.
              </div>
            </div>

            <div className="grid content-start gap-5 p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Evidence</p>
                <ul className="mt-2 space-y-2">
                  {evidence.map((item) => (
                    <li key={item.label} className="flex items-center gap-3 rounded-xl border border-line bg-app px-3 py-2">
                      <item.icon className="h-4 w-4 text-brand" aria-hidden />
                      <span className="text-sm font-medium text-ink">{item.label}</span>
                      <span className="ml-auto text-xs text-subtle">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">Timeline</p>
                <ol className="mt-2 space-y-3">
                  {timeline.map((item) => (
                    <li key={item.title} className="flex gap-3">
                      <span
                        className={
                          item.tone === "active"
                            ? "mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-warn text-white"
                            : "mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-line bg-surface text-subtle"
                        }
                      >
                        {item.tone === "done" ? <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden /> : null}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <p className="text-xs text-subtle">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
