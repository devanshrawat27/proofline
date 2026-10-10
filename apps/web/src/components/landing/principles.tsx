import { Link2, ShieldCheck, Sigma, Users } from "lucide-react";
import { Reveal } from "./reveal";

const principles = [
  {
    icon: Link2,
    title: "Source-linked evidence",
    body: "Every flagged difference points back to the exact purchase order line, receiving entry or invoice field that produced it.",
  },
  {
    icon: Users,
    title: "Human review for AI-extracted fields",
    body: "Documents are extracted with confidence and correction paths. Nothing is treated as verified until a person confirms it.",
  },
  {
    icon: Sigma,
    title: "Deterministic calculations and approvals",
    body: "Quantities, tolerances and state transitions are enforced in code — decisions never rest on a model's word.",
  },
  {
    icon: ShieldCheck,
    title: "Tenant-isolated and auditable",
    body: "Access is scoped per organization and checked on the server, and important actions are recorded with actor and time.",
  },
];

export function Principles() {
  return (
    <section id="principles" className="py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">How it is built</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Evidence first, always
          </h2>
          <p className="mt-3 text-base text-subtle">
            Proofline is designed so disagreements are settled with records, not opinions — and so the
            people accountable stay in control of every approval.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.06}>
              <div className="h-full rounded-2xl border border-line bg-surface p-5 shadow-card">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm text-subtle">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
