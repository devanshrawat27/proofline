import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { roleHasPermission } from "@proofline/shared-types";
import type { DiscrepancyDto, OrgRole, Paginated } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CaseForm } from "@/components/cases/case-form";
import { discrepancyTypeLabel } from "@/components/invoices/status";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "New case" };
export const dynamic = "force-dynamic";

interface MemberRow {
  id: string;
  userId: string;
  role: OrgRole;
  status: string;
  name: string;
  email: string;
}

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: { discrepancies?: string };
}) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const canWrite = roleHasPermission(session.membership.role, "case:write");
  if (!canWrite) {
    return (
      <div className="space-y-6">
        <PageHeader title="New case" />
        <Alert tone="error">Your role does not permit creating cases.</Alert>
      </div>
    );
  }

  const [discrepancies, members] = await Promise.all([
    serverGet<Paginated<DiscrepancyDto>>("/api/v1/discrepancies?status=OPEN&pageSize=100"),
    serverGet<MemberRow[]>("/api/v1/members"),
  ]);

  const discrepancyOptions = (discrepancies.data?.items ?? []).map((item) => ({
    id: item.id,
    label: `${discrepancyTypeLabel(item.type)} · ${item.explanation} (${item.purchaseOrder.poNumber})`,
  }));

  const memberOptions = (members.data ?? [])
    .filter((m) => m.status === "ACTIVE")
    .map((m) => ({ id: m.userId, name: m.name }));

  const preselect = searchParams.discrepancies
    ? searchParams.discrepancies.split(",").map((id) => id.trim()).filter(Boolean)
    : [];

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
        title="New case"
        description="Combine one or more open discrepancies for the same supplier into a tracked dispute."
      />

      <Card>
        <CardHeader>
          <CardTitle>Case details</CardTitle>
        </CardHeader>
        <CardBody>
          {discrepancyOptions.length === 0 ? (
            <Alert tone="info">
              No open discrepancies to include. Review an invoice to detect discrepancies first.
            </Alert>
          ) : (
            <CaseForm
              discrepancies={discrepancyOptions}
              members={memberOptions}
              initialDiscrepancyIds={preselect}
              canWrite={canWrite}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
