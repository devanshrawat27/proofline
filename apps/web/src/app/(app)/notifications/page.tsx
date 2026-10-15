import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { NotificationDto, Paginated } from "@proofline/shared-types";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationList } from "@/components/notifications/notification-list";
import { getSessionContext, serverGet } from "@/lib/server-api";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const result = await serverGet<Paginated<NotificationDto>>("/api/v1/notifications?pageSize=50");
  const items = result.data?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Notifications" description="Assignments, supplier responses and resolution updates." />
      <NotificationList items={items} apiBase="/api/v1/notifications" caseHrefBase="/cases" />
    </div>
  );
}
