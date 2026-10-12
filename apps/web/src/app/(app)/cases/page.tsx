import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import type { CaseSummaryDto, Paginated } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CaseFilters } from "@/components/cases/case-filters";
import { CASE_PRIORITY_TONE, CASE_STATUS_TONE, humanize, statusLabel } from "@/components/cases/case-status";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Cases" };
export const dynamic = "force-dynamic";

interface CaseSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  page?: string;
}

export default async function CasesPage({ searchParams }: { searchParams: CaseSearchParams }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const qs = new URLSearchParams();
  for (const key of ["search", "status", "priority"] as const) {
    const value = searchParams[key]?.trim();
    if (value) qs.set(key, value);
  }
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  if (page > 1) qs.set("page", String(page));
  const query = qs.toString();

  const result = await serverGet<Paginated<CaseSummaryDto>>(`/api/v1/cases${query ? `?${query}` : ""}`);

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cases" />
        <Alert tone="error">Your role does not permit viewing cases.</Alert>
      </div>
    );
  }

  const canWrite = roleHasPermission(session.membership.role, "case:write");
  const cases = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(searchParams.search || searchParams.status || searchParams.priority);

  function pageHref(target: number) {
    const sp = new URLSearchParams(qs.toString());
    if (target > 1) sp.set("page", String(target));
    else sp.delete("page");
    const q = sp.toString();
    return q ? `/cases?${q}` : "/cases";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cases"
        description="Disputes tracked to resolution, with evidence, ownership and a timeline."
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
          <CardTitle>All cases ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <CaseFilters />

          {cases.length === 0 ? (
            <EmptyState
              title="No cases yet"
              description={
                hasFilters
                  ? "Nothing matches your filters."
                  : "Open a case from one or more discrepancies to start resolving a dispute."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">Case</th>
                    <th className="px-3 py-3 font-medium">Supplier</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium">Assignee</th>
                    <th className="px-3 py-3 font-medium">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((item) => (
                    <tr key={item.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 font-medium text-ink">
                        <Link href={`/cases/${item.id}`} className="hover:underline">
                          {item.caseNumber}
                        </Link>
                        <span className="block text-xs text-subtle">{item.summary}</span>
                      </td>
                      <td className="px-3 py-3 text-subtle">{item.supplier.name}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={CASE_STATUS_TONE[item.status]}>{statusLabel(item.status)}</StatusBadge>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={CASE_PRIORITY_TONE[item.priority]}>{humanize(item.priority)}</StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-subtle">{item.assignee?.name ?? "—"}</td>
                      <td className="px-3 py-3 text-subtle">
                        {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—"}
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
