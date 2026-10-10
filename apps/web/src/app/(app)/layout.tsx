import { redirect } from "next/navigation";
import { ShellChrome } from "@/components/app-shell/shell-chrome";
import { getSessionContext } from "@/lib/server-api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  return <ShellChrome session={session}>{children}</ShellChrome>;
}
