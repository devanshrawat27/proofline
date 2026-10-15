import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { SupplierCaseDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CASE_STATUS_TONE, RESOLUTION_STATUS_TONE, humanize, resolutionTypeLabel, statusLabel } from "@/components/cases/case-status";
import { SEVERITY_TONE, discrepancyTypeLabel } from "@/components/invoices/status";
import { SupplierCaseActions } from "@/components/supplier/supplier-case-actions";
import { Attachments } from "@/components/documents/attachments";
import { supplierServerGet } from "@/lib/server-api";
import { formatMinor } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Case" };

export default async function SupplierCaseDetailPage({ params }: { params: { id: string } }) {
  const result = await supplierServerGet<SupplierCaseDto>(`/api/v1/supplier/cases/${params.id}`);
  if (result.status === 404 || !result.data) notFound();

  const caseData = result.data;

  return (
    <div className="space-y-8">
      <Link
        href="/supplier"
        className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to cases
      </Link>

      <PageHeader
        title={caseData.caseNumber}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{caseData.summary}</span>
            <span className="text-line">·</span>
            <StatusBadge tone={CASE_STATUS_TONE[caseData.status]}>{statusLabel(caseData.status)}</StatusBadge>
          </span>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>What was found</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {caseData.discrepancies.length === 0 ? (
            <p className="text-sm text-subtle">No discrepancies recorded.</p>
          ) : (
            caseData.discrepancies.map((item) => (
              <div key={item.id} className="rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={SEVERITY_TONE[item.severity]}>{item.severity.toLowerCase()}</StatusBadge>
                  <span className="text-sm font-medium text-ink">{discrepancyTypeLabel(item.type)}</span>
                  <span className="text-xs text-subtle">{item.purchaseOrder.poNumber}</span>
                </div>
                <p className="mt-1 text-sm text-subtle">{item.explanation}</p>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardBody>
          <Attachments
            apiBase="/api/v1/supplier/documents"
            listPath={`?entityId=${caseData.id}`}
            entityType="CASE"
            entityId={caseData.id}
            canUpload={false}
          />
        </CardBody>
      </Card>

      {caseData.resolutions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Resolution proposals</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            {caseData.resolutions.map((resolution) => (
              <div key={resolution.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{resolutionTypeLabel(resolution.type)}</span>
                  <StatusBadge tone={RESOLUTION_STATUS_TONE[resolution.status]}>{humanize(resolution.status)}</StatusBadge>
                </span>
                {resolution.proposedAmountMinor !== null ? (
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatMinor(resolution.proposedAmountMinor)}
                  </span>
                ) : null}
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {caseData.messages.length === 0 ? (
            <div className="p-5 text-sm text-subtle">No messages yet.</div>
          ) : (
            <ul className="divide-y divide-line">
              {caseData.messages.map((message) => (
                <li key={message.id} className="px-5 py-4">
                  <p className="text-xs text-subtle">
                    {message.authorName} · {new Date(message.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{message.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <SupplierCaseActions caseData={caseData} />
    </div>
  );
}
