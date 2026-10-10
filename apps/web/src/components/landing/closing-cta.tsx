import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function ClosingCta() {
  return (
    <section className="py-8 sm:py-12">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-brand/20 bg-brand px-6 py-12 text-center shadow-scene sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_50%_-20%,rgba(214,243,106,0.22),transparent_60%)]"
          />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Know what arrived. Prove what needs resolving.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base text-white/80">
            Turn receiving mismatches into evidence-backed cases your team can actually close.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-brand-deep hover:bg-brand-tint">
                Get started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost" className="border border-white/30 text-white hover:bg-white/10">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
