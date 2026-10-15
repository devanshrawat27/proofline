"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESOLUTION_TYPES } from "@proofline/shared-types";
import type { ResolutionType, SupplierCaseDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";
import { resolutionTypeLabel } from "@/components/cases/case-status";

function rupeesToMinor(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : undefined;
}

export function SupplierCaseActions({ caseData }: { caseData: SupplierCaseDto }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState("");
  const [type, setType] = useState<ResolutionType>("CREDIT_NOTE");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const closed = caseData.status === "CLOSED" || caseData.status === "CANCELLED";
  const canPropose = caseData.status === "SENT_TO_SUPPLIER" || caseData.status === "SUPPLIER_RESPONDED";

  if (closed) {
    return <Alert tone="info">This case is closed. No further action is required.</Alert>;
  }

  async function post(path: string, payload?: unknown): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      await apiFetch(path, { method: "POST", body: payload });
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

      <section className="rounded-xl border border-line p-4">
        <h3 className="text-sm font-semibold text-ink">Respond to the buyer</h3>
        <div className="mt-3">
          <Label htmlFor="supplier-respond">Message</Label>
          <Textarea
            id="supplier-respond"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Confirm, dispute or ask for more information"
          />
        </div>
        <div className="mt-3">
          <Button
            size="sm"
            disabled={busy || body.trim().length === 0}
            onClick={async () => {
              const ok = await post(`/api/v1/supplier/cases/${caseData.id}/respond`, { body });
              if (ok) setBody("");
            }}
          >
            Send response
          </Button>
        </div>
      </section>

      {canPropose ? (
        <section className="rounded-xl border border-line p-4">
          <h3 className="text-sm font-semibold text-ink">Propose a resolution</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="supplier-res-type">Type</Label>
              <Select id="supplier-res-type" value={type} onChange={(e) => setType(e.target.value as ResolutionType)}>
                {RESOLUTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {resolutionTypeLabel(t)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="supplier-res-amount">Amount (₹, optional)</Label>
              <Input id="supplier-res-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="supplier-res-ref">Reference</Label>
              <Input id="supplier-res-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="supplier-res-notes">Notes</Label>
              <Input id="supplier-res-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              disabled={busy}
              onClick={async () => {
                const ok = await post(`/api/v1/supplier/cases/${caseData.id}/proposals`, {
                  type,
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
              Submit proposal
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
