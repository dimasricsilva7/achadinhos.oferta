"use client";

import { useMemo, useState } from "react";
import type { ProductDTO } from "@/lib/product-dto";
import { ProductHeader } from "@/components/product/ProductHeader";
import { ProductGallery } from "@/components/product/ProductGallery";
import { OfferBanner } from "@/components/product/OfferBanner";
import { PriceBlock } from "@/components/product/PriceBlock";
import { RatingSold } from "@/components/product/RatingSold";
import { VariantSelector } from "@/components/product/VariantSelector";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { Benefits } from "@/components/product/Benefits";
import { Description } from "@/components/product/Description";
import { Specifications } from "@/components/product/Specifications";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { discountPercent } from "@/lib/money";

export function ProductExperience({ product }: { product: ProductDTO }) {
  const firstGroup = product.variants[0]?.groupName ?? null;
  const requiresVariant = product.variants.length > 0;

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstGroup ? product.variants.find((v) => v.groupName === firstGroup && v.stock > 0)?.id ?? product.variants[0]?.id ?? null : null
  );
  const [quantity, setQuantity] = useState(1);
  const [buyState, setBuyState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const effectivePriceCents = selectedVariant?.priceCents ?? product.priceCents;
  const effectiveCompareAtPriceCents = selectedVariant?.priceCents ? null : product.compareAtPriceCents;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
  const effectiveImageUrl = selectedVariant?.imageUrl ?? null;

  const outOfStock = effectiveStock <= 0;
  const missingVariant = requiresVariant && !selectedVariantId;

  let disabledReason: string | undefined;
  if (missingVariant) disabledReason = "Selecione uma variação";
  else if (outOfStock) disabledReason = "Esgotado";
  else if (!product.hasCheckout) disabledReason = "Indisponível para compra";

  async function handleBuy() {
    setErrorMessage(null);
    setBuyState("loading");
    try {
      const res = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Não foi possível iniciar a compra.");
        setBuyState("error");
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setErrorMessage("Falha de conexão. Tente novamente.");
      setBuyState("error");
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col bg-background">
      <ProductHeader title={product.name} />

      <ProductGallery images={product.images} activeUrl={effectiveImageUrl} />

      <OfferBanner
        offerEnabled={product.offerEnabled}
        discountPercent={discountPercent(effectivePriceCents, effectiveCompareAtPriceCents)}
        offerExpiresAtISO={product.offerExpiresAtISO}
      />

      <div className="flex flex-col gap-4 px-3 py-4">
        <PriceBlock priceCents={effectivePriceCents} compareAtPriceCents={effectiveCompareAtPriceCents} />

        <div>
          <h1 className="text-base font-semibold leading-snug text-foreground">{product.name}</h1>
          {product.shortDescription && (
            <p className="mt-1 text-sm text-foreground/60">{product.shortDescription}</p>
          )}
        </div>

        <RatingSold ratingAverage={product.ratingAverage} ratingCount={product.ratingCount} soldCount={product.soldCount} />

        <p className="text-xs text-foreground/50">
          {outOfStock ? <span className="font-medium text-price">Esgotado</span> : `Estoque: ${effectiveStock}`}
        </p>

        <VariantSelector variants={product.variants} selectedId={selectedVariantId} onSelect={setSelectedVariantId} />

        <QuantitySelector quantity={quantity} max={Math.max(0, effectiveStock)} onChange={setQuantity} />

        <Benefits benefits={product.benefits} />
        <Description text={product.description} />
        <Specifications specs={product.specifications} />
      </div>

      <div className="h-2" />

      <StickyBuyBar
        totalCents={effectivePriceCents * quantity}
        disabled={Boolean(disabledReason)}
        disabledReason={disabledReason}
        state={buyState}
        errorMessage={errorMessage}
        onBuy={handleBuy}
      />
    </div>
  );
}
