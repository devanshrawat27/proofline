"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateOrganizationSchema } from "@goodsignal/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";

export function OrganizationForm({
  canEdit,
  initial,
}: {
  canEdit: boolean;
  initial: { name: string; timezone: string; defaultCurrency: string };
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setSaved(false);
      setValues((prev) => ({ ...prev, [key]: event.target.value }));
    };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setFieldErrors({});

    const parsed = updateOrganizationSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] = issue.message;
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/v1/organization", { method: "PATCH", body: parsed.data });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save changes.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {!canEdit ? (
        <Alert tone="info">Only an owner can edit organization settings. You can view them below.</Alert>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Organization settings saved.</Alert> : null}

      <div>
        <Label htmlFor="org-name">Organization name</Label>
        <Input id="org-name" value={values.name} onChange={update("name")} disabled={!canEdit} />
        <FieldError>{fieldErrors.name}</FieldError>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="org-currency">Default currency (ISO)</Label>
          <Input id="org-currency" value={values.defaultCurrency} onChange={update("defaultCurrency")} disabled={!canEdit} />
          <FieldError>{fieldErrors.defaultCurrency}</FieldError>
        </div>
        <div>
          <Label htmlFor="org-timezone">Timezone</Label>
          <Input id="org-timezone" value={values.timezone} onChange={update("timezone")} disabled={!canEdit} />
          <FieldError>{fieldErrors.timezone}</FieldError>
        </div>
      </div>

      {canEdit ? (
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Save changes"}
        </Button>
      ) : null}
    </form>
  );
}
