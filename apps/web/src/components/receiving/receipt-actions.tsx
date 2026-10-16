"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReceiptStatus } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api";

export function ReceiptActions({
  id,
  status,
  canWrite,
}: {
  id: string;
  status: ReceiptStatus;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!canWrite || status !== "DRAFT") return null;

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      await apiFetch(`/api/v1/receipts/${id}/submit`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "The receipt could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button onClick={submit} loading={busy}>
        {busy ? "Submitting…" : "Submit receipt"}
      </Button>
    </div>
  );
}
