import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { Paginated, PurchaseOrderDto, PurchaseOrderSummaryDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ReceiptForm } from "@/components/receiving/receipt-form";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatMinor } from "@/lib/format";

export const metadata: Metadata = { title: "Record a delivery" };
export const dynamic = "force-dynamic";

export default async function NewReceiptPage({ searchParams }: { searchParams: { po?: string } }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const canWrite = roleHasPermission(session.membership.role, "receipt:write");
  if (!canWrite) {
    return (
      <div className="space-y-6">
        <PageHeader title="Record a delivery" />
        <Alert tone="error">Your role does not permit recording deliveries.</Alert>
      </div>
    );
  }

  const poId = searchParams.po;

  if (poId) {
    const poResult = await serverGet<PurchaseOrderDto>(`/api/v1/purchase-orders/${poId}`);
    const po = poResult.data;
    const receivable = po && (po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED");

    if (!po || !receivable) {
      return (
        <div className="space-y-6">
          <Link
            href="/receiving/new"
            className="inline-flex items-center gap-1.5 text-sm text-subtle hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Choose another purchase order
          </Link>
          <PageHeader title="Record a delivery" />
          <Alert tone="error">
            This purchase order cannot be received against. Only issued or partially received orders can.
          </Alert>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <Link
          href={`/purchase-orders/${po.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to {po.poNumber}
        </Link>

        <PageHeader
          title="Record a delivery"
          description="Enter what actually arrived. You can save a draft and submit once it is correct."
        />

        <Card>
          <CardHeader>
            <CardTitle>Received quantities</CardTitle>
          </CardHeader>
          <CardBody>
            <ReceiptForm purchaseOrder={po} canWrite={canWrite} />
          </CardBody>
        </Card>
      </div>
    );
  }

  const orders = await serverGet<Paginated<PurchaseOrderSummaryDto>>(
    "/api/v1/purchase-orders?pageSize=100",
  );
  const receivableOrders = (orders.data?.items ?? []).filter(
    (order) => order.status === "ISSUED" || order.status === "PARTIALLY_RECEIVED",
  );

  return (
    <div className="space-y-8">
      <Link
        href="/receiving"
        className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to receiving
      </Link>

      <PageHeader
        title="Record a delivery"
        description="Choose an issued purchase order to receive against."
      />

      <Card>
        <CardHeader>
          <CardTitle>Issued purchase orders ({receivableOrders.length})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {receivableOrders.length === 0 ? (
            <div className="p-5">
              <Alert tone="info">
                No purchase orders are awaiting receipt. Issue a purchase order first.
              </Alert>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {receivableOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/receiving/new?po=${order.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-app"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{order.poNumber}</span>
                      <span className="block text-sm text-subtle">{order.supplier.name}</span>
                    </span>
                    <span className="flex items-center gap-4 text-sm text-subtle">
                      <span className="tabular-nums">{formatMinor(order.totalMinor, order.currency)}</span>
                      <ArrowRight className="h-4 w-4 text-brand" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
