"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CASE_TRANSITIONS,
  MESSAGE_VISIBILITIES,
  RESOLUTION_TYPES,
} from "@proofline/shared-types";
import type { CaseDto, ResolutionDto, ResolutionType } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { formatMinor } from "@/lib/format";
import { RESOLUTION_STATUS_TONE, humanize, resolutionTypeLabel, statusLabel } from "./case-status";

function rupeesToMinor(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

export function CaseActions({
  caseData,
  members,
  canWrite,
  canApprove,
  canVerify,
}: {
  caseData: CaseDto;
  members: { id: string; name: string }[];
  canWrite: boolean;
  canApprove: boolean;
  canVerify: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [visibility, setVisibility] = useState<(typeof MESSAGE_VISIBILITIES)[number]>("INTERNAL");
  const [resolutionType, setResolutionType] = useState<ResolutionType>("CREDIT_NOTE");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const nextStatuses = CASE_TRANSITIONS[caseData.status];
  const canPropose = caseData.status === "UNDER_REVIEW" || caseData.status === "SUPPLIER_RESPONDED";
  const isOpen = caseData.status !== "CLOSED" && caseData.status !== "CANCELLED";

  async function run(path: string, body?: unknown) {
    setError(null);
    setBusy(true);
    try {
      await apiFetch(path, { method: "POST", body });
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "The action could not be completed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {canWrite && nextStatuses.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-ink">Move to</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                variant={status === "CANCELLED" ? "secondary" : "primary"}
                size="sm"
                loading={busy}
                onClick={() => run(`/api/v1/cases/${caseData.id}/transitions`, { status })}
              >
                {statusLabel(status)}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      {canPropose ? (
        <section className="rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold text-ink">Propose a resolution</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="res-type">Type</Label>
              <Select id="res-type" value={resolutionType} onChange={(e) => setResolutionType(e.target.value as ResolutionType)}>
                {RESOLUTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {resolutionTypeLabel(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="res-amount">Amount (₹, optional)</Label>
              <Input id="res-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
            </div>
            <div>
              <Label htmlFor="res-ref">Reference</Label>
              <Input id="res-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Credit note / replacement ref" />
            </div>
            <div>
              <Label htmlFor="res-notes">Notes</Label>
              <Input id="res-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              loading={busy}
              onClick={async () => {
                const ok = await run(`/api/v1/cases/${caseData.id}/resolutions`, {
                  type: resolutionType,
                  proposedAmountMinor: rupeesToMinor(amount),
                  reference: reference || undefined,
                  notes: notes || undefined,
                });
                if (ok) {
                  setAmount("");
                  setReference("");
                  setNotes("");
                }
              }}
            >
              Propose resolution
            </Button>
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="text-sm font-semibold text-ink">Resolutions ({caseData.resolutions.length})</h3>
        {caseData.resolutions.length === 0 ? (
          <p className="mt-2 text-sm text-subtle">No resolution proposed yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {caseData.resolutions.map((resolution) => (
              <ResolutionRow
                key={resolution.id}
                caseId={caseData.id}
                resolution={resolution}
                canApprove={canApprove}
                canVerify={canVerify}
                busy={busy}
                onAction={run}
              />
            ))}
          </ul>
        )}
      </section>

      {canWrite && isOpen ? (
        <section className="rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold text-ink">Add a message</h3>
          <div className="mt-3">
            <Label htmlFor="msg-visibility">Visibility</Label>
            <Select
              id="msg-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as (typeof MESSAGE_VISIBILITIES)[number])}
            >
              {MESSAGE_VISIBILITIES.map((v) => (
                <option key={v} value={v}>
                  {v === "SUPPLIER_VISIBLE" ? "Supplier visible" : "Internal note"}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-3">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea id="msg-body" rows={3} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} />
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              disabled={busy || messageBody.trim().length === 0}
              onClick={async () => {
                const ok = await run(`/api/v1/cases/${caseData.id}/messages`, {
                  visibility,
                  body: messageBody,
                });
                if (ok) setMessageBody("");
              }}
            >
              Add message
            </Button>
          </div>
        </section>
      ) : null}

      {canWrite && isOpen ? (
        <section className="rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold text-ink">Assignee</h3>
          <div className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="case-assign">Assign to</Label>
              <Select id="case-assign" value={caseData.assignee?.id ?? ""} onChange={(e) => run(`/api/v1/cases/${caseData.id}/assign`, { assigneeUserId: e.target.value })} disabled={busy}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ResolutionRow({
  caseId,
  resolution,
  canApprove,
  canVerify,
  busy,
  onAction,
}: {
  caseId: string;
  resolution: ResolutionDto;
  canApprove: boolean;
  canVerify: boolean;
  busy: boolean;
  onAction: (path: string, body?: unknown) => Promise<boolean>;
}) {
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{resolutionTypeLabel(resolution.type)}</span>
          <StatusBadge tone={RESOLUTION_STATUS_TONE[resolution.status]}>
            {humanize(resolution.status)}
          </StatusBadge>
        </div>
        {resolution.proposedAmountMinor !== null ? (
          <span className="text-sm font-semibold tabular-nums text-ink">
            {formatMinor(resolution.proposedAmountMinor)}
          </span>
        ) : null}
      </div>
      {resolution.notes ? <p className="mt-1 text-sm text-subtle">{resolution.notes}</p> : null}
      <p className="mt-1 text-xs text-subtle">
        Proposed by {resolution.proposedByName ?? "—"} on {new Date(resolution.proposedAt).toLocaleDateString()}
        {resolution.approvedByName ? ` · approved by ${resolution.approvedByName}` : ""}
        {resolution.verifiedByName ? ` · verified by ${resolution.verifiedByName}` : ""}
      </p>
      <div className="mt-2 flex gap-2">
        {resolution.status === "PROPOSED" && canApprove ? (
          <Button size="sm" loading={busy} onClick={() => onAction(`/api/v1/cases/${caseId}/resolutions/${resolution.id}/approve`)}>
            Approve
          </Button>
        ) : null}
        {resolution.status === "APPROVED" && canVerify ? (
          <Button size="sm" loading={busy} onClick={() => onAction(`/api/v1/cases/${caseId}/resolutions/${resolution.id}/verify`)}>
            Verify
          </Button>
        ) : null}
      </div>
    </li>
  );
}
