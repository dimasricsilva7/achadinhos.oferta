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

// Presentational delivery block — free-text copy authored in the admin. No real
// freight calculation happens here (see README roadmap); never used for price or
// checkout logic.
export function ShippingInfo({ shipping }: { shipping: ShippingInfoDTO }) {
  if (!shipping.enabled) return null;
  if (!shipping.deliveryText && !shipping.free) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
      <TruckIcon />
      <div className="flex flex-1 flex-col gap-0.5 text-sm">
        {shipping.deliveryText && <p className="font-medium text-foreground">{shipping.deliveryText}</p>}
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
        <button type="button" className="w-fit text-xs text-brand">
          Clique para ver mais ›
        </button>
      </div>
    </div>
  );
}
