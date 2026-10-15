import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Paginated, SupplierCaseSummaryDto } from "@proofline/shared-types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { CASE_STATUS_TONE, statusLabel } from "@/components/cases/case-status";
import { supplierServerGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Cases" };
export const dynamic = "force-dynamic";

export default async function SupplierCasesPage() {
  const result = await supplierServerGet<Paginated<SupplierCaseSummaryDto>>(
    "/api/v1/supplier/cases?pageSize=100",
  );
  const cases = result.data?.items ?? [];
  const total = result.data?.total ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dispute cases"
        description="Cases your buyer has shared with you. Respond or propose a resolution."
      />

      <Card>
        <CardHeader>
          <CardTitle>Cases shared with you ({total})</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {cases.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No cases yet"
                description="When your buyer sends a delivery discrepancy to you, it will appear here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cases.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/supplier/cases/${item.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-app"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-ink">{item.caseNumber}</span>
                        <StatusBadge tone={CASE_STATUS_TONE[item.status]}>{statusLabel(item.status)}</StatusBadge>
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-subtle">
                        {item.summary} · {item.discrepancyCount} discrepancy(ies)
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
