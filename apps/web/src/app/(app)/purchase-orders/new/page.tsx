import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { Paginated, SupplierDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "New purchase order" };
export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const canWrite = roleHasPermission(session.membership.role, "po:write");
  if (!canWrite) {
    return (
      <div className="space-y-6">
        <PageHeader title="New purchase order" />
        <Alert tone="error">Your role does not permit creating purchase orders.</Alert>
      </div>
    );
  }

  const suppliers = await serverGet<Paginated<SupplierDto>>("/api/v1/suppliers?pageSize=100");
  const supplierOptions = (suppliers.data?.items ?? [])
    .filter((s) => s.status === "ACTIVE")
    .map((s) => ({ id: s.id, name: s.name, code: s.code }));

  return (
    <div className="space-y-8">
      <Link
        href="/purchase-orders"
        className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to purchase orders
      </Link>

      <PageHeader
        title="New purchase order"
        description="Define what you ordered. You can issue it once the line items are correct."
      />

      <Card>
        <CardHeader>
          <CardTitle>Order details</CardTitle>
        </CardHeader>
        <CardBody>
          <PurchaseOrderForm suppliers={supplierOptions} canWrite={canWrite} />
        </CardBody>
      </Card>
    </div>
  );
}
