import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionContext } from "@/lib/server-api";

export const metadata: Metadata = { title: "Sign in — Proofline" };

export default async function LoginPage() {
  const session = await getSessionContext();
  if (session) redirect("/overview");
  return <LoginForm />;
}
