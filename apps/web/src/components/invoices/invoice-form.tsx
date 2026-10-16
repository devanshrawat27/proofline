"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createInvoiceSchema } from "@proofline/shared-types";
import type { InvoiceDto, PurchaseOrderDto } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api";
import { formatQuantity } from "@/lib/format";

interface SupplierOption {
  id: string;
  name: string;
  code: string;
}

interface PoOption {
  id: string;
  poNumber: string;
}

interface PoLineOption {
  id: string;
  label: string;
}

interface LineRow {
  poLineId: string;
  description: string;
  quantity: string;
  unit: string;
  unitPriceRupees: string;
}

const EMPTY_LINE: LineRow = {
  poLineId: "",
  description: "",
  quantity: "1",
  unit: "unit",
  unitPriceRupees: "",
};

function rupeesToMinor(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : Number.NaN;
}

export function InvoiceForm({
  suppliers,
  purchaseOrders,
  canWrite,
}: {
  suppliers: SupplierOption[];
  purchaseOrders: PoOption[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [poId, setPoId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineRow[]>([{ ...EMPTY_LINE }]);
  const [poLines, setPoLines] = useState<PoLineOption[]>([]);
  const [loadingPo, setLoadingPo] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!poId) {
      setPoLines([]);
      return;
    }
    let active = true;
    setLoadingPo(true);
    apiFetch<PurchaseOrderDto>(`/api/v1/purchase-orders/${poId}`)
      .then((po) => {
        if (!active) return;
        setPoLines(
          po.lines.map((line) => ({
            id: line.id,
            label: `${line.lineNumber}. ${line.description} (${formatQuantity(line.orderedQuantity)} ${line.unit})`,
          })),
        );
      })
      .catch(() => {
        if (active) setPoLines([]);
      })
      .finally(() => {
        if (active) setLoadingPo(false);
      });
    return () => {
      active = false;
    };
  }, [poId]);

  if (!canWrite) {
    return <Alert tone="info">Your role can view invoices but not create them.</Alert>;
  }

  function updateLine(index: number, patch: Partial<LineRow>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    const payload = {
      supplierId,
      poId: poId || undefined,
      invoiceNumber,
      invoiceDate: invoiceDate || undefined,
      currency: "INR",
      notes: notes || undefined,
      lines: lines.map((line) => ({
        poLineId: line.poLineId || undefined,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit || "unit",
        unitPriceMinor: rupeesToMinor(line.unitPriceRupees),
      })),
    };

    const parsed = createInvoiceSchema.safeParse(payload);
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
      const invoice = await apiFetch<InvoiceDto>("/api/v1/invoices", {
        method: "POST",
        body: parsed.data,
      });
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save the invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="inv-supplier">Supplier</Label>
          <Select id="inv-supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>
          <FieldError>{errors.supplierId}</FieldError>
        </div>
        <div>
          <Label htmlFor="inv-po">Purchase order (for matching)</Label>
          <Select
            id="inv-po"
            value={poId}
            onChange={(e) => {
              setPoId(e.target.value);
              setLines((rows) => rows.map((row) => ({ ...row, poLineId: "" })));
            }}
          >
            <option value="">Not linked</option>
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.poNumber}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="inv-number">Invoice number</Label>
          <Input
            id="inv-number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-1001"
          />
          <FieldError>{errors.invoiceNumber}</FieldError>
        </div>
        <div>
          <Label htmlFor="inv-date">Invoice date</Label>
          <Input
            id="inv-date"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="mb-0">Invoice lines</Label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setLines((rows) => [...rows, { ...EMPTY_LINE }])}
          >
            <Plus className="h-4 w-4" aria-hidden /> Add line
          </Button>
        </div>
        {errors.lines ? <FieldError>{errors.lines}</FieldError> : null}

        <div className="space-y-3">
          {lines.map((line, index) => (
            <div key={index} className="rounded-xl border border-line p-3">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <Label htmlFor={`inv-desc-${index}`}>Description</Label>
                  <Input
                    id={`inv-desc-${index}`}
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    placeholder="LED Driver 12W"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor={`inv-qty-${index}`}>Quantity</Label>
                  <Input
                    id={`inv-qty-${index}`}
                    inputMode="decimal"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label htmlFor={`inv-unit-${index}`}>Unit</Label>
                  <Input
                    id={`inv-unit-${index}`}
                    value={line.unit}
                    onChange={(e) => updateLine(index, { unit: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-4">
                  <Label htmlFor={`inv-price-${index}`}>Unit price (₹)</Label>
                  <Input
                    id={`inv-price-${index}`}
                    inputMode="decimal"
                    value={line.unitPriceRupees}
                    onChange={(e) => updateLine(index, { unitPriceRupees: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-9">
                  <Label htmlFor={`inv-match-${index}`}>Match to PO line</Label>
                  <Select
                    id={`inv-match-${index}`}
                    value={line.poLineId}
                    onChange={(e) => updateLine(index, { poLineId: e.target.value })}
                    disabled={!poId || loadingPo}
                  >
                    <option value="">{poId ? "— not matched —" : "Link a purchase order first"}</option>
                    {poLines.map((poLine) => (
                      <option key={poLine.id} value={poLine.id}>
                        {poLine.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex sm:col-span-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLines((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows))}
                    disabled={lines.length === 1}
                    aria-label={`Remove line ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="inv-notes">Notes</Label>
        <Textarea
          id="inv-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" loading={submitting}>
          {submitting ? "Saving…" : "Create invoice"}
        </Button>
      </div>
    </form>
  );
}
