import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { Paginated, PurchaseOrderDto, SupplierDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { PurchaseOrderActions } from "@/components/purchase-orders/purchase-order-actions";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { PO_STATUS_TONE, poStatusLabel } from "@/components/purchase-orders/po-status";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatMinor, formatQuantity } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Purchase order" };

export default async function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const result = await serverGet<PurchaseOrderDto>(`/api/v1/purchase-orders/${params.id}`);
  if (result.status === 404) notFound();

  if (result.status === 403 || !result.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Purchase order" />
        <Alert tone="error">
          {result.status === 403
            ? "Your role does not permit viewing this purchase order."
            : "This purchase order could not be loaded."}
        </Alert>
      </div>
    );
  }

  const po = result.data;
  const canWrite = roleHasPermission(session.membership.role, "po:write");
  const isDraft = po.status === "DRAFT";
  const isReceivable = po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED";
  const canReceive = isReceivable && roleHasPermission(session.membership.role, "receipt:write");

  let supplierOptions: { id: string; name: string; code: string }[] = [];
  if (isDraft && canWrite) {
    const suppliers = await serverGet<Paginated<SupplierDto>>("/api/v1/suppliers?pageSize=100");
    supplierOptions = (suppliers.data?.items ?? [])
      .filter((s) => s.status === "ACTIVE")
      .map((s) => ({ id: s.id, name: s.name, code: s.code }));
  }

  return (
    <div className="space-y-8">
      <Link
        href="/purchase-orders"
        className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to purchase orders
      </Link>

      <PageHeader
        title={po.poNumber}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Link href={`/suppliers/${po.supplier.id}`} className="hover:underline">
              {po.supplier.name}
            </Link>
            <span className="text-line">·</span>
            <StatusBadge tone={PO_STATUS_TONE[po.status]}>{poStatusLabel(po.status)}</StatusBadge>
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canReceive ? (
              <Link href={`/receiving/new?po=${po.id}`}>
                <Button variant="secondary">Record delivery</Button>
              </Link>
            ) : null}
            {canWrite ? (
              <PurchaseOrderActions id={po.id} status={po.status} canWrite={canWrite} />
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-subtle">Total value</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
              {formatMinor(po.totalMinor, po.currency)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-subtle">Expected delivery</p>
            <p className="mt-1 text-sm text-ink">
              {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : "—"}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-subtle">Issued</p>
            <p className="mt-1 text-sm text-ink">
              {po.issueDate ? new Date(po.issueDate).toLocaleDateString() : "Not issued"}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items ({po.lines.length})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 text-right font-medium">Ordered</th>
                  <th className="px-5 py-3 text-right font-medium">Unit price</th>
                  <th className="px-5 py-3 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((line) => (
                  <tr key={line.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 text-subtle">{line.lineNumber}</td>
                    <td className="px-5 py-3 font-medium text-ink">{line.description}</td>
                    <td className="px-5 py-3 text-subtle">{line.sku ?? "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">
                      {formatQuantity(line.orderedQuantity)} {line.unit}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-subtle">
                      {formatMinor(line.unitPriceMinor, po.currency)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">
                      {formatMinor(line.lineTotalMinor, po.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {po.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-subtle">{po.notes}</p>
          </CardBody>
        </Card>
      ) : null}

      {isDraft && canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit draft</CardTitle>
          </CardHeader>
          <CardBody>
            <PurchaseOrderForm suppliers={supplierOptions} purchaseOrder={po} canWrite={canWrite} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
