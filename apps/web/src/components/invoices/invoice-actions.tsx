"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InvoiceStatus } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api";

export function InvoiceActions({
  id,
  status,
  canWrite,
}: {
  id: string;
  status: InvoiceStatus;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!canWrite || status !== "DRAFT") return null;

  async function review() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/v1/invoices/${id}/review`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "The invoice could not be reviewed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button onClick={review} loading={busy}>
        {busy ? "Reviewing…" : "Review & detect discrepancies"}
      </Button>
    </div>
  );
}
