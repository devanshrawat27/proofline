"use client";

import { useReducedMotion } from "framer-motion";

/** Static, poster-quality backdrop: soft depth + a stylized crate + scan sweep. */
export function SceneBackdrop({ withScan = true }: { withScan?: boolean }) {
  const reduce = useReducedMotion();
  const showScan = withScan && !reduce;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#ffffff_0%,#eef4ef_45%,#e3ece6_100%)]" />
      <div className="absolute inset-x-10 bottom-6 h-24 rounded-[100%] bg-brand/10 blur-2xl" />

      <svg
        viewBox="0 0 320 320"
        className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_28px_40px_rgba(16,75,59,0.28)]"
        aria-hidden
      >
        <defs>
          <linearGradient id="boxFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d8bb90" />
            <stop offset="1" stopColor="#c19f72" />
          </linearGradient>
          <linearGradient id="boxTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e6cfa9" />
            <stop offset="1" stopColor="#d3b489" />
          </linearGradient>
        </defs>
        <path d="M60 120 L160 74 L260 120 L160 168 Z" fill="url(#boxTop)" />
        <path d="M60 120 L160 168 L160 246 L60 198 Z" fill="url(#boxFront)" />
        <path d="M260 120 L160 168 L160 246 L260 198 Z" fill="#b4936a" />
        <path d="M118 99 L160 120 L160 196 L118 175 Z" fill="#176b52" opacity="0.9" />
        <path d="M202 99 L160 120 L160 196 L202 175 Z" fill="#176b52" opacity="0.75" />
        <path d="M150 158 L160 162 L160 200 L150 196 Z" fill="#104b3b" opacity="0.5" />
        <rect x="132" y="150" width="56" height="34" rx="4" fill="#f5f7f5" />
        <rect x="140" y="160" width="40" height="4" rx="2" fill="#176b52" />
        <rect x="140" y="170" width="28" height="4" rx="2" fill="#d6f36a" />
      </svg>

      {showScan ? (
        <div className="absolute inset-x-8 top-1/3 h-px animate-scan bg-gradient-to-r from-transparent via-brand-lime to-transparent opacity-70" />
      ) : null}
    </div>
  );
}
