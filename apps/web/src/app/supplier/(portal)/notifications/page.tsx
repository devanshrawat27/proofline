import type { Metadata } from "next";
import type { NotificationDto, Paginated } from "@proofline/shared-types";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { supplierServerGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function SupplierNotificationsPage() {
  const result = await supplierServerGet<Paginated<NotificationDto>>(
    "/api/v1/supplier/notifications?pageSize=50",
  );
  const items = result.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Notifications" description="Cases your buyer has shared with you." />
      <NotificationList
        items={items}
        apiBase="/api/v1/supplier/notifications"
        caseHrefBase="/supplier/cases"
      />
    </div>
  );
}
