import { redirect } from "next/navigation";
import { ShellChrome } from "@/components/app-shell/shell-chrome";
import { getSessionContext, serverGet } from "@/lib/server-api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  const unread = await serverGet<{ count: number }>("/api/v1/notifications/unread-count");
  return (
    <ShellChrome session={session} unreadCount={unread.data?.count ?? 0}>
      {children}
    </ShellChrome>
  );
}
