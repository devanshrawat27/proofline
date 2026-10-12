import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/proofline-logo.png"
      alt=""
      width={96}
      height={96}
      priority
      aria-hidden
      className={cn("h-9 w-9 object-contain", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight text-ink">Proofline</span>
    </span>
  );
}
