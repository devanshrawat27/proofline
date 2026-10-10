import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getSessionContext } from "@/lib/server-api";

export const metadata: Metadata = { title: "Create your organization — Proofline" };

export default async function SignupPage() {
  const session = await getSessionContext();
  if (session) redirect("/overview");
  return <SignupForm />;
}
