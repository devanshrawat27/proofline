"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileText, PackageCheck, ReceiptText } from "lucide-react";
import { DocCard, DocLine, MismatchPanel } from "./scene-cards";
import { SceneBackdrop } from "./scene-fallback";

const HeroCanvas = dynamic<{ active?: boolean }>(() => import("./verification-canvas"), {
  ssr: false,
  loading: () => null,
});

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export function HeroReconciliationScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [use3d, setUse3d] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    setUse3d(!reduce && !mobile && hasWebGL());
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(Boolean(entry?.isIntersecting) && !document.hidden),
      { threshold: 0.05 },
    );
    observer.observe(node);
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <div ref={containerRef}>{use3d ? <OverlayLayout active={active} /> : <StaticLayout />}</div>;
}

function OverlayLayout({ active }: { active: boolean }) {
  return (
    <div
      className="relative h-[500px] w-full lg:h-[540px]"
      role="img"
      aria-label="A delivered parcel reconciled against a purchase order, receiving record and supplier invoice, showing an AI-detected quantity mismatch"
    >
      <SceneBackdrop showCrate={false} />
      <div className="absolute inset-x-6 inset-y-2 sm:inset-x-12">
        <HeroCanvas active={active} />
      </div>

      {/* Purposeful sweep: records are scanned, then the mismatch is surfaced. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(214,243,106,0.14),transparent)] bg-[length:100%_34%] bg-no-repeat motion-safe:animate-sweep" />
      </div>

      <DocCard
        title="Purchase Order"
        reference="PO-1042"
        icon={FileText}
        position="overlay"
        className="absolute left-2 top-[6%] w-[196px] sm:left-4"
      >
        <DocLine name="LED Driver 12W" qty="100 pcs" price="₹500" />
      </DocCard>

      <DocCard
        title="Supplier Invoice"
        reference="INV-5562"
        icon={ReceiptText}
        position="overlay"
        delay={0.6}
        className="absolute bottom-[10%] left-4 w-[204px] sm:left-8"
      >
        <div className="space-y-1.5">
          <DocLine name="LED Driver 12W" qty="100 pcs" price="₹500" />
          <div className="flex items-center justify-between border-t border-line pt-1.5 text-[11px]">
            <span className="text-subtle">Total</span>
            <span className="text-sm font-semibold tabular-nums text-ink">₹50,000</span>
          </div>
        </div>
      </DocCard>

      <DocCard
        title="Receiving Record"
        reference="REC-7781"
        icon={PackageCheck}
        position="overlay"
        delay={1.2}
        className="absolute right-2 top-[6%] w-[196px] sm:right-4"
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-subtle">Received</span>
            <span className="font-medium tabular-nums text-ink">94</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-subtle">Damaged</span>
            <span className="font-medium tabular-nums text-critical">2 pcs</span>
          </div>
        </div>
      </DocCard>

      <MismatchPanel className="absolute bottom-[10%] right-2 w-[228px] sm:right-4" />
    </div>
  );
}

function StaticLayout() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
      role="img"
      aria-label="A delivered parcel reconciled against a purchase order, receiving record and supplier invoice, showing an AI-detected quantity mismatch"
    >
      <div className="relative h-48 sm:h-56">
        <SceneBackdrop />
        <span className="absolute left-3 top-3 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-subtle backdrop-blur">
          Example data
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <DocCard title="Purchase Order" reference="PO-1042" icon={FileText} position="stack">
          <DocLine name="LED Driver 12W" qty="100 pcs" price="₹500" />
        </DocCard>
        <DocCard title="Receiving Record" reference="REC-7781" icon={PackageCheck} position="stack">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-subtle">Received</span>
              <span className="font-medium tabular-nums text-ink">94</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-subtle">Damaged</span>
              <span className="font-medium tabular-nums text-critical">2 pcs</span>
            </div>
          </div>
        </DocCard>
        <DocCard title="Supplier Invoice" reference="INV-5562" icon={ReceiptText} position="stack">
          <div className="space-y-1.5">
            <DocLine name="LED Driver 12W" qty="100 pcs" price="₹500" />
            <div className="flex items-center justify-between border-t border-line pt-1.5 text-[11px]">
              <span className="text-subtle">Total</span>
              <span className="text-sm font-semibold tabular-nums text-ink">₹50,000</span>
            </div>
          </div>
        </DocCard>
      </div>

      <div className="px-4 pb-4">
        <MismatchPanel />
      </div>
    </div>
  );
}
