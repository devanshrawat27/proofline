"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

const ENTITY_TYPES = ["PurchaseOrder", "Receipt", "Invoice", "DisputeCase"];

export function AuditFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const entityType = params.get("entityType") ?? "";

  function apply(next: { search?: string; entityType?: string }) {
    const sp = new URLSearchParams(params.toString());
    const values = { search, entityType, ...next };
    for (const key of ["search", "entityType"] as const) {
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
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search summary"
        className="sm:max-w-xs"
        aria-label="Search audit events"
      />
      <Select
        value={entityType}
        onChange={(e) => apply({ entityType: e.target.value })}
        className="sm:w-48"
        aria-label="Filter by entity type"
      >
        <option value="">All entities</option>
        {ENTITY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
