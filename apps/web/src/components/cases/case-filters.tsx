"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CASE_PRIORITIES, CASE_STATUSES } from "@proofline/shared-types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { humanize, statusLabel } from "./case-status";

export function CaseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const status = params.get("status") ?? "";
  const priority = params.get("priority") ?? "";

  function apply(next: { search?: string; status?: string; priority?: string }) {
    const sp = new URLSearchParams(params.toString());
    const values = { search, status, priority, ...next };
    for (const key of ["search", "status", "priority"] as const) {
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
        placeholder="Search case number, summary or supplier"
        className="sm:max-w-xs"
        aria-label="Search cases"
      />
      <Select value={status} onChange={(e) => apply({ status: e.target.value })} className="sm:w-52" aria-label="Filter by status">
        <option value="">All statuses</option>
        {CASE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </Select>
      <Select value={priority} onChange={(e) => apply({ priority: e.target.value })} className="sm:w-36" aria-label="Filter by priority">
        <option value="">All priorities</option>
        {CASE_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {humanize(p)}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
