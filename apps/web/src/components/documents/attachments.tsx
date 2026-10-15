"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { ALLOWED_MIME_TYPES, MAX_DOCUMENT_BYTES } from "@proofline/shared-types";
import type { DocumentDto, DocumentEntityType, DocumentKind, DocumentVisibility } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";

function bytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

export function Attachments({
  apiBase,
  listPath,
  entityType,
  entityId,
  canUpload,
  supplierUpload = false,
  reviewBase,
}: {
  apiBase: string;
  listPath: string;
  entityType: DocumentEntityType;
  entityId: string;
  canUpload: boolean;
  supplierUpload?: boolean;
  reviewBase?: string;
}) {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [kind, setKind] = useState<DocumentKind>("PHOTO");
  const [visibility, setVisibility] = useState<DocumentVisibility>("INTERNAL");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setDocuments(await apiFetch<DocumentDto[]>(`${apiBase}${listPath}`));
    } catch {
      setDocuments([]);
    }
  }, [apiBase, listPath]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFile(file: File) {
    setError(null);
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      setError("Unsupported file type. Use PNG, JPEG, WebP or PDF.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError("File is larger than 10 MB.");
      return;
    }
    setBusy(true);
    try {
      const dataBase64 = await readAsBase64(file);
      await apiFetch(apiBase, {
        method: "POST",
        body: {
          entityType,
          entityId,
          kind,
          visibility,
          fileName: file.name,
          mimeType: file.type,
          dataBase64,
        },
      });
      if (inputRef.current) inputRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await apiFetch(`${apiBase}/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not delete the file.");
    }
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}

      {canUpload ? (
        <div className="rounded-xl border border-line p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="doc-kind">Kind</Label>
              <Select id="doc-kind" value={kind} onChange={(e) => setKind(e.target.value as DocumentKind)}>
                <option value="PHOTO">Photo</option>
                <option value="CHALLAN">Delivery challan</option>
                <option value="INVOICE_FILE">Invoice file</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            {supplierUpload ? (
              <div>
                <Label htmlFor="doc-visibility">Visible to</Label>
                <Select
                  id="doc-visibility"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as DocumentVisibility)}
                >
                  <option value="INTERNAL">Internal only</option>
                  <option value="SUPPLIER_VISIBLE">Supplier visible</option>
                </Select>
              </div>
            ) : null}
            <div className="sm:col-span-3">
              <Label htmlFor="doc-file">File (PNG, JPEG, WebP or PDF · max 10 MB)</Label>
              <input
                ref={inputRef}
                id="doc-file"
                type="file"
                accept={ALLOWED_MIME_TYPES.join(",")}
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onFile(file);
                }}
                className="block w-full text-sm text-subtle file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-deep"
              />
            </div>
          </div>
          {busy ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-subtle">
              <Upload className="h-3.5 w-3.5" aria-hidden /> Uploading…
            </p>
          ) : null}
        </div>
      ) : null}

      {documents.length === 0 ? (
        <p className="text-sm text-subtle">No attachments yet.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <a
                href={reviewBase ? `${reviewBase}/${doc.id}` : `${API_BASE_URL}${apiBase}/${doc.id}/content`}
                target={reviewBase ? undefined : "_blank"}
                rel="noreferrer"
                className="flex min-w-0 items-center gap-2 text-sm text-ink hover:underline"
              >
                <Paperclip className="h-4 w-4 shrink-0 text-subtle" aria-hidden />
                <span className="truncate">{doc.fileName}</span>
                <span className="shrink-0 text-xs text-subtle">
                  {doc.kind.toLowerCase()} · {bytes(doc.sizeBytes)}
                  {doc.visibility === "SUPPLIER_VISIBLE" ? " · supplier" : ""}
                </span>
              </a>
              <span className="flex shrink-0 items-center gap-1">
                {reviewBase ? (
                  <a
                    href={`${API_BASE_URL}${apiBase}/${doc.id}/content`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-subtle hover:text-ink"
                  >
                    download
                  </a>
                ) : null}
                {canUpload ? (
                  <Button variant="ghost" size="sm" onClick={() => remove(doc.id)} aria-label={`Delete ${doc.fileName}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
