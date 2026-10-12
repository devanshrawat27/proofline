import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import type { Paginated, ReceiptStatus, ReceiptSummaryDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReceiptFilters } from "@/components/receiving/receipt-filters";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Receiving" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<ReceiptStatus, "info" | "neutral"> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
};

interface ReceiptSearchParams {
  search?: string;
  status?: string;
  page?: string;
}

export default async function ReceivingPage({ searchParams }: { searchParams: ReceiptSearchParams }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const search = searchParams.search?.trim() ?? "";
  const status = searchParams.status ?? "";
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();

  const result = await serverGet<Paginated<ReceiptSummaryDto>>(
    `/api/v1/receipts${query ? `?${query}` : ""}`,
  );

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Receiving" />
        <Alert tone="error">Your role does not permit viewing receipts.</Alert>
      </div>
    );
  }

  const canWrite = roleHasPermission(session.membership.role, "receipt:write");
  const receipts = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(target: number) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (status) sp.set("status", status);
    if (target > 1) sp.set("page", String(target));
    const q = sp.toString();
    return q ? `/receiving?${q}` : "/receiving";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Receiving"
        description="What actually arrived. Quantities and damage are compared against the purchase order."
        actions={
          canWrite ? (
            <Link href="/receiving/new">
              <Button>Record a delivery</Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>All receipts ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <ReceiptFilters />

          {receipts.length === 0 ? (
            <EmptyState
              title="No receipts yet"
              description={
                search || status
                  ? "Nothing matches your filters."
                  : "Record a delivery against an issued purchase order to start tracking what arrived."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">Reference</th>
                    <th className="px-3 py-3 font-medium">Purchase order</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Received</th>
                    <th className="px-3 py-3 font-medium">Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 font-medium text-ink">
                        <Link href={`/receiving/${receipt.id}`} className="hover:underline">
                          {receipt.reference ?? "—"}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        <Link href={`/purchase-orders/${receipt.purchaseOrder.id}`} className="hover:underline">
                          {receipt.purchaseOrder.poNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={STATUS_TONE[receipt.status]}>
                          {receipt.status.toLowerCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        {receipt.receivedAt ? new Date(receipt.receivedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-subtle">{receipt.lineCount}</td>
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
