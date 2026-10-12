import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReportDiscrepanciesDto, ReportSuppliersDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { discrepancyTypeLabel, humanize } from "@/components/invoices/status";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatMinor } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const [discrepancies, suppliers] = await Promise.all([
    serverGet<ReportDiscrepanciesDto>("/api/v1/reports/discrepancies"),
    serverGet<ReportSuppliersDto>("/api/v1/reports/suppliers"),
  ]);

  if (discrepancies.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reports" />
        <Alert tone="error">Your role does not permit viewing reports.</Alert>
      </div>
    );
  }

  const byType = discrepancies.data?.byType ?? [];
  const bySeverity = discrepancies.data?.bySeverity ?? [];
  const total = discrepancies.data?.total ?? 0;
  const supplierRows = suppliers.data?.rows ?? [];
  const currency = suppliers.data?.currency ?? "INR";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Discrepancies and supplier exposure, computed from real records."
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Open discrepancies by type ({total})</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {byType.length === 0 ? (
              <p className="text-sm text-subtle">No open discrepancies.</p>
            ) : (
              byType.map((row) => (
                <BarRow key={row.type} label={discrepancyTypeLabel(row.type)} count={row.count} total={total} />
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open discrepancies by severity</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {bySeverity.length === 0 ? (
              <p className="text-sm text-subtle">No open discrepancies.</p>
            ) : (
              bySeverity.map((row) => (
                <BarRow key={row.severity} label={humanize(row.severity)} count={row.count} total={total} />
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier exposure</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {supplierRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No supplier activity yet"
                description="Supplier case counts and disputed value appear once cases and discrepancies exist."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-5 py-3 font-medium">Supplier</th>
                    <th className="px-5 py-3 text-right font-medium">Cases</th>
                    <th className="px-5 py-3 text-right font-medium">Open cases</th>
                    <th className="px-5 py-3 text-right font-medium">Disputed value</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierRows.map((row) => (
                    <tr key={row.supplierId} className="border-b border-line last:border-0">
                      <td className="px-5 py-3">
                        <Link href={`/suppliers/${row.supplierId}`} className="font-medium text-ink hover:underline">
                          {row.name}
                        </Link>
                        <span className="block text-xs text-subtle">{row.code}</span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-subtle">{row.caseCount}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-subtle">{row.openCaseCount}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink">
                        {formatMinor(row.disputedValueMinor, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function BarRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-subtle">{label}</span>
        <span className="font-medium tabular-nums text-ink">{count}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-app">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
