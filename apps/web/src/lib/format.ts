/** Display helpers. Storage stays integer minor units; these only format for UI. */

export function formatMinor(minor: number, currency = "INR"): string {
  const fractionDigits = minor % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function formatQuantity(value: string | number, locale = "en-IN"): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(n);
}
