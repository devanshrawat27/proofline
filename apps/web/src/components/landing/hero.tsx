import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { VerificationScene } from "./scene/verification-scene";

const trust = ["Evidence-first workflows", "Human-reviewed AI", "Auditable resolution"];

export function Hero() {
  return (
    <section className="relative pb-14 pt-10 sm:pb-20 sm:pt-14">
      <div className="mx-auto grid max-w-container items-center gap-10 px-5 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            Supplier delivery verification
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Every delivery.
            <br />
            Every discrepancy.
            <br />
            <span className="text-brand">Proven.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-subtle sm:text-lg">
            Compare what was ordered, what arrived, and what was billed. Turn mismatches into
            evidence-backed cases your team can resolve.
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
          <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-subtle">
            {trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-brand-lime" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} y={28}>
          <VerificationScene />
        </Reveal>
      </div>
    </section>
  );
}
