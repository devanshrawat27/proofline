import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileSearch, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Receive",
    body: "Record what actually arrived — full or partial, with damaged quantities and photo evidence, even on a phone.",
  },
  {
    icon: FileSearch,
    title: "Verify",
    body: "Compare the purchase order, receipt and supplier invoice. Deterministic rules flag every mismatch with its source.",
  },
  {
    icon: ShieldCheck,
    title: "Resolve",
    body: "Turn mismatches into evidence-backed cases, collaborate with the supplier, and close with a verified resolution.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-app">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Wordmark />
        <nav className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-subtle">
              Supplier delivery exception management
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
              Know what arrived.
              <br />
              Prove what needs resolving.
            </h1>
            <p className="mt-5 max-w-lg text-base text-subtle">
              Compare purchase orders, receiving records, and supplier invoices. Turn mismatches into
              evidence-backed cases your team can actually close.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Get started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how">
                <Button size="lg" variant="secondary">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>

          <ProductPreview />
        </section>

        <section id="how" className="py-14">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-subtle">
            Receive → Verify → Resolve
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-line bg-surface p-6 shadow-card">
                <step.icon className="h-6 w-6 text-brand" aria-hidden />
                <h3 className="mt-4 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-subtle">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-2xl border border-line bg-surface p-8 shadow-card md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">Evidence first, always</h2>
            <p className="mt-2 text-sm text-subtle">
              Every suggestion links back to the source document, receiving entry, or user action.
              AI assists with extraction; deterministic code controls calculations, permissions and
              approvals. Nothing is resolved just because a supplier proposed a credit.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-subtle">
            <li className="rounded-xl bg-app px-4 py-3">Tenant-isolated organizations and supplier scoping</li>
            <li className="rounded-xl bg-app px-4 py-3">Immutable, auditable case history</li>
            <li className="rounded-xl bg-app px-4 py-3">Human review with confidence and correction paths</li>
          </ul>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-subtle">
        <p className="text-subtle">
          © {new Date().getFullYear()} Proofline. Every delivery. Every discrepancy. Proven.
        </p>
      </footer>
    </div>
  );
}

function ProductPreview() {
  const rows = [
    { label: "Ordered (PO)", value: "100", tone: "neutral" as const },
    { label: "Received", value: "94", tone: "warning" as const },
    { label: "Damaged", value: "2", tone: "critical" as const },
    { label: "Invoiced", value: "100", tone: "info" as const },
  ];
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-raised">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-subtle">Case GS-1042</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">LED Driver 12W — quantity mismatch</p>
        </div>
        <StatusBadge tone="warning">Needs review</StatusBadge>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-line bg-app px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">{row.label}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{row.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-brand-tint px-4 py-3 text-xs text-brand-deep">
        PO line says 100; receipt totals 94 (2 damaged); invoice line says 100. Short delivery flagged
        for review.
      </div>
    </div>
  );
}
