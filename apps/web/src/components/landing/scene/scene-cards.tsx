"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocCard({
  title,
  icon: Icon,
  position,
  delay = 0,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  position: "overlay" | "stack";
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const float =
    position === "overlay" && !reduce
      ? {
          animate: { y: [0, -9, 0] },
          transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const, delay },
        }
      : {};

  return (
    <motion.div
      {...float}
      className={cn(
        "rounded-2xl border border-line bg-surface/95 p-3.5 shadow-float backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-tint text-brand-deep">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-subtle">
          {title}
        </span>
      </div>
      <div className="mt-2.5">{children}</div>
    </motion.div>
  );
}

export function ValueRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] text-subtle">{label}</span>
      <span className="text-lg font-semibold tabular-nums leading-none text-ink">{value}</span>
      {hint ? <span className="text-[10px] text-subtle">{hint}</span> : null}
    </div>
  );
}

export function MarkerDot({
  label,
  tone,
  className,
}: {
  label: string;
  tone: "amber" | "green";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const palette =
    tone === "amber"
      ? { dot: "bg-warn", ring: "bg-warn/20", text: "text-warn" }
      : { dot: "bg-success", ring: "bg-success/20", text: "text-success" };
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full",
            palette.ring,
            !reduce && "animate-ping",
          )}
        />
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", palette.dot)} />
      </span>
      <span className={cn("text-[11px] font-medium", palette.text)}>{label}</span>
    </span>
  );
}
