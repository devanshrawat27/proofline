"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/auth/login", { method: "POST", body: { email, password } });
      router.push("/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-card">
      <h1 className="text-lg font-semibold text-ink">Sign in to Proofline</h1>
      <p className="mt-1 text-sm text-subtle">Sign in to your workspace.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FieldError />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-subtle">
        No account?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          Create an organization
        </Link>
      </p>
    </div>
  );
}
