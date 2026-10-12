import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import type { Paginated, PurchaseOrderSummaryDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PurchaseOrderFilters } from "@/components/purchase-orders/purchase-order-filters";
import { PO_STATUS_TONE, poStatusLabel } from "@/components/purchase-orders/po-status";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatMinor } from "@/lib/format";

export const metadata: Metadata = { title: "Purchase orders" };
export const dynamic = "force-dynamic";

interface PoSearchParams {
  search?: string;
  status?: string;
  page?: string;
}

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: PoSearchParams }) {
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

  const result = await serverGet<Paginated<PurchaseOrderSummaryDto>>(
    `/api/v1/purchase-orders${query ? `?${query}` : ""}`,
  );

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Purchase orders" />
        <Alert tone="error">Your role does not permit viewing purchase orders.</Alert>
      </div>
    );
  }

  const canWrite = roleHasPermission(session.membership.role, "po:write");
  const orders = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(target: number) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (status) sp.set("status", status);
    if (target > 1) sp.set("page", String(target));
    const q = sp.toString();
    return q ? `/purchase-orders?${q}` : "/purchase-orders";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Purchase orders"
        description="What you ordered. Receipts and invoices are compared against these."
        actions={
          canWrite ? (
            <Link href="/purchase-orders/new">
              <Button>New purchase order</Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>All purchase orders ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <PurchaseOrderFilters />

          {orders.length === 0 ? (
            <EmptyState
              title="No purchase orders found"
              description={
                search || status
                  ? "Nothing matches your filters. Try clearing them."
                  : "Create your first purchase order to start receiving against it."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">PO number</th>
                    <th className="px-3 py-3 font-medium">Supplier</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Expected</th>
                    <th className="px-3 py-3 font-medium">Lines</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 font-medium text-ink">
                        <Link href={`/purchase-orders/${order.id}`} className="hover:underline">
                          {order.poNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-subtle">{order.supplier.name}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={PO_STATUS_TONE[order.status]}>
                          {poStatusLabel(order.status)}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        {order.expectedDeliveryDate
                          ? new Date(order.expectedDeliveryDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-subtle">{order.lineCount}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink">
                        {formatMinor(order.totalMinor, order.currency)}
                      </td>
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
