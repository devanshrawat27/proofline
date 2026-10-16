"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createSupplierSchema,
  SUPPLIER_STATUSES,
  updateSupplierSchema,
} from "@proofline/shared-types";
import type { SupplierDto, SupplierStatus } from "@proofline/shared-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { apiFetch, ApiClientError } from "@/lib/api";

interface FormValues {
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstin: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
  status: SupplierStatus;
}

type StringFieldKey = {
  [K in keyof FormValues]: FormValues[K] extends string ? K : never;
}[keyof FormValues];

const EMPTY: FormValues = {
  code: "",
  name: "",
  contactName: "",
  email: "",
  phone: "",
  gstin: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  notes: "",
  status: "ACTIVE",
};

function fromDto(supplier: SupplierDto): FormValues {
  return {
    code: supplier.code,
    name: supplier.name,
    contactName: supplier.contactName ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    gstin: supplier.gstin ?? "",
    addressLine1: supplier.addressLine1 ?? "",
    city: supplier.city ?? "",
    state: supplier.state ?? "",
    postalCode: supplier.postalCode ?? "",
    country: supplier.country,
    notes: supplier.notes ?? "",
    status: supplier.status,
  };
}

export function SupplierForm({
  mode,
  supplier,
  canWrite,
}: {
  mode: "create" | "edit";
  supplier?: SupplierDto;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(supplier ? fromDto(supplier) : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!canWrite) {
    return (
      <Alert tone="info">
        Your role can view suppliers but not create or edit them. Ask an owner or procurement
        manager for access.
      </Alert>
    );
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});
    setSuccess(null);

    const schema = mode === "create" ? createSupplierSchema : updateSupplierSchema;
    const parsed = schema.safeParse(values);
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
      if (mode === "create") {
        await apiFetch<SupplierDto>("/api/v1/suppliers", { method: "POST", body: parsed.data });
        setValues(EMPTY);
        setSuccess("Supplier created.");
      } else if (supplier) {
        await apiFetch<SupplierDto>(`/api/v1/suppliers/${supplier.id}`, {
          method: "PATCH",
          body: parsed.data,
        });
        setSuccess("Changes saved.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to save the supplier.");
    } finally {
      setSubmitting(false);
    }
  }

  function field(
    name: StringFieldKey,
    label: string,
    props: { placeholder?: string; type?: string } = {},
  ) {
    return (
      <div>
        <Label htmlFor={`supplier-${name}`}>{label}</Label>
        <Input
          id={`supplier-${name}`}
          type={props.type ?? "text"}
          placeholder={props.placeholder}
          value={values[name]}
          onChange={(e) => set(name, e.target.value)}
        />
        <FieldError>{errors[name]}</FieldError>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {field("code", "Supplier code", { placeholder: "SUP-0001" })}
        {field("name", "Supplier name", { placeholder: "Acme Components" })}
        {field("contactName", "Contact person")}
        {field("email", "Email", { type: "email", placeholder: "orders@supplier.com" })}
        {field("phone", "Phone")}
        {field("gstin", "GSTIN / Tax ID")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="supplier-addressLine1">Address</Label>
          <Input
            id="supplier-addressLine1"
            value={values.addressLine1}
            onChange={(e) => set("addressLine1", e.target.value)}
            placeholder="Street, building, area"
          />
          <FieldError>{errors.addressLine1}</FieldError>
        </div>
        {field("city", "City")}
        {field("state", "State")}
        {field("postalCode", "Postal code")}
        <div>
          <Label htmlFor="supplier-country">Country</Label>
          <Input
            id="supplier-country"
            value={values.country}
            maxLength={2}
            onChange={(e) => set("country", e.target.value.toUpperCase())}
          />
          <FieldError>{errors.country}</FieldError>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="supplier-status">Status</Label>
          <Select
            id="supplier-status"
            value={values.status}
            onChange={(e) => set("status", e.target.value as SupplierStatus)}
          >
            {SUPPLIER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.toLowerCase()}
              </option>
            ))}
          </Select>
          <FieldError>{errors.status}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="supplier-notes">Notes</Label>
          <Textarea
            id="supplier-notes"
            rows={3}
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Internal notes about this supplier"
          />
          <FieldError>{errors.notes}</FieldError>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={submitting}>
          {submitting ? "Saving…" : mode === "create" ? "Create supplier" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
