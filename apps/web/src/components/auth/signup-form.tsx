"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupSchema } from "@goodsignal/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  organizationName?: string;
}

export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/v1/auth/signup", { method: "POST", body: parsed.data });
      router.push("/overview");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-7 shadow-card">
      <h1 className="text-lg font-semibold text-ink">Create your organization</h1>
      <p className="mt-1 text-sm text-subtle">You become the owner and can invite your team next.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div>
          <Label htmlFor="organizationName">Organization name</Label>
          <Input id="organizationName" value={values.organizationName} onChange={update("organizationName")} required />
          <FieldError>{fieldErrors.organizationName}</FieldError>
        </div>
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" value={values.name} onChange={update("name")} required />
          <FieldError>{fieldErrors.name}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" autoComplete="email" value={values.email} onChange={update("email")} required />
          <FieldError>{fieldErrors.email}</FieldError>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={update("password")}
            required
          />
          <FieldError>{fieldErrors.password}</FieldError>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating…" : "Create organization"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-subtle">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
