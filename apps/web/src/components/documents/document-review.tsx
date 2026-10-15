"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import type { DocumentDto, DocumentExtractionDto, ExtractedField } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";

function confidence(field: ExtractedField): string {
  return typeof field.confidence === "number" ? `${Math.round(field.confidence * 100)}%` : "—";
}

const FIELD_LABELS: Record<string, string> = {
  documentType: "Document type",
  supplierName: "Supplier",
  documentNumber: "Document number",
  documentDate: "Date",
  currency: "Currency",
  poReference: "PO reference",
  total: "Total",
};

export function DocumentReview({
  document,
  initialExtraction,
  canReview,
}: {
  document: DocumentDto;
  initialExtraction: DocumentExtractionDto | null;
  canReview: boolean;
}) {
  const router = useRouter();
  const [extraction, setExtraction] = useState<DocumentExtractionDto | null>(initialExtraction);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function fieldValue(name: keyof DocumentExtractionDto["fields"]): string {
    const source = extraction?.correctedFields ?? extraction?.fields;
    const field = source?.[name];
    return field && typeof field === "object" && "value" in field ? String((field as ExtractedField).value ?? "") : "";
  }

  const [values, setValues] = useState<Record<string, string>>({
    documentType: fieldValue("documentType"),
    supplierName: fieldValue("supplierName"),
    documentNumber: fieldValue("documentNumber"),
    documentDate: fieldValue("documentDate"),
    currency: fieldValue("currency"),
    poReference: fieldValue("poReference"),
    total: fieldValue("total"),
  });

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  const extract = () =>
    run(async () => {
      const result = await apiFetch<DocumentExtractionDto>(`/api/v1/documents/${document.id}/extract`, { method: "POST" });
      setExtraction(result);
      setValues({
        documentType: result.fields.documentType.value ?? "",
        supplierName: result.fields.supplierName.value ?? "",
        documentNumber: result.fields.documentNumber.value ?? "",
        documentDate: result.fields.documentDate.value ?? "",
        currency: result.fields.currency.value ?? "",
        poReference: result.fields.poReference.value ?? "",
        total: result.fields.total.value ?? "",
      });
    });

  const review = (decision: "CONFIRM" | "CORRECT") =>
    run(async () => {
      if (!extraction) return;
      const corrected = extraction.fields;
      const correctedFields = {
        ...corrected,
        documentType: { value: values.documentType || null, confidence: corrected.documentType.confidence },
        supplierName: { value: values.supplierName || null, confidence: corrected.supplierName.confidence },
        documentNumber: { value: values.documentNumber || null, confidence: corrected.documentNumber.confidence },
        documentDate: { value: values.documentDate || null, confidence: corrected.documentDate.confidence },
        currency: { value: values.currency || null, confidence: corrected.currency.confidence },
        poReference: { value: values.poReference || null, confidence: corrected.poReference.confidence },
        total: { value: values.total || null, confidence: corrected.total.confidence },
      };
      const result = await apiFetch<DocumentExtractionDto>(`/api/v1/documents/${document.id}/review`, {
        method: "POST",
        body: { decision, correctedFields: decision === "CORRECT" ? correctedFields : undefined },
      });
      setExtraction(result);
    });

  return (
    <div className="space-y-6">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-subtle">
          <a href={`${API_BASE_URL}/api/v1/documents/${document.id}/content`} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">
            Open original file
          </a>
          <span> · {document.fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={document.extractionStatus === "DONE" ? "info" : document.extractionStatus === "FAILED" ? "critical" : "neutral"}>
            extraction: {document.extractionStatus.toLowerCase()}
          </StatusBadge>
          {canReview ? (
            <Button size="sm" onClick={extract} disabled={busy}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {busy ? "Working…" : extraction ? "Re-extract" : "Extract with AI"}
            </Button>
          ) : null}
        </div>
      </div>

      {extraction?.error ? <Alert tone="error">Last attempt failed: {extraction.error}</Alert> : null}

      {extraction && !extraction.error ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <StatusBadge tone={extraction.reviewStatus === "CONFIRMED" ? "success" : extraction.reviewStatus === "CORRECTED" ? "info" : "warning"}>
              {extraction.reviewStatus.toLowerCase()}
            </StatusBadge>
            <span className="text-subtle">
              {extraction.provider} · {extraction.model} · overall confidence {extraction.confidence !== null ? `${Math.round(extraction.confidence * 100)}%` : "—"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(FIELD_LABELS) as Array<keyof DocumentExtractionDto["fields"]>).map((name) => (
              <div key={name}>
                <Label htmlFor={`ext-${name}`}>
                  {FIELD_LABELS[name]}{" "}
                  <span className="font-normal text-subtle">
                    ({confidence(extraction.fields[name] as ExtractedField)})
                  </span>
                </Label>
                <Input
                  id={`ext-${name}`}
                  value={values[name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                  disabled={!canReview}
                />
              </div>
            ))}
          </div>

          {extraction.fields.lines.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-subtle">
                  <tr>
                    <th className="px-3 py-2 font-medium">Line</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Unit price</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                    <th className="px-3 py-2 text-right font-medium">Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {extraction.fields.lines.map((line, index) => (
                    <tr key={index} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 text-ink">{line.description}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-subtle">{line.quantity ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-subtle">{line.unitPrice ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-subtle">{line.lineTotal ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-subtle">
                        {typeof line.confidence === "number" ? `${Math.round(line.confidence * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {canReview ? (
            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button size="sm" onClick={() => review("CONFIRM")} disabled={busy}>
                Confirm as-is
              </Button>
              <Button size="sm" variant="secondary" onClick={() => review("CORRECT")} disabled={busy}>
                Save corrections
              </Button>
            </div>
          ) : (
            <p className="text-xs text-subtle">Your role can view extractions but not review them.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-subtle">No extraction yet.</p>
      )}
    </div>
  );
}
