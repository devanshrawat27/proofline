import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { SupplierDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Supplier" };

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const result = await serverGet<SupplierDto>(`/api/v1/suppliers/${params.id}`);
  if (result.status === 404) notFound();

  if (result.status === 403 || !result.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Supplier" />
        <Alert tone="error">
          {result.status === 403
            ? "Your role does not permit viewing this supplier."
            : "This supplier could not be loaded. Please try again."}
        </Alert>
      </div>
    );
  }

  const supplier = result.data;
  const canWrite = roleHasPermission(session.membership.role, "supplier:write");

  return (
    <div className="space-y-8">
      <Link
        href="/suppliers"
        className="inline-flex items-center gap-1.5 text-sm text-subtle transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to suppliers
      </Link>

      <PageHeader
        title={supplier.name}
        description={
          <span className="inline-flex items-center gap-2">
            <span>{supplier.code}</span>
            <StatusBadge tone={supplier.status === "ACTIVE" ? "success" : "neutral"}>
              {supplier.status.toLowerCase()}
            </StatusBadge>
          </span>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Supplier details</CardTitle>
        </CardHeader>
        <CardBody>
          <SupplierForm mode="edit" supplier={supplier} canWrite={canWrite} />
        </CardBody>
      </Card>
    </div>
  );
}
