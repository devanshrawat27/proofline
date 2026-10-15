"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { apiFetch } from "@/lib/api";

export function SupplierShell({
  supplierName,
  userName,
  unreadCount = 0,
  children,
}: {
  supplierName: string;
  userName: string;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/v1/supplier/auth/logout", { method: "POST" });
    } finally {
      router.push("/supplier/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-surface px-4 md:px-6">
        <div className="flex items-center gap-3">
          <LogoMark className="h-6 w-6" />
          <div>
            <p className="text-sm font-semibold text-ink">{supplierName}</p>
            <p className="text-xs text-subtle">Supplier portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/supplier/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-subtle transition-colors hover:bg-app hover:text-ink"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          >
            <Bell className="h-4 w-4" aria-hidden />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
          <span className="hidden text-sm text-subtle sm:block">{userName}</span>
          <button
            onClick={logout}
            disabled={loggingOut}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-line px-3 text-sm text-subtle transition-colors hover:bg-app hover:text-ink disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">{children}</main>
    </div>
  );
}
