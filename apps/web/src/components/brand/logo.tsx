import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden
      className={cn("h-7 w-7", className)}
      fill="none"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="#176B52" />
      {/* receipt corner */}
      <path
        d="M9 8.5h14v15l-3.5-2-3.5 2-3.5-2L9 23.5v-15Z"
        fill="none"
        stroke="#E8F4EE"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* check */}
      <path
        d="M12 15.2l2.6 2.6L20 12.8"
        stroke="#D6F36A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-tight text-ink">goodsignal</span>
    </span>
  );
}
