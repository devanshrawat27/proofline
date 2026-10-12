import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import type { InvoiceSummaryDto, Paginated } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { InvoiceFilters } from "@/components/invoices/invoice-filters";
import { INVOICE_STATUS_TONE } from "@/components/invoices/status";
import { getSessionContext, serverGet } from "@/lib/server-api";
import { formatMinor } from "@/lib/format";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

interface InvoiceSearchParams {
  search?: string;
  status?: string;
  page?: string;
}

export default async function InvoicesPage({ searchParams }: { searchParams: InvoiceSearchParams }) {
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

  const result = await serverGet<Paginated<InvoiceSummaryDto>>(
    `/api/v1/invoices${query ? `?${query}` : ""}`,
  );

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoices" />
        <Alert tone="error">Your role does not permit viewing invoices.</Alert>
      </div>
    );
  }

  const canWrite = roleHasPermission(session.membership.role, "invoice:write");
  const invoices = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(target: number) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (status) sp.set("status", status);
    if (target > 1) sp.set("page", String(target));
    const q = sp.toString();
    return q ? `/invoices?${q}` : "/invoices";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        description="What the supplier billed. Reviewing an invoice runs the discrepancy checks."
        actions={
          canWrite ? (
            <Link href="/invoices/new">
              <Button>New invoice</Button>
            </Link>
          ) : null
        }
      />

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>All invoices ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <InvoiceFilters />

          {invoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              description={
                search || status
                  ? "Nothing matches your filters."
                  : "Record a supplier invoice and review it to detect discrepancies."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">Invoice</th>
                    <th className="px-3 py-3 font-medium">Supplier</th>
                    <th className="px-3 py-3 font-medium">PO</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 font-medium text-ink">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-subtle">{invoice.supplier.name}</td>
                      <td className="px-3 py-3 text-subtle">
                        {invoice.purchaseOrder ? (
                          <Link href={`/purchase-orders/${invoice.purchaseOrder.id}`} className="hover:underline">
                            {invoice.purchaseOrder.poNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={INVOICE_STATUS_TONE[invoice.status]}>
                          {invoice.status.toLowerCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink">
                        {formatMinor(invoice.totalMinor, invoice.currency)}
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
