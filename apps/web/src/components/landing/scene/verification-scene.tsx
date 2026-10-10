"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileText, PackageCheck, ReceiptText } from "lucide-react";
import { DocCard, MarkerDot, ValueRow } from "./scene-cards";
import { SceneBackdrop } from "./scene-fallback";

const VerificationCanvas = dynamic<{ active?: boolean }>(
  () => import("./verification-canvas"),
  { ssr: false, loading: () => null },
);

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

export function VerificationScene() {
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

  return (
    <div ref={containerRef}>
      {use3d ? <OverlayLayout active={active} /> : <StaticLayout />}
    </div>
  );
}

function OverlayLayout({ active }: { active: boolean }) {
  return (
    <div
      className="relative h-[500px] w-full overflow-hidden rounded-3xl border border-line shadow-scene lg:h-[560px]"
      role="img"
      aria-label="Illustration comparing a purchase order, receiving record and supplier invoice for the same delivery"
    >
      <SceneBackdrop />

      <VerificationCanvas active={active} />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <g
          fill="none"
          stroke="#176b52"
          strokeWidth="0.25"
          strokeOpacity="0.35"
          className="motion-safe:animate-dash"
        >
          <path d="M20 20 C 34 30, 42 42, 50 50" strokeDasharray="1.6 1.8" />
          <path d="M24 82 C 36 72, 44 60, 50 50" strokeDasharray="1.6 1.8" />
          <path d="M82 28 C 70 36, 60 44, 50 50" strokeDasharray="1.6 1.8" />
        </g>
      </svg>

      <span className="absolute right-3 top-3 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-subtle backdrop-blur">
        Example data
      </span>

      <DocCard
        title="Purchase Order"
        icon={FileText}
        position="overlay"
        delay={0}
        className="absolute left-4 top-[8%] w-[196px]"
      >
        <ValueRow label="Ordered" value="100" />
      </DocCard>

      <DocCard
        title="Receiving Record"
        icon={PackageCheck}
        position="overlay"
        delay={0.5}
        className="absolute bottom-[10%] left-8 w-[210px]"
      >
        <div className="space-y-2">
          <ValueRow label="Received" value="94" />
          <ValueRow label="Damaged" value="2" hint="of received" />
        </div>
      </DocCard>

      <DocCard
        title="Supplier Invoice"
        icon={ReceiptText}
        position="overlay"
        delay={1}
        className="absolute right-4 top-[17%] w-[196px]"
      >
        <ValueRow label="Invoiced" value="100" />
      </DocCard>

      <MarkerDot
        label="6 units unaccounted"
        tone="amber"
        className="absolute left-[40%] top-[46%] -translate-x-1/2"
      />
      <MarkerDot label="Evidence linked" tone="green" className="absolute bottom-[26%] right-[12%]" />

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <span className="inline-flex items-center gap-2 rounded-full border border-warn/20 bg-warn-surface px-3 py-1 text-xs font-medium text-warn shadow-card">
          <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden />
          Review required
        </span>
      </div>
    </div>
  );
}

function StaticLayout() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-scene"
      role="img"
      aria-label="Illustration comparing a purchase order, receiving record and supplier invoice for the same delivery"
    >
      <div className="relative h-44 sm:h-52">
        <SceneBackdrop />
        <span className="absolute right-3 top-3 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-subtle backdrop-blur">
          Example data
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <DocCard title="Purchase Order" icon={FileText} position="stack">
          <ValueRow label="Ordered" value="100" />
        </DocCard>
        <DocCard title="Receiving Record" icon={PackageCheck} position="stack">
          <div className="space-y-2">
            <ValueRow label="Received" value="94" />
            <ValueRow label="Damaged" value="2" hint="of received" />
          </div>
        </DocCard>
        <DocCard title="Supplier Invoice" icon={ReceiptText} position="stack">
          <ValueRow label="Invoiced" value="100" />
        </DocCard>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <MarkerDot label="6 units unaccounted" tone="amber" />
          <MarkerDot label="Evidence linked" tone="green" />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-warn/20 bg-warn-surface px-3 py-1 text-xs font-medium text-warn">
          <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden />
          Review required
        </span>
      </div>
    </div>
  );
}
