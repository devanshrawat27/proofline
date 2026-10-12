import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { AuditEventDto, Paginated } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { AuditFilters } from "@/components/audit/audit-filters";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

interface AuditSearchParams {
  search?: string;
  entityType?: string;
  page?: string;
}

function actionLabel(action: string): string {
  return action.replace(/_/g, " ").replace(/\./g, " · ");
}

export default async function AuditPage({ searchParams }: { searchParams: AuditSearchParams }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const qs = new URLSearchParams();
  for (const key of ["search", "entityType"] as const) {
    const value = searchParams[key]?.trim();
    if (value) qs.set(key, value);
  }
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();

  const result = await serverGet<Paginated<AuditEventDto>>(
    `/api/v1/audit-events${query ? `?${query}` : ""}`,
  );

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audit log" />
        <Alert tone="error">Your role does not permit viewing the audit log.</Alert>
      </div>
    );
  }

  const events = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 30;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(searchParams.search || searchParams.entityType);

  function pageHref(target: number) {
    const sp = new URLSearchParams(qs.toString());
    if (target > 1) sp.set("page", String(target));
    else sp.delete("page");
    const q = sp.toString();
    return q ? `/audit?${q}` : "/audit";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit log"
        description="Append-only record of important actions across the workspace."
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Events ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <AuditFilters />

          {events.length === 0 ? (
            <EmptyState
              title="No audit events"
              description={
                hasFilters
                  ? "Nothing matches your filters."
                  : "Actions like issuing a PO, submitting a receipt, reviewing an invoice and case changes are recorded here."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">When</th>
                    <th className="px-3 py-3 font-medium">Action</th>
                    <th className="px-3 py-3 font-medium">Entity</th>
                    <th className="px-3 py-3 font-medium">Actor</th>
                    <th className="px-3 py-3 font-medium">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-line last:border-0">
                      <td className="whitespace-nowrap px-3 py-3 text-subtle">
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 font-medium capitalize text-ink">{actionLabel(event.action)}</td>
                      <td className="px-3 py-3 text-subtle">{event.entityType}</td>
                      <td className="px-3 py-3 text-subtle">{event.actorName ?? event.actorType.toLowerCase()}</td>
                      <td className="px-3 py-3 text-subtle">{event.summary ?? "—"}</td>
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
