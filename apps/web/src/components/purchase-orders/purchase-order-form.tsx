"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPurchaseOrderSchema } from "@proofline/shared-types";
import type { PurchaseOrderDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api";
import { formatMinor } from "@/lib/format";

interface SupplierOption {
  id: string;
  name: string;
  code: string;
}

interface LineRow {
  description: string;
  sku: string;
  orderedQuantity: string;
  unit: string;
  unitPriceRupees: string;
}

const EMPTY_LINE: LineRow = {
  description: "",
  sku: "",
  orderedQuantity: "1",
  unit: "unit",
  unitPriceRupees: "",
};

function rupeesToMinor(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : Number.NaN;
}

function minorToRupees(minor: number): string {
  return (minor / 100).toString();
}

export function PurchaseOrderForm({
  suppliers,
  purchaseOrder,
  canWrite,
}: {
  suppliers: SupplierOption[];
  purchaseOrder?: PurchaseOrderDto;
  canWrite: boolean;
}) {
  const router = useRouter();
  const editing = Boolean(purchaseOrder);

  const [supplierId, setSupplierId] = useState(purchaseOrder?.supplier.id ?? suppliers[0]?.id ?? "");
  const [poNumber, setPoNumber] = useState(purchaseOrder?.poNumber ?? "");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    purchaseOrder?.expectedDeliveryDate ? purchaseOrder.expectedDeliveryDate.slice(0, 10) : "",
  );
  const [notes, setNotes] = useState(purchaseOrder?.notes ?? "");
  const [lines, setLines] = useState<LineRow[]>(
    purchaseOrder && purchaseOrder.lines.length > 0
      ? purchaseOrder.lines.map((line) => ({
          description: line.description,
          sku: line.sku ?? "",
          orderedQuantity: line.orderedQuantity,
          unit: line.unit,
          unitPriceRupees: minorToRupees(line.unitPriceMinor),
        }))
      : [{ ...EMPTY_LINE }],
  );

  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!canWrite) {
    return (
      <Alert tone="info">
        Your role can view purchase orders but not create or edit them.
      </Alert>
    );
  }

  if (suppliers.length === 0) {
    return (
      <Alert tone="info">
        Add a supplier first — purchase orders must reference one.
      </Alert>
    );
  }

  function updateLine(index: number, patch: Partial<LineRow>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addLine() {
    setLines((rows) => [...rows, { ...EMPTY_LINE }]);
  }

  function removeLine(index: number) {
    setLines((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  }

  const estimatedTotal = lines.reduce((sum, line) => {
    const minor = rupeesToMinor(line.unitPriceRupees);
    const qty = Number.parseFloat(line.orderedQuantity);
    return Number.isFinite(minor) && Number.isFinite(qty) ? sum + Math.round(qty * minor) : sum;
  }, 0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    const payload = {
      supplierId,
      poNumber,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      notes: notes || undefined,
      currency: "INR",
      lines: lines.map((line) => ({
        description: line.description,
        sku: line.sku || undefined,
        orderedQuantity: line.orderedQuantity,
        unit: line.unit || "unit",
        unitPriceMinor: rupeesToMinor(line.unitPriceRupees),
      })),
    };

    const parsed = createPurchaseOrderSchema.safeParse(payload);
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
      if (editing && purchaseOrder) {
        await apiFetch<PurchaseOrderDto>(`/api/v1/purchase-orders/${purchaseOrder.id}`, {
          method: "PATCH",
          body: parsed.data,
        });
        router.refresh();
      } else {
        const created = await apiFetch<PurchaseOrderDto>("/api/v1/purchase-orders", {
          method: "POST",
          body: parsed.data,
        });
        router.push(`/purchase-orders/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save the purchase order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="po-supplier">Supplier</Label>
          <Select
            id="po-supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            disabled={editing}
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>
          <FieldError>{errors.supplierId}</FieldError>
        </div>
        <div>
          <Label htmlFor="po-number">PO number</Label>
          <Input
            id="po-number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="PO-1001"
          />
          <FieldError>{errors.poNumber}</FieldError>
        </div>
        <div>
          <Label htmlFor="po-expected">Expected delivery</Label>
          <Input
            id="po-expected"
            type="date"
            value={expectedDeliveryDate}
            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
          />
          <FieldError>{errors.expectedDeliveryDate}</FieldError>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="mb-0">Line items</Label>
          <Button type="button" variant="secondary" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4" aria-hidden /> Add line
          </Button>
        </div>
        {errors.lines ? <FieldError>{errors.lines}</FieldError> : null}

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="rounded-xl border border-line p-3">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Label htmlFor={`line-desc-${index}`}>Description</Label>
                  <Input
                    id={`line-desc-${index}`}
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    placeholder="LED Driver 12W"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`line-sku-${index}`}>SKU</Label>
                  <Input
                    id={`line-sku-${index}`}
                    value={line.sku}
                    onChange={(e) => updateLine(index, { sku: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`line-qty-${index}`}>Quantity</Label>
                  <Input
                    id={`line-qty-${index}`}
                    inputMode="decimal"
                    value={line.orderedQuantity}
                    onChange={(e) => updateLine(index, { orderedQuantity: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor={`line-unit-${index}`}>Unit</Label>
                  <Input
                    id={`line-unit-${index}`}
                    value={line.unit}
                    onChange={(e) => updateLine(index, { unit: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`line-price-${index}`}>Unit price (₹)</Label>
                  <Input
                    id={`line-price-${index}`}
                    inputMode="decimal"
                    value={line.unitPriceRupees}
                    onChange={(e) => updateLine(index, { unitPriceRupees: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-subtle">
                  Line total:{" "}
                  {formatMinor(
                    Math.round(
                      (Number.parseFloat(line.orderedQuantity) || 0) *
                        (rupeesToMinor(line.unitPriceRupees) || 0),
                    ),
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={lines.length === 1}
                  aria-label={`Remove line ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden /> Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="po-notes">Notes</Label>
        <Textarea
          id="po-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional internal notes"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-sm font-medium text-ink">
          Estimated total: <span className="tabular-nums">{formatMinor(estimatedTotal)}</span>
        </span>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : editing ? "Save changes" : "Create purchase order"}
        </Button>
      </div>
    </form>
  );
}
