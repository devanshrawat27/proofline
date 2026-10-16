"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CASE_PRIORITIES, createCaseSchema } from "@proofline/shared-types";
import type { CaseDto, CasePriority } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";
import { humanize } from "./case-status";

export interface DiscrepancyOption {
  id: string;
  label: string;
}

export function CaseForm({
  discrepancies,
  members,
  initialDiscrepancyIds = [],
  canWrite,
}: {
  discrepancies: DiscrepancyOption[];
  members: { id: string; name: string }[];
  initialDiscrepancyIds?: string[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialDiscrepancyIds);
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<CasePriority>("NORMAL");
  const [assigneeUserId, setAssigneeUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!canWrite) {
    return <Alert tone="info">Your role can view cases but not create them.</Alert>;
  }

  function toggle(id: string) {
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    const parsed = createCaseSchema.safeParse({
      discrepancyIds: selected,
      summary,
      priority,
      assigneeUserId: assigneeUserId || undefined,
      dueDate: dueDate || undefined,
    });
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
      const created = await apiFetch<CaseDto>("/api/v1/cases", { method: "POST", body: parsed.data });
      router.push(`/cases/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to create the case.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div>
        <Label>Discrepancies to include</Label>
        {errors.discrepancyIds ? <FieldError>{errors.discrepancyIds}</FieldError> : null}
        <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-line p-3">
          {discrepancies.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => toggle(item.id)}
                className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand/40"
              />
              <span className="text-subtle">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="case-summary">Summary</Label>
        <Input
          id="case-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Short description of the dispute"
        />
        <FieldError>{errors.summary}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="case-priority">Priority</Label>
          <Select id="case-priority" value={priority} onChange={(e) => setPriority(e.target.value as CasePriority)}>
            {CASE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {humanize(p)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="case-assignee">Assignee</Label>
          <Select id="case-assignee" value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="case-due">Due date</Label>
          <Input id="case-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" loading={submitting}>
          {submitting ? "Creating…" : "Create case"}
        </Button>
      </div>
    </form>
  );
}
