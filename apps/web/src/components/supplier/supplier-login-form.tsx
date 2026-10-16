"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supplierLoginSchema } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";

export function SupplierLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    const parsed = supplierLoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/v1/supplier/auth/login", { method: "POST", body: parsed.data });
      const next = params.get("next");
      router.push(next && next.startsWith("/supplier") ? next : "/supplier");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div>
        <Label htmlFor="supplier-email">Email</Label>
        <Input
          id="supplier-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@supplier.com"
          disabled={submitting}
        />
        <FieldError>{fieldError}</FieldError>
      </div>
      <div>
        <Label htmlFor="supplier-password">Password</Label>
        <Input
          id="supplier-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
        />
      </div>
      <Button type="submit" className="w-full" loading={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
      {submitting ? (
        <p className="text-center text-xs text-subtle">
          Waking the server ({">"}30s on the first request) and checking your details…
        </p>
      ) : null}
    </form>
  );
}
