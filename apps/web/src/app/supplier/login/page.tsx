import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { Card, CardBody } from "@/components/ui/card";
import { SupplierLoginForm } from "@/components/supplier/supplier-login-form";

export const metadata: Metadata = { title: "Supplier sign in" };

export default function SupplierLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-5 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Wordmark />
          <p className="text-sm text-subtle">Supplier portal — sign in to view and respond to cases.</p>
        </div>
        <Card>
          <CardBody>
            <Suspense fallback={null}>
              <SupplierLoginForm />
            </Suspense>
          </CardBody>
        </Card>
        <p className="text-center text-xs text-subtle">
          Internal team?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}

