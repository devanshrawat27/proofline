import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowRight, Inbox, PackageCheck } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { CaseSummaryDto, DashboardSummaryDto, Paginated } from "@proofline/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CASE_PRIORITY_TONE, CASE_STATUS_TONE, humanize, statusLabel } from "@/components/cases/case-status";
import { discrepancyTypeLabel } from "@/components/invoices/status";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatMinor } from "@/lib/format";

export const dynamic = "force-dynamic";

const OPEN_STATUSES = new Set([
  "OPEN",
  "UNDER_REVIEW",
  "SENT_TO_SUPPLIER",
  "SUPPLIER_RESPONDED",
  "RESOLUTION_PROPOSED",
  "AWAITING_INTERNAL_APPROVAL",
  "RESOLUTION_IN_PROGRESS",
]);

export default async function OverviewPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const [summary, cases] = await Promise.all([
    serverGet<DashboardSummaryDto>("/api/v1/dashboard/summary"),
    serverGet<Paginated<CaseSummaryDto>>("/api/v1/cases?pageSize=100"),
  ]);

  const data = summary.data;
  const canReceive = roleHasPermission(session.membership.role, "receipt:write");
  const attention = (cases.data?.items ?? [])
    .filter((item) => OPEN_STATUSES.has(item.status))
    .sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${session.user.name.split(" ")[0]}`}
        description="Here is the state of your delivery discrepancy workspace."
        actions={
          canReceive ? (
            <Link href="/receiving/new">
              <Button>
                <PackageCheck className="h-4 w-4" aria-hidden />
                Record a delivery
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Open cases" value={data ? String(data.openCases) : "—"} note="Not yet closed or cancelled" />
        <MetricCard
          label="Disputed value"
          value={data ? formatMinor(data.disputedValueMinor, data.currency) : "—"}
          note="Invoiced value behind open discrepancies"
        />
        <MetricCard label="Awaiting supplier" value={data ? String(data.awaitingSupplier) : "—"} note="Cases sent to the supplier" />
        <MetricCard label="Overdue cases" value={data ? String(data.overdueCases) : "—"} note="Past their due date" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-subtle" aria-hidden />
              Needs attention
            </CardTitle>
            <Link href="/cases" className="text-sm font-semibold text-brand hover:underline">
              All cases
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {attention.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
                  title="No open cases"
                  description="When an invoice review finds a mismatch, open a case to track it to resolution."
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/cases/${item.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-app"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-ink">{item.caseNumber}</span>
                          <StatusBadge tone={CASE_PRIORITY_TONE[item.priority]}>
                            {humanize(item.priority)}
                          </StatusBadge>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-subtle">
                          {item.summary} · {item.supplier.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <StatusBadge tone={CASE_STATUS_TONE[item.status]}>{statusLabel(item.status)}</StatusBadge>
                        <ArrowRight className="h-4 w-4 text-brand" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Open discrepancies by type</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {data && data.discrepanciesByType.length > 0 ? (
                data.discrepanciesByType.map((row) => (
                  <div key={row.type} className="flex items-center justify-between text-sm">
                    <span className="text-subtle">{discrepancyTypeLabel(row.type)}</span>
                    <span className="font-medium tabular-nums text-ink">{row.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-subtle">No open discrepancies.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Purchase orders by status</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              {data && data.poReceiptStatus.length > 0 ? (
                data.poReceiptStatus.map((row) => (
                  <div key={row.status} className="flex items-center justify-between text-sm">
                    <span className="text-subtle">{humanize(row.status)}</span>
                    <span className="font-medium tabular-nums text-ink">{row.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-subtle">No purchase orders yet.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
        <p className="mt-1 text-xs text-subtle">{note}</p>
      </CardBody>
    </Card>
  );
}
