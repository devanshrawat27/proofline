import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { Paginated, PurchaseOrderSummaryDto, SupplierDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "New invoice" };
export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const canWrite = roleHasPermission(session.membership.role, "invoice:write");
  if (!canWrite) {
    return (
      <div className="space-y-6">
        <PageHeader title="New invoice" />
        <Alert tone="error">Your role does not permit creating invoices.</Alert>
      </div>
    );
  }

  const [suppliers, orders] = await Promise.all([
    serverGet<Paginated<SupplierDto>>("/api/v1/suppliers?pageSize=100"),
    serverGet<Paginated<PurchaseOrderSummaryDto>>("/api/v1/purchase-orders?pageSize=100"),
  ]);

  const supplierOptions = (suppliers.data?.items ?? [])
    .filter((s) => s.status === "ACTIVE")
    .map((s) => ({ id: s.id, name: s.name, code: s.code }));
  const poOptions = (orders.data?.items ?? [])
    .filter((po) => po.status !== "DRAFT" && po.status !== "CANCELLED")
    .map((po) => ({ id: po.id, poNumber: po.poNumber }));

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
        title="New invoice"
        description="Record a supplier invoice. Link it to a purchase order to enable matching."
      />

      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardBody>
          <InvoiceForm suppliers={supplierOptions} purchaseOrders={poOptions} canWrite={canWrite} />
        </CardBody>
      </Card>
    </div>
  );
}
