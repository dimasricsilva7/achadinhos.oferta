// All money is stored and computed as integer cents. Never use floats for currency.

export function formatCentsBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function discountPercent(priceCents: number, compareAtPriceCents: number | null): number | null {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return null;
  return Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100);
}

// Admin form helpers: the UI takes reais ("49,90"), storage is always integer cents.
export function centsToReaisInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

export function reaisInputToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (normalized === "") return null;
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100);
}
