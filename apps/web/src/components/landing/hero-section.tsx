import Link from "next/link";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";
import { MetricsStrip } from "./metrics-strip";
import { HeroReconciliationScene } from "./scene/verification-scene";

export function HeroSection() {
  return (
    <section id="top" className="relative pb-12 pt-8 sm:pb-16 sm:pt-12">
      <div className="mx-auto grid max-w-container items-center gap-10 px-5 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
        <Reveal className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-tint px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-lime" aria-hidden />
            Supplier delivery exception management
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Every delivery.
            <br />
            Verified.
            <br />
            <span className="text-brand">No more disputes.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-subtle sm:text-lg">
            Compare purchase orders, receiving records, and supplier invoices with AI. Identify
            mismatches, track evidence, collaborate with suppliers, and close cases faster.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button size="lg">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="secondary">
                <PlayCircle className="h-4 w-4 text-brand" />
                See how it works
              </Button>
            </a>
          </div>
          <MetricsStrip />
        </Reveal>

        <Reveal delay={0.1} y={28} className="min-w-0">
          <HeroReconciliationScene />
        </Reveal>
      </div>
    </section>
  );
}
