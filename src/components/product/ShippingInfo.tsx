"use client";

import { useState } from "react";
import type { ShippingInfoDTO } from "@/lib/product-dto";
import { formatCentsBRL } from "@/lib/money";

function TruckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0 text-foreground/60">
      <path d="M1 4h13v11H1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8h4l4 4v3h-8V8Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}

// Applies the "00000-000" mask as the user types, digits only, capped at 8 digits.
function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// Format-only check (8 digits) — deliberately NOT a real check-digit/postal-range
// validation, and there is no lookup against any correios/CEP API. Same philosophy
// as the rest of this block: presentational estimate, never real freight logic.
function isCompleteCep(masked: string): boolean {
  return /^\d{5}-\d{3}$/.test(masked);
}

// Estimated delivery = today + 2 calendar days. Purely a presentational estimate
// (no real carrier/freight calculation exists in this project — see README
// roadmap); never used for price or checkout logic.
function estimateDeliveryLabel(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `Chega em até ${day}/${month}`;
}

// Presentational delivery block — free-text copy authored in the admin, plus a
// client-side-only CEP field (Refinamento 2) that estimates a delivery date once the
// user types a well-formed CEP. No real freight/CEP calculation happens here (see
// README roadmap); never used for price or checkout logic, and the CEP is never
// persisted anywhere (component state only).
export function ShippingInfo({ shipping }: { shipping: ShippingInfoDTO }) {
  const [cep, setCep] = useState("");

  if (!shipping.enabled) return null;

  const cepComplete = isCompleteCep(cep);
  const estimatedDelivery = cepComplete ? estimateDeliveryLabel() : null;

  if (!shipping.deliveryText && !shipping.free && !shipping.enabled) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
      <TruckIcon />
      <div className="flex flex-1 flex-col gap-2 text-sm">
        <div className="flex flex-col gap-0.5">
          {estimatedDelivery ? (
            <p className="font-medium text-foreground">{estimatedDelivery}</p>
          ) : (
            shipping.deliveryText && <p className="font-medium text-foreground">{shipping.deliveryText}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {shipping.free && <span className="font-medium text-success">Frete grátis</span>}
            {shipping.originalPriceCents !== null && (
              <span className="text-foreground/40 line-through">{formatCentsBRL(shipping.originalPriceCents)}</span>
            )}
            {shipping.finalPriceCents !== null && (
              <span className="font-medium text-foreground/70">
                {shipping.finalPriceCents === 0 ? "R$0,00 com cupom" : formatCentsBRL(shipping.finalPriceCents)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
            inputMode="numeric"
            placeholder="00000-000"
            aria-label="CEP para calcular o prazo de entrega"
            maxLength={9}
            className="w-28 rounded border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-brand focus:outline-none"
          />
          <span className="text-xs text-foreground/50">
            {cepComplete ? "Prazo estimado para o seu CEP" : "Digite seu CEP para calcular o prazo"}
          </span>
        </div>
      </div>
    </div>
  );
}
