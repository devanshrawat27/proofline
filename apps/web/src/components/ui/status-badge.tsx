import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "critical" | "info" | "neutral";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-surface text-success",
  warning: "bg-warn-surface text-warn",
  critical: "bg-critical-surface text-critical",
  info: "bg-info-surface text-info",
  neutral: "bg-app text-subtle border border-line",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
