import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  FileText,
  LayoutDashboard,
  PackageCheck,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { Reveal } from "./reveal";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "Purchase Orders" },
  { icon: PackageCheck, label: "Receiving" },
  { icon: AlertTriangle, label: "Discrepancies", badge: "12" },
  { icon: Building2, label: "Suppliers" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

const tabs = [
  { label: "All", count: 24, active: true },
  { label: "Needs Review", count: 6 },
  { label: "In Progress", count: 8 },
  { label: "Waiting for Supplier", count: 5 },
  { label: "Resolved", count: 2 },
];

type PillTone = "warn" | "info" | "waiting" | "success";
const pillStyles: Record<PillTone, string> = {
  warn: "bg-warn-surface text-warn",
  info: "bg-info-surface text-info",
  waiting: "bg-app text-subtle border border-line",
  success: "bg-success-surface text-success",
};

const rows: Array<{
  id: string;
  supplier: string;
  issue: string;
  value: string;
  status: string;
  tone: PillTone;
  updated: string;
}> = [
  { id: "PF-1042", supplier: "BrightTech", issue: "Quantity mismatch", value: "₹50,000", status: "Needs review", tone: "warn", updated: "2h ago" },
  { id: "PF-1041", supplier: "ElectroLab", issue: "Damaged items", value: "₹18,600", status: "In progress", tone: "info", updated: "4h ago" },
  { id: "PF-1039", supplier: "Lumenix", issue: "Overbilled", value: "₹27,000", status: "Waiting for supplier", tone: "waiting", updated: "1d ago" },
  { id: "PF-1038", supplier: "VoltEdge", issue: "Missing items", value: "₹12,500", status: "Resolved", tone: "success", updated: "2d ago" },
  { id: "PF-1037", supplier: "BuildKart", issue: "Wrong variant", value: "₹8,400", status: "In progress", tone: "info", updated: "2d ago" },
];

const kpis = [
  { label: "Open Cases", value: "24", delta: "+12%", bars: [6, 10, 8, 13, 11, 16, 15, 21] },
  { label: "Disputed Value", value: "₹1,24,500", delta: "+8%", bars: [8, 7, 11, 10, 14, 13, 18, 20] },
  { label: "Avg. Resolution Time", value: "3.2 days", delta: "-40%", bars: [20, 18, 16, 15, 13, 11, 9, 7] },
];

function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium", pillStyles[tone])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {children}
    </span>
  );
}

function Sparkline({ bars }: { bars: number[] }) {
  return (
    <div className="flex items-end gap-1" aria-hidden>
      {bars.map((height, index) => (
        <span
          key={index}
          className={cn("w-1 rounded-full", index >= bars.length - 2 ? "bg-brand" : "bg-brand/25")}
          style={{ height: `${Math.round(height * 0.7)}px` }}
        />
      ))}
    </div>
  );
}

function DashboardMock() {
  return (
    <div
      role="img"
      aria-label="Proofline dashboard showing discrepancy cases, statuses and summary metrics (illustrative sample data)"
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-scene lg:-rotate-[0.6deg]"
    >
      <div aria-hidden className="select-none">
        {/* Window chrome */}
        <div className="flex items-center gap-3 border-b border-line bg-app/70 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <LogoMark className="h-6 w-6" />
            <span className="text-sm font-semibold text-ink">Proofline</span>
          </div>
          <div className="ml-2 hidden flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs text-subtle sm:flex">
            <Search className="h-3.5 w-3.5" aria-hidden />
            Search purchase orders, suppliers, cases…
          </div>
          <div className="ml-auto flex items-center gap-3 text-subtle">
            <Bell className="h-4 w-4" aria-hidden />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">A</span>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden w-44 shrink-0 border-r border-line bg-app/40 p-3 lg:block">
            <nav className="space-y-0.5">
              {navItems.map((item) => (
                <span
                  key={item.label}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs",
                    item.active ? "bg-brand-tint font-semibold text-brand-deep" : "text-subtle",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-3.5 w-3.5" aria-hidden />
                    {item.label}
                  </span>
                  {item.badge ? (
                    <span className="rounded-full bg-critical-surface px-1.5 text-[10px] font-semibold text-critical">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1 p-4 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-ink">Discrepancy Cases</h3>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white">
                <Plus className="h-3.5 w-3.5" aria-hidden /> New Case
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {tabs.map((tab) => (
                <span
                  key={tab.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium",
                    tab.active ? "bg-ink text-white" : "border border-line bg-surface text-subtle",
                  )}
                >
                  {tab.label}
                  <span className={cn("rounded px-1 text-[10px]", tab.active ? "bg-white/20" : "bg-app")}>
                    {tab.count}
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-3 overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[420px] text-left text-[11px]">
                <thead className="bg-app/60 text-[10px] uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-2 font-medium">Case ID</th>
                    <th className="hidden px-3 py-2 font-medium sm:table-cell">Supplier</th>
                    <th className="px-3 py-2 font-medium">Issue</th>
                    <th className="hidden px-3 py-2 font-medium md:table-cell">Value</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="hidden px-3 py-2 font-medium lg:table-cell">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-line">
                      <td className="px-3 py-2 font-medium text-ink">{row.id}</td>
                      <td className="hidden px-3 py-2 text-subtle sm:table-cell">{row.supplier}</td>
                      <td className="px-3 py-2 text-subtle">{row.issue}</td>
                      <td className="hidden px-3 py-2 tabular-nums text-ink md:table-cell">{row.value}</td>
                      <td className="px-3 py-2">
                        <StatusPill tone={row.tone}>{row.status}</StatusPill>
                      </td>
                      <td className="hidden px-3 py-2 text-subtle lg:table-cell">{row.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-line bg-surface p-3">
                  <p className="text-[10px] uppercase tracking-wide text-subtle">{kpi.label}</p>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="whitespace-nowrap text-base font-semibold tabular-nums leading-tight text-ink">{kpi.value}</p>
                      <p className={cn("mt-0.5 text-[10px] font-medium", kpi.delta.startsWith("-") ? "text-success" : "text-brand")}>
                        {kpi.delta}
                      </p>
                    </div>
                    <Sparkline bars={kpi.bars} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const benefits = ["Live discrepancy tracking", "Supplier collaboration", "Evidence and audit trail", "Actionable analytics"];

export function ProductDashboardShowcase() {
  return (
    <section id="product" className="py-16 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center lg:gap-14">
        <Reveal className="min-w-0">
          <DashboardMock />
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
            A clearer view of what matters
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Spot issues early, resolve them faster.
          </h2>
          <p className="mt-4 text-base text-subtle">
            Real-time visibility into deliveries, discrepancies, and supplier responses. Keep your
            operations running smoothly.
          </p>
          <ul className="mt-6 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm font-medium text-ink">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
          <a href="#ai" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
            See all features <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
