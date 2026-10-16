"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  FileText,
  FolderOpen,
  Gavel,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  ReceiptText,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import type { SessionContext } from "@/lib/server-api";
import { roleHasPermission } from "@proofline/shared-types";
import type { Permission } from "@proofline/shared-types";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Only shown when the signed-in role holds this permission. */
  permission?: Permission;
}

const NAV: NavItem[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/exceptions", label: "Exceptions", icon: AlertTriangle, permission: "discrepancy:read" },
  { href: "/cases", label: "Cases", icon: Gavel, permission: "case:read" },
  { href: "/purchase-orders", label: "Purchase Orders", icon: FileText, permission: "po:read" },
  { href: "/receiving", label: "Receiving", icon: PackageCheck, permission: "receipt:read" },
  { href: "/invoices", label: "Invoices", icon: ReceiptText, permission: "invoice:read" },
  { href: "/suppliers", label: "Suppliers", icon: Building2, permission: "supplier:read" },
  { href: "/documents", label: "Documents", icon: FolderOpen, permission: "document:read" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "report:read" },
  { href: "/audit", label: "Audit log", icon: ScrollText, permission: "audit:read" },
  { href: "/members", label: "Members & roles", icon: Users, permission: "member:read" },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function ShellChrome({
  session,
  unreadCount = 0,
  children,
}: {
  session: SessionContext;
  unreadCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen bg-app">
      <aside className="hidden w-[248px] shrink-0 border-r border-line bg-surface md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 px-5">
          <LogoMark className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight text-ink">Proofline</span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Primary">
          {NAV.filter(
            (item) => !item.permission || roleHasPermission(session.membership.role, item.permission),
          ).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-140",
                  active ? "bg-brand-tint text-brand-deep" : "text-subtle hover:bg-app hover:text-ink",
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <button
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-subtle transition-colors hover:bg-app hover:text-ink disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-sm font-semibold text-ink">
              {session.organization?.name ?? "No organization"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
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
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">{session.user.name}</p>
              <p className="text-xs text-subtle">
                {session.membership.role.replace(/_/g, " ").toLowerCase()}
              </p>
            </div>
            <button
              onClick={logout}
              disabled={loggingOut}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-subtle transition-colors hover:bg-app hover:text-ink disabled:opacity-50 md:hidden"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  );
}
