"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocCard({
  title,
  reference,
  icon: Icon,
  position,
  delay = 0,
  className,
  children,
}: {
  title: string;
  reference?: string;
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
          animate: { y: [0, -4, 0] },
          transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const, delay },
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
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-semibold text-ink">{title}</p>
          {reference ? <p className="text-[10px] text-subtle">{reference}</p> : null}
        </div>
      </div>
      <div className="mt-2.5">{children}</div>
    </motion.div>
  );
}

export function DocLine({
  name,
  qty,
  price,
}: {
  name: string;
  qty?: string;
  price?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="truncate text-subtle">{name}</span>
      {qty ? <span className="tabular-nums text-subtle">{qty}</span> : null}
      {price ? <span className="tabular-nums font-medium text-ink">{price}</span> : null}
    </div>
  );
}

export function MismatchPanel({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const items = ["6 units missing", "2 units damaged", "Invoice billed for 100 units"];
  return (
    <motion.div
      {...(reduce
        ? {}
        : {
            animate: { y: [0, -4, 0] },
            transition: { duration: 9, repeat: Infinity, ease: "easeInOut" as const, delay: 0.4 },
          })}
      className={cn(
        "rounded-2xl border border-warn/25 bg-night-soft/95 p-3.5 pl-4 shadow-scene backdrop-blur",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-brand-lime/70",
        "relative",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-brand-lime" aria-hidden />
        <p className="text-[12px] font-semibold text-white">AI detected mismatches</p>
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[11.5px] text-white/90">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f87171]" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
