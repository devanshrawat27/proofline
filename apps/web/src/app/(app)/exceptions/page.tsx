import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import type { DiscrepancyDto, Paginated } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DiscrepancyFilters } from "@/components/exceptions/discrepancy-filters";
import { SEVERITY_TONE, discrepancyTypeLabel, humanize } from "@/components/invoices/status";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Exceptions" };
export const dynamic = "force-dynamic";

interface ExceptionSearchParams {
  search?: string;
  severity?: string;
  type?: string;
  status?: string;
  page?: string;
}

export default async function ExceptionsPage({ searchParams }: { searchParams: ExceptionSearchParams }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const qs = new URLSearchParams();
  for (const key of ["search", "severity", "type", "status"] as const) {
    const value = searchParams[key]?.trim();
    if (value) qs.set(key, value);
  }
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();

  const result = await serverGet<Paginated<DiscrepancyDto>>(
    `/api/v1/discrepancies${query ? `?${query}` : ""}`,
  );

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Exceptions" />
        <Alert tone="error">Your role does not permit viewing discrepancies.</Alert>
      </div>
    );
  }

  const discrepancies = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(searchParams.search || searchParams.severity || searchParams.type || searchParams.status);
  const canWrite = roleHasPermission(session.membership.role, "case:write");

  function pageHref(target: number) {
    const sp = new URLSearchParams(qs.toString());
    if (target > 1) sp.set("page", String(target));
    else sp.delete("page");
    const q = sp.toString();
    return q ? `/exceptions?${q}` : "/exceptions";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Exceptions"
        description="Discrepancies found by comparing purchase orders, receipts and invoices."
        actions={
          canWrite ? (
            <Link href="/cases/new">
              <Button>New case</Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Open discrepancies ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <DiscrepancyFilters />

          {discrepancies.length === 0 ? (
            <EmptyState
              title="No discrepancies"
              description={
                hasFilters
                  ? "Nothing matches your filters."
                  : "Review an invoice to run the discrepancy checks against its purchase order and receipts."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">Severity</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Detail</th>
                    <th className="px-3 py-3 font-medium">PO</th>
                    <th className="px-3 py-3 font-medium">Invoice</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {discrepancies.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0 align-top">
                      <td className="px-3 py-3">
                        <StatusBadge tone={SEVERITY_TONE[item.severity]}>
                          {item.severity.toLowerCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 font-medium text-ink">{discrepancyTypeLabel(item.type)}</td>
                      <td className="px-3 py-3 text-subtle">
                        <p>{item.explanation}</p>
                        {item.expectedValue || item.actualValue ? (
                          <p className="mt-1 text-xs">
                            expected <span className="font-medium text-ink">{item.expectedValue ?? "—"}</span> · actual{" "}
                            <span className="font-medium text-ink">{item.actualValue ?? "—"}</span>
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        <Link href={`/purchase-orders/${item.purchaseOrder.id}`} className="hover:underline">
                          {item.purchaseOrder.poNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        {item.invoice ? (
                          <Link href={`/invoices/${item.invoice.id}`} className="hover:underline">
                            {item.invoice.invoiceNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3 text-subtle">{humanize(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > pageSize ? (
            <div className="flex items-center justify-between text-sm text-subtle">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="rounded-lg border border-line px-3 py-1.5 hover:bg-app">
                    Previous
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link href={pageHref(page + 1)} className="rounded-lg border border-line px-3 py-1.5 hover:bg-app">
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
