"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createReceiptSchema } from "@proofline/shared-types";
import type { PurchaseOrderDto, ReceiptDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";
import { formatQuantity } from "@/lib/format";

interface LineState {
  purchaseOrderLineId: string;
  description: string;
  unit: string;
  orderedQuantity: string;
  receivedQuantity: string;
  damagedQuantity: string;
}

export function ReceiptForm({
  purchaseOrder,
  canWrite,
}: {
  purchaseOrder: PurchaseOrderDto;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineState[]>(
    purchaseOrder.lines.map((line) => ({
      purchaseOrderLineId: line.id,
      description: line.description,
      unit: line.unit,
      orderedQuantity: line.orderedQuantity,
      receivedQuantity: line.orderedQuantity,
      damagedQuantity: "0",
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!canWrite) {
    return <Alert tone="info">Your role can view receipts but not record deliveries.</Alert>;
  }

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    const payload = {
      purchaseOrderId: purchaseOrder.id,
      reference: reference || undefined,
      notes: notes || undefined,
      lines: lines.map((line) => ({
        purchaseOrderLineId: line.purchaseOrderLineId,
        receivedQuantity: line.receivedQuantity,
        damagedQuantity: line.damagedQuantity || "0",
      })),
    };

    const parsed = createReceiptSchema.safeParse(payload);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !map[key]) map[key] = issue.message;
      }
      setErrors(map);
      setError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const receipt = await apiFetch<ReceiptDto>("/api/v1/receipts", {
        method: "POST",
        body: parsed.data,
      });
      router.push(`/receiving/${receipt.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save the receipt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="rounded-xl border border-line bg-app/40 p-3 text-sm">
        <span className="text-subtle">Receiving against </span>
        <span className="font-medium text-ink">{purchaseOrder.poNumber}</span>
        <span className="text-subtle"> · {purchaseOrder.supplier.name}</span>
      </div>

      <div>
        <Label>Lines</Label>
        {errors.lines ? <FieldError>{errors.lines}</FieldError> : null}
        <div className="mt-2 space-y-3">
          {lines.map((line, index) => (
            <div key={line.purchaseOrderLineId} className="rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">{line.description}</p>
                <p className="text-xs text-subtle">
                  Ordered {formatQuantity(line.orderedQuantity)} {line.unit}
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`received-${index}`}>Received</Label>
                  <Input
                    id={`received-${index}`}
                    inputMode="decimal"
                    value={line.receivedQuantity}
                    onChange={(e) => updateLine(index, { receivedQuantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`damaged-${index}`}>Damaged (of received)</Label>
                  <Input
                    id={`damaged-${index}`}
                    inputMode="decimal"
                    value={line.damagedQuantity}
                    onChange={(e) => updateLine(index, { damagedQuantity: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="receipt-reference">Delivery reference</Label>
          <Input
            id="receipt-reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Challan / DC number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="receipt-notes">Notes</Label>
        <Textarea
          id="receipt-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the receiver should flag"
        />
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" loading={submitting}>
          {submitting ? "Saving…" : "Save draft receipt"}
        </Button>
      </div>
    </form>
  );
}
