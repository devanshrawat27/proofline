import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import type { DocumentDto, Paginated } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DocumentFilters } from "@/components/documents/document-filters";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Documents" };
export const dynamic = "force-dynamic";

interface DocumentSearchParams {
  search?: string;
  entityType?: string;
  page?: string;
}

function bytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const EXTRACTION_TONE: Record<string, "info" | "critical" | "neutral"> = {
  DONE: "info",
  FAILED: "critical",
  PENDING: "info",
  NOT_REQUESTED: "neutral",
};

export default async function DocumentsPage({ searchParams }: { searchParams: DocumentSearchParams }) {
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

  const result = await serverGet<Paginated<DocumentDto>>(
    `/api/v1/documents/library${query ? `?${query}` : ""}`,
  );

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Documents" />
        <Alert tone="error">Your role does not permit viewing documents.</Alert>
      </div>
    );
  }

  const canReview = roleHasPermission(session.membership.role, "document:review");
  const documents = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(searchParams.search || searchParams.entityType);

  function pageHref(target: number) {
    const sp = new URLSearchParams(qs.toString());
    if (target > 1) sp.set("page", String(target));
    else sp.delete("page");
    const q = sp.toString();
    return q ? `/documents?${q}` : "/documents";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        description="Files attached to purchase orders, receipts, invoices and cases — with AI extraction."
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>All documents ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <DocumentFilters />

          {documents.length === 0 ? (
            <EmptyState
              title="No documents"
              description={
                hasFilters
                  ? "Nothing matches your filters."
                  : "Attach files from a receipt, invoice or case to see them here."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">File</th>
                    <th className="px-3 py-3 font-medium">Source</th>
                    <th className="px-3 py-3 font-medium">Kind</th>
                    <th className="px-3 py-3 font-medium">Uploaded by</th>
                    <th className="px-3 py-3 font-medium">Extraction</th>
                    <th className="px-3 py-3 text-right font-medium">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 font-medium text-ink">
                        <Link href={`/documents/${doc.id}`} className="hover:underline">
                          {doc.fileName}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        {doc.entityType.replace(/_/g, " ").toLowerCase()}
                      </td>
                      <td className="px-3 py-3 text-subtle">{doc.kind.toLowerCase()}</td>
                      <td className="px-3 py-3 text-subtle">{doc.uploadedByName ?? "—"}</td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={EXTRACTION_TONE[doc.extractionStatus] ?? "neutral"}>
                          {doc.extractionStatus.toLowerCase().replace(/_/g, " ")}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-subtle">{bytes(doc.sizeBytes)}</td>
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

          {!canReview ? (
            <p className="text-xs text-subtle">
              Your role can view documents but cannot run or review AI extraction.
            </p>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
