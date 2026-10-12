import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleHasPermission } from "@proofline/shared-types";
import type { Paginated, SupplierDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SupplierFilters } from "@/components/suppliers/supplier-filters";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Suppliers" };
export const dynamic = "force-dynamic";

interface SuppliersSearchParams {
  search?: string;
  status?: string;
  page?: string;
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: SuppliersSearchParams;
}) {
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

  const result = await serverGet<Paginated<SupplierDto>>(
    `/api/v1/suppliers${query ? `?${query}` : ""}`,
  );

  if (result.status === 403) {
    return (
      <div className="space-y-6">
        <PageHeader title="Suppliers" />
        <Alert tone="error">
          Your role does not permit viewing suppliers. Ask an owner for access.
        </Alert>
      </div>
    );
  }

  const canWrite = roleHasPermission(session.membership.role, "supplier:write");
  const suppliers = result.data?.items ?? [];
  const total = result.data?.total ?? 0;
  const pageSize = result.data?.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pageHref(target: number) {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (status) sp.set("status", status);
    if (target > 1) sp.set("page", String(target));
    const q = sp.toString();
    return q ? `/suppliers?${q}` : "/suppliers";
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Suppliers"
        description="The vendors you order from. Purchase orders and cases reference these records."
      />

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Add a supplier</CardTitle>
          </CardHeader>
          <CardBody>
            <SupplierForm mode="create" canWrite={canWrite} />
          </CardBody>
        </Card>
      ) : (
        <Alert tone="info">
          Your role can view suppliers but not create them. Ask an owner or procurement manager for
          access.
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>All suppliers ({total})</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <SupplierFilters />

          {suppliers.length === 0 ? (
            <EmptyState
              title="No suppliers found"
              description={
                search || status
                  ? "No suppliers match your filters. Try clearing the search or status filter."
                  : "Add your first supplier to start creating purchase orders."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-3 font-medium">Code</th>
                    <th className="px-3 py-3 font-medium">Name</th>
                    <th className="px-3 py-3 font-medium">Contact</th>
                    <th className="px-3 py-3 font-medium">Location</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-line last:border-0">
                      <td className="px-3 py-3 font-medium text-ink">
                        <Link href={`/suppliers/${supplier.id}`} className="hover:underline">
                          {supplier.code}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/suppliers/${supplier.id}`} className="font-medium text-ink hover:underline">
                          {supplier.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        {supplier.contactName ?? "—"}
                        {supplier.email ? (
                          <>
                            <br />
                            <span className="text-xs">{supplier.email}</span>
                          </>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-subtle">
                        {[supplier.city, supplier.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge tone={supplier.status === "ACTIVE" ? "success" : "neutral"}>
                          {supplier.status.toLowerCase()}
                        </StatusBadge>
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
