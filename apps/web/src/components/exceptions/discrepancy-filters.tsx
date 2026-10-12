"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DISCREPANCY_SEVERITIES,
  DISCREPANCY_STATUSES,
  DISCREPANCY_TYPES,
} from "@proofline/shared-types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { discrepancyTypeLabel, humanize } from "@/components/invoices/status";

export function DiscrepancyFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const severity = params.get("severity") ?? "";
  const type = params.get("type") ?? "";
  const status = params.get("status") ?? "";

  function apply(next: Partial<Record<"search" | "severity" | "type" | "status", string>>) {
    const sp = new URLSearchParams(params.toString());
    const values = { search, severity, type, status, ...next };
    for (const key of ["search", "severity", "type", "status"] as const) {
      if (values[key]) sp.set(key, values[key]);
      else sp.delete(key);
    }
    sp.delete("page");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply({ search });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search explanation or PO number"
        className="sm:max-w-xs"
        aria-label="Search discrepancies"
      />
      <Select value={severity} onChange={(e) => apply({ severity: e.target.value })} className="sm:w-36" aria-label="Filter by severity">
        <option value="">All severities</option>
        {DISCREPANCY_SEVERITIES.map((s) => (
          <option key={s} value={s}>
            {s.toLowerCase()}
          </option>
        ))}
      </Select>
      <Select value={type} onChange={(e) => apply({ type: e.target.value })} className="sm:w-48" aria-label="Filter by type">
        <option value="">All types</option>
        {DISCREPANCY_TYPES.map((t) => (
          <option key={t} value={t}>
            {discrepancyTypeLabel(t).toLowerCase()}
          </option>
        ))}
      </Select>
      <Select value={status} onChange={(e) => apply({ status: e.target.value })} className="sm:w-36" aria-label="Filter by status">
        <option value="">All statuses</option>
        {DISCREPANCY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {humanize(s)}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
