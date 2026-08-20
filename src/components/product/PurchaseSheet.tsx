"use client";

import { useEffect } from "react";
import type { ProductDTO } from "@/lib/product-dto";
import { VariantSelector } from "@/components/product/VariantSelector";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { AddonSelector } from "@/components/product/AddonSelector";
import { formatCentsBRL } from "@/lib/money";
import { FallbackImg } from "@/components/ui/FallbackMedia";

type BuyState = "idle" | "loading" | "error";

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Bottom sheet opened by StickyBuyBar — mirrors the reference marketplace app's
// "Model / quantity / Seguros / Compre agora" purchase flow. Reuses the same
// variant/quantity selectors already on the page so state never diverges.
export function PurchaseSheet({
  open,
  onClose,
  product,
  imageUrl,
  priceCents,
  compareAtPriceCents,
  stock,
  selectedVariantId,
  onSelectVariant,
  quantity,
  onQuantityChange,
  selectedAddonIds,
  onToggleAddon,
  totalCents,
  disabled,
  disabledReason,
  state,
  errorMessage,
  onBuy,
}: {
  open: boolean;
  onClose: () => void;
  product: ProductDTO;
  imageUrl: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  selectedVariantId: string | null;
  onSelectVariant: (id: string) => void;
  quantity: number;
  onQuantityChange: (next: number) => void;
  selectedAddonIds: string[];
  onToggleAddon: (id: string) => void;
  totalCents: number;
  disabled: boolean;
  disabledReason?: string;
  state: BuyState;
  errorMessage?: string | null;
  onBuy: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const cover = imageUrl || product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-2xl bg-surface shadow-2xl animate-[sheet-up_0.22s_ease-out]">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-neutral-100">
              <FallbackImg src={cover} alt="" className="h-full w-full object-cover" placeholder={null} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-price">{formatCentsBRL(priceCents)}</p>
              {compareAtPriceCents && (
                <p className="text-xs text-foreground/40 line-through">{formatCentsBRL(compareAtPriceCents)}</p>
              )}
              <p className="text-xs text-foreground/50">
                {stock > 0 ? `Estoque: ${stock}` : <span className="font-medium text-price">Esgotado</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-foreground/60 hover:bg-black/5 active:bg-black/10"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-5">
            <VariantSelector variants={product.variants} selectedId={selectedVariantId} onSelect={onSelectVariant} />
            <QuantitySelector quantity={quantity} max={Math.max(0, stock)} onChange={onQuantityChange} />
            <AddonSelector addons={product.addons} selectedIds={selectedAddonIds} onToggle={onToggleAddon} />
          </div>
        </div>

        <div className="safe-bottom border-t border-border px-4 py-3">
          {errorMessage && (
            <p role="alert" className="mb-2 text-center text-xs font-medium text-price">
              {errorMessage}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-foreground/50">Total</p>
              <p className="truncate text-lg font-bold text-price">{formatCentsBRL(totalCents)}</p>
            </div>
            <button
              type="button"
              onClick={onBuy}
              disabled={disabled || state === "loading"}
              className="flex h-12 min-w-[180px] items-center justify-center rounded-lg bg-brand px-6 text-sm font-semibold text-white transition-colors active:bg-brand-dark disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            >
              {state === "loading" ? "Processando…" : disabled ? disabledReason ?? "Indisponível" : "Compre agora"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes sheet-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
