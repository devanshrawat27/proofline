import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { CaseDto, OrgRole } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CaseActions } from "@/components/cases/case-actions";
import {
  CASE_PRIORITY_TONE,
  CASE_STATUS_TONE,
  humanize,
  statusLabel,
  visibilityLabel,
} from "@/components/cases/case-status";
import { SEVERITY_TONE, discrepancyTypeLabel } from "@/components/invoices/status";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Case" };

interface MemberRow {
  id: string;
  userId: string;
  role: OrgRole;
  status: string;
  name: string;
  email: string;
}

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const result = await serverGet<CaseDto>(`/api/v1/cases/${params.id}`);
  if (result.status === 404) notFound();

  if (result.status === 403 || !result.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Case" />
        <Alert tone="error">
          {result.status === 403
            ? "Your role does not permit viewing this case."
            : "This case could not be loaded."}
        </Alert>
      </div>
    );
  }

  const caseData = result.data;
  const canWrite = roleHasPermission(session.membership.role, "case:write");
  const canApprove = roleHasPermission(session.membership.role, "case:approve");
  const canVerify = roleHasPermission(session.membership.role, "resolution:verify");

  const membersResult = canWrite ? await serverGet<MemberRow[]>("/api/v1/members") : null;
  const memberOptions = (membersResult?.data ?? [])
    .filter((m) => m.status === "ACTIVE")
    .map((m) => ({ id: m.userId, name: m.name }));

  const timeline = [
    ...caseData.events.map((event) => ({
      id: `e-${event.id}`,
      kind: "event" as const,
      created: event.createdAt,
      title: event.type.replace(/_/g, " ").toLowerCase(),
      body: event.message,
      actor: event.actorName,
    })),
    ...caseData.messages.map((message) => ({
      id: `m-${message.id}`,
      kind: "message" as const,
      created: message.createdAt,
      title: visibilityLabel(message.visibility),
      body: message.body,
      actor: message.author?.name ?? null,
      visibility: message.visibility,
    })),
  ].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

  return (
    <div className="space-y-8">
      <Link
        href="/cases"
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
            <StatusBadge tone={CASE_PRIORITY_TONE[caseData.priority]}>{humanize(caseData.priority)}</StatusBadge>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Supplier</dt>
                  <dd className="mt-1">
                    <Link href={`/suppliers/${caseData.supplier.id}`} className="text-ink hover:underline">
                      {caseData.supplier.name}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Assignee</dt>
                  <dd className="mt-1 text-ink">{caseData.assignee?.name ?? "Unassigned"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Due</dt>
                  <dd className="mt-1 text-ink">
                    {caseData.dueDate ? new Date(caseData.dueDate).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Opened</dt>
                  <dd className="mt-1 text-ink">
                    {caseData.openedAt ? new Date(caseData.openedAt).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Closed</dt>
                  <dd className="mt-1 text-ink">
                    {caseData.closedAt ? new Date(caseData.closedAt).toLocaleDateString() : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-subtle">Discrepancies</dt>
                  <dd className="mt-1 tabular-nums text-ink">{caseData.items.length}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discrepancies in this case ({caseData.items.length})</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-line">
                {caseData.items.map((item) => (
                  <li key={item.id} className="px-5 py-4">
                    {item.discrepancy ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone={SEVERITY_TONE[item.discrepancy.severity]}>
                            {item.discrepancy.severity.toLowerCase()}
                          </StatusBadge>
                          <span className="text-sm font-medium text-ink">
                            {discrepancyTypeLabel(item.discrepancy.type)}
                          </span>
                          <span className="text-xs text-subtle">
                            {item.discrepancy.purchaseOrder.poNumber}
                            {item.discrepancy.invoice ? ` · ${item.discrepancy.invoice.invoiceNumber}` : ""}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-subtle">{item.discrepancy.explanation}</p>
                      </>
                    ) : (
                      <p className="text-sm text-subtle">Discrepancy no longer available.</p>
                    )}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {timeline.length === 0 ? (
                <div className="p-5 text-sm text-subtle">No activity yet.</div>
              ) : (
                <ul className="divide-y divide-line">
                  {timeline.map((entry) => (
                    <li key={entry.id} className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {entry.kind === "message" ? (
                          <StatusBadge tone={entry.visibility === "SUPPLIER_VISIBLE" ? "info" : "neutral"}>
                            {entry.title}
                          </StatusBadge>
                        ) : (
                          <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                            {entry.title}
                          </span>
                        )}
                        <span className="text-xs text-subtle">
                          {entry.actor ? `${entry.actor} · ` : ""}
                          {new Date(entry.created).toLocaleString()}
                        </span>
                      </div>
                      {entry.body ? <p className="mt-1 text-sm text-subtle">{entry.body}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <CaseActions
          caseData={caseData}
          members={memberOptions}
          canWrite={canWrite}
          canApprove={canApprove}
          canVerify={canVerify}
        />
      </div>
    </div>
  );
}
