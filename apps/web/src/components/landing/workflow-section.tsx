import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

const steps = [
  { n: "1", title: "Receive", body: "Record what actually arrived with photos and quantities." },
  { n: "2", title: "Verify", body: "AI matches PO, receipt and invoice. Flags mismatches." },
  { n: "3", title: "Resolve", body: "Collaborate with supplier and close with verified resolution." },
];

function VisualSequence() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-2">
      <div className="flex h-36 items-center justify-center">
        <Image
          src="/images/workflow/01-receive-box-scanner.png"
          alt="A parcel being scanned with a barcode scanner"
          width={720}
          height={480}
          className="h-32 w-auto object-contain drop-shadow-sm"
        />
      </div>

      <ArrowRight className="hidden h-5 w-5 shrink-0 text-brand sm:block" aria-hidden />
      <ArrowRight className="h-4 w-4 shrink-0 rotate-90 text-brand sm:hidden" aria-hidden />

      <div className="flex h-36 items-center justify-center">
        <Image
          src="/images/workflow/02-verify-three-way-match.png"
          alt="A purchase order, receipt and invoice matched against each other"
          width={760}
          height={380}
          className="h-28 w-auto object-contain drop-shadow-sm"
        />
      </div>

      <ArrowRight className="hidden h-5 w-5 shrink-0 text-brand sm:block" aria-hidden />
      <ArrowRight className="h-4 w-4 shrink-0 rotate-90 text-brand sm:hidden" aria-hidden />

      <div className="flex h-36 items-center justify-center">
        <Image
          src="/images/workflow/03-resolve-supplier-case.png"
          alt="A resolved supplier case with a verified status"
          width={720}
          height={480}
          className="h-32 w-auto object-contain drop-shadow-sm"
        />
      </div>
    </div>
  );
}

export function WorkflowSection() {
  return (
    <section id="how" className="py-16 sm:py-24">
      <div className="overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <Reveal className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              How Proofline works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              From delivery to resolution, in one place.
            </h2>
            <p className="mt-4 text-base text-subtle">
              A simple, structured workflow that keeps everyone aligned with evidence.
            </p>
            <a href="#product" className="mt-6 inline-block">
              <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-deep px-5 text-sm font-medium text-white transition-colors hover:bg-brand">
                Explore the product <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0">
            <VisualSequence />
          </Reveal>
        </div>

        <div className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.08}>
              <div className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-subtle">{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
