"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { INVOICE_STATUSES } from "@proofline/shared-types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export function InvoiceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const status = params.get("status") ?? "";

  function apply(next: { search?: string; status?: string }) {
    const sp = new URLSearchParams(params.toString());
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? status;
    if (nextSearch) sp.set("search", nextSearch);
    else sp.delete("search");
    if (nextStatus) sp.set("status", nextStatus);
    else sp.delete("status");
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
        placeholder="Search by invoice number or supplier"
        className="sm:max-w-xs"
        aria-label="Search invoices"
      />
      <Select
        value={status}
        onChange={(e) => apply({ status: e.target.value })}
        className="sm:w-44"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {INVOICE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.toLowerCase()}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="secondary">
        Search
      </Button>
    </form>
  );
}
