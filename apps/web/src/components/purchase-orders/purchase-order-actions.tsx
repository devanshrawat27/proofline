"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PoStatus } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api";

export function PurchaseOrderActions({
  id,
  status,
  canWrite,
}: {
  id: string;
  status: PoStatus;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"issue" | "cancel" | null>(null);

  if (!canWrite) return null;

  const canIssue = status === "DRAFT";
  const canCancel = status === "DRAFT" || status === "ISSUED";
  if (!canIssue && !canCancel) return null;

  async function run(action: "issue" | "cancel") {
    setError(null);
    setBusy(action);
    try {
      await apiFetch(`/api/v1/purchase-orders/${id}/${action}`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "The action could not be completed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        {canIssue ? (
          <Button onClick={() => run("issue")} disabled={busy !== null}>
            {busy === "issue" ? "Issuing…" : "Issue purchase order"}
          </Button>
        ) : null}
        {canCancel ? (
          <Button variant="secondary" onClick={() => run("cancel")} disabled={busy !== null}>
            {busy === "cancel" ? "Cancelling…" : "Cancel purchase order"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
