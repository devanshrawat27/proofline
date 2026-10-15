import { redirect } from "next/navigation";
import { SupplierShell } from "@/components/supplier/supplier-shell";
import { getSupplierSessionContext, supplierServerGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function SupplierPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSupplierSessionContext();
  if (!session) redirect("/supplier/login");

  const unread = await supplierServerGet<{ count: number }>("/api/v1/supplier/notifications/unread-count");

  return (
    <SupplierShell
      supplierName={session.supplier.name}
      userName={session.user.name}
      unreadCount={unread.data?.count ?? 0}
    >
      {children}
    </SupplierShell>
  );
}
