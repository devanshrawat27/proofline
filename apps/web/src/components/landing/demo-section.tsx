import { ExternalLink, PlayCircle } from "lucide-react";
import { Reveal } from "./reveal";

const VIDEO_ID = "QUia9HSccXc";

export function DemoSection() {
  return (
    <section id="demo" className="py-16 sm:py-24">
      <Reveal>
        <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-8 sm:px-10 sm:pt-10">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
                Product demo
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                The full flow, end to end — 2 minutes
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-subtle sm:text-base">
                A purchase order is issued, the warehouse records the delivery, finance bills it, the
                engine flags four discrepancies, and the case is resolved and verified — across four
                different roles.
              </p>
            </div>
            <a
              href={`https://youtu.be/${VIDEO_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-deep transition-colors hover:text-brand"
            >
              Open on YouTube <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <div className="mt-6 aspect-video w-full border-t border-line bg-[#07130e]">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0`}
              title="Proofline product demo"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <p className="flex items-center gap-2 px-6 py-4 text-xs text-subtle sm:px-10">
            <PlayCircle className="h-4 w-4 text-brand" aria-hidden />
            Recorded from the live app with real accounts, real purchase orders and real
            discrepancies.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
