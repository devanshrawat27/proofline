import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { DiscrepancyDto, InvoiceDto, Paginated } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { INVOICE_STATUS_TONE, SEVERITY_TONE, discrepancyTypeLabel } from "@/components/invoices/status";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatMinor, formatQuantity } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const result = await serverGet<InvoiceDto>(`/api/v1/invoices/${params.id}`);
  if (result.status === 404) notFound();

  if (result.status === 403 || !result.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoice" />
        <Alert tone="error">
          {result.status === 403
            ? "Your role does not permit viewing this invoice."
            : "This invoice could not be loaded."}
        </Alert>
      </div>
    );
  }

  const invoice = result.data;
  const canWrite = roleHasPermission(session.membership.role, "invoice:write");

  const discrepancies =
    invoice.status === "REVIEWED"
      ? await serverGet<Paginated<DiscrepancyDto>>(
          `/api/v1/discrepancies?invoiceId=${invoice.id}&pageSize=100`,
        )
      : null;
  const discrepancyList = discrepancies?.data?.items ?? [];

  return (
    <div className="space-y-8">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to invoices
      </Link>

      <PageHeader
        title={invoice.invoiceNumber}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{invoice.supplier.name}</span>
            {invoice.purchaseOrder ? (
              <>
                <span className="text-line">·</span>
                <Link href={`/purchase-orders/${invoice.purchaseOrder.id}`} className="hover:underline">
                  {invoice.purchaseOrder.poNumber}
                </Link>
              </>
            ) : null}
            <span className="text-line">·</span>
            <StatusBadge tone={INVOICE_STATUS_TONE[invoice.status]}>
              {invoice.status.toLowerCase()}
            </StatusBadge>
          </span>
        }
        actions={<InvoiceActions id={invoice.id} status={invoice.status} canWrite={canWrite} />}
      />

      {invoice.status === "DRAFT" ? (
        <Alert tone="info">
          This invoice is a draft. Review it to compare against the purchase order and receipts and
          detect discrepancies.
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Invoice lines ({invoice.lines.length})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                <tr>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Matched PO line</th>
                  <th className="px-5 py-3 text-right font-medium">Quantity</th>
                  <th className="px-5 py-3 text-right font-medium">Unit price</th>
                  <th className="px-5 py-3 text-right font-medium">Line total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{line.description}</td>
                    <td className="px-5 py-3 text-subtle">
                      {line.poLineId ? (
                        <span className="text-brand-deep">matched</span>
                      ) : (
                        <span className="text-warn">not matched</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">
                      {formatQuantity(line.quantity)} {line.unit}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-subtle">
                      {formatMinor(line.unitPriceMinor, invoice.currency)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink">
                      {formatMinor(line.lineTotalMinor, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {invoice.status === "REVIEWED" ? (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Discrepancies ({discrepancyList.length})</CardTitle>
            <Link href="/exceptions" className="text-sm font-semibold text-brand hover:underline">
              View all exceptions
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {discrepancyList.length === 0 ? (
              <div className="p-5">
                <Alert tone="success">
                  No discrepancies detected. The invoice matches the purchase order and receipts.
                </Alert>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {discrepancyList.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={SEVERITY_TONE[item.severity]}>
                          {item.severity.toLowerCase()}
                        </StatusBadge>
                        <span className="text-sm font-medium text-ink">
                          {discrepancyTypeLabel(item.type)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-subtle">{item.explanation}</p>
                    </div>
                    {item.expectedValue || item.actualValue ? (
                      <p className="text-sm text-subtle">
                        expected <span className="font-medium text-ink">{item.expectedValue ?? "—"}</span> ·
                        actual <span className="font-medium text-ink">{item.actualValue ?? "—"}</span>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
