import * as React from "react";
import { cn } from "@/lib/utils";

type AlertTone = "error" | "success" | "info";

const tones: Record<AlertTone, string> = {
  error: "border-critical/20 bg-critical-surface text-critical",
  success: "border-success/20 bg-success-surface text-success",
  info: "border-info/20 bg-info-surface text-info",
};

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: AlertTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-xl border px-4 py-3 text-sm", tones[tone], className)}
    >
      {children}
    </div>
  );
}
