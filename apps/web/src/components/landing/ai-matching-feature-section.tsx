import { ArrowRight, FileText, PackageCheck, ReceiptText } from "lucide-react";
import { Reveal } from "./reveal";

const sources = [
  { icon: FileText, label: "PO-1042" },
  { icon: PackageCheck, label: "REC-7781" },
  { icon: ReceiptText, label: "INV-5562" },
];

const fields: Array<{ label: string; value: string; source: string; mismatch?: boolean }> = [
  { label: "Ordered quantity", value: "100", source: "PO-1042" },
  { label: "Received quantity", value: "94", source: "REC-7781", mismatch: true },
  { label: "Billed quantity", value: "100", source: "INV-5562" },
];

export function AIMatchingFeatureSection() {
  return (
    <section id="ai" className="relative w-full overflow-hidden bg-night text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_90%_at_8%_0%,rgba(214,243,106,0.14),transparent_55%),radial-gradient(50%_80%_at_98%_100%,rgba(23,107,82,0.45),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:44px_44px]"
      />

      <div className="relative mx-auto max-w-container px-5 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-lime">
              Built for real-world operations
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              AI that works with your team,
              <br />
              <span className="text-brand-lime">not instead of them.</span>
            </h2>
            <p className="mt-5 max-w-lg text-base text-white/75">
              Proofline extracts fields from invoices and documents, matches them against purchase
              orders and receipts, and shows exactly where the numbers diverge — every value keeps its
              source reference.
            </p>
            <a href="#how" className="mt-7 inline-block">
              <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-night transition-colors hover:bg-brand-tint">
                See how AI works <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                {sources.map((source, index) => (
                  <div key={source.label} className="flex flex-1 items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-brand-lime">
                      <source.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="hidden text-xs font-medium text-white/80 sm:block">{source.label}</span>
                    {index < sources.length - 1 ? (
                      <span className="ml-auto h-px flex-1 bg-gradient-to-r from-brand-lime/50 to-transparent" aria-hidden />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-night/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                  Field extraction &amp; matching
                </p>
                <ul className="mt-3 space-y-2">
                  {fields.map((field) => (
                    <li
                      key={field.label}
                      className={
                        field.mismatch
                          ? "flex items-center justify-between gap-3 rounded-lg border border-brand-lime/30 bg-brand-lime/10 px-3 py-2"
                          : "flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2"
                      }
                    >
                      <span className="text-xs text-white/75">{field.label}</span>
                      <span className="flex items-center gap-3">
                        {field.mismatch ? (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-brand-lime">
                            6 short
                          </span>
                        ) : null}
                        <span className="text-sm font-semibold tabular-nums text-white">{field.value}</span>
                        <span className="hidden text-[10px] text-white/40 sm:inline">{field.source}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-white/60">Each value links to its source document</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-lime">
                  View evidence <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
