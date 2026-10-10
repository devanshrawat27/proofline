"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { inviteMemberSchema, ORG_ROLES } from "@goodsignal/shared-types";
import type { OrgRole } from "@goodsignal/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";

interface InviteResult {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  acceptToken?: string;
}

export function InviteMemberForm({ canInvite }: { canInvite: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("RECEIVER");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!canInvite) {
    return (
      <Alert tone="info">Your role cannot invite new members. Ask an owner to send an invitation.</Alert>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldError(null);
    setInvite(null);

    const parsed = inviteMemberSchema.safeParse({ email, role });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Enter a valid email and role.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<InviteResult>("/api/v1/members/invitations", {
        method: "POST",
        body: parsed.data,
      });
      setInvite(result);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to send the invitation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {invite ? (
        <Alert tone="success">
          Invitation created for {invite.email}.
          {invite.acceptToken ? (
            <>
              {" "}
              Local dev accept token:{" "}
              <code className="break-all rounded bg-white/60 px-1 py-0.5 text-xs">{invite.acceptToken}</code>
            </>
          ) : null}
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="teammate@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldError>{fieldError}</FieldError>
        </div>
        <div className="sm:w-52">
          <Label htmlFor="invite-role">Role</Label>
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
          >
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={submitting} className="sm:mb-0.5">
          {submitting ? "Sending…" : "Send invite"}
        </Button>
      </div>
    </form>
  );
}
