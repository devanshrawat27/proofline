import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { ReceiptDto, ReceiptStatus } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReceiptActions } from "@/components/receiving/receipt-actions";
import { Attachments } from "@/components/documents/attachments";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatQuantity } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Receipt" };

const STATUS_TONE: Record<ReceiptStatus, "info" | "neutral"> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
};

export default async function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const result = await serverGet<ReceiptDto>(`/api/v1/receipts/${params.id}`);
  if (result.status === 404) notFound();

  if (result.status === 403 || !result.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Receipt" />
        <Alert tone="error">
          {result.status === 403
            ? "Your role does not permit viewing this receipt."
            : "This receipt could not be loaded."}
        </Alert>
      </div>
    );
  }

  const receipt = result.data;
  const canWrite = roleHasPermission(session.membership.role, "receipt:write");
  const canUploadDocs = roleHasPermission(session.membership.role, "document:write");

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
        title={receipt.reference ?? "Receipt"}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Link href={`/purchase-orders/${receipt.purchaseOrder.id}`} className="hover:underline">
              {receipt.purchaseOrder.poNumber}
            </Link>
            <span className="text-line">·</span>
            <span>{receipt.purchaseOrder.supplier.name}</span>
            <span className="text-line">·</span>
            <StatusBadge tone={STATUS_TONE[receipt.status]}>
              {receipt.status.toLowerCase()}
            </StatusBadge>
          </span>
        }
        actions={<ReceiptActions id={receipt.id} status={receipt.status} canWrite={canWrite} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Received lines ({receipt.lines.length})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 text-right font-medium">Ordered</th>
                  <th className="px-5 py-3 text-right font-medium">Received</th>
                  <th className="px-5 py-3 text-right font-medium">Damaged</th>
                  <th className="px-5 py-3 text-right font-medium">Accepted</th>
                </tr>
              </thead>
              <tbody>
                {receipt.lines.map((line) => (
                  <tr key={line.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{line.description}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-subtle">
                      {formatQuantity(line.orderedQuantity)} {line.unit}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">
                      {formatQuantity(line.receivedQuantity)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-critical">
                      {formatQuantity(line.damagedQuantity)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">
                      {formatQuantity(line.acceptedQuantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {receipt.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-subtle">{receipt.notes}</p>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Photos &amp; documents</CardTitle>
        </CardHeader>
        <CardBody>
          <Attachments
            apiBase="/api/v1/documents"
            listPath={`?entityType=RECEIPT&entityId=${receipt.id}`}
            entityType="RECEIPT"
            entityId={receipt.id}
            canUpload={canUploadDocs}
            supplierUpload
            reviewBase="/documents"
          />
        </CardBody>
      </Card>
    </div>
  );
}
