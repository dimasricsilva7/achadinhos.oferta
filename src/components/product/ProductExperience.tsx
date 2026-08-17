"use client";

import { useMemo, useState } from "react";
import type { ProductDTO } from "@/lib/product-dto";
import { ProductHeader } from "@/components/product/ProductHeader";
import { ProductGallery } from "@/components/product/ProductGallery";
import { OfferBanner } from "@/components/product/OfferBanner";
import { PriceBlock } from "@/components/product/PriceBlock";
import { SoldBadge } from "@/components/product/RatingSold";
import { OfferChips } from "@/components/product/OfferChips";
import { ShippingInfo } from "@/components/product/ShippingInfo";
import { VariantSelector } from "@/components/product/VariantSelector";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { Benefits } from "@/components/product/Benefits";
import { Description } from "@/components/product/Description";
import { Specifications } from "@/components/product/Specifications";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { PurchaseSheet } from "@/components/product/PurchaseSheet";
import { ReviewsSection } from "@/components/product/ReviewsSection";
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const effectivePriceCents = selectedVariant?.priceCents ?? product.priceCents;
  const effectiveCompareAtPriceCents = selectedVariant?.priceCents ? null : product.compareAtPriceCents;
  const effectiveStock = selectedVariant ? selectedVariant.stock : product.stock;
  const effectiveImageUrl = selectedVariant?.imageUrl ?? null;

  const addonsCents = useMemo(
    () =>
      product.addons
        .filter((a) => selectedAddonIds.includes(a.id))
        .reduce((sum, a) => sum + a.priceCents, 0),
    [product.addons, selectedAddonIds]
  );

  const outOfStock = effectiveStock <= 0;
  const missingVariant = requiresVariant && !selectedVariantId;

  let disabledReason: string | undefined;
  if (missingVariant) disabledReason = "Selecione uma variação";
  else if (outOfStock) disabledReason = "Esgotado";
  else if (!product.hasCheckout) disabledReason = "Indisponível para compra";

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

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
          addonIds: selectedAddonIds,
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
      <ProductHeader title={product.name} onCartClick={() => setIsSheetOpen(true)} />

      <ProductGallery
        images={product.images}
        activeUrl={effectiveImageUrl}
        variants={product.variants}
        selectedVariantId={selectedVariantId}
        onSelectVariant={setSelectedVariantId}
      />

      <OfferBanner
        offerEnabled={product.offerEnabled}
        discountPercent={discountPercent(effectivePriceCents, effectiveCompareAtPriceCents)}
        offerExpiresAtISO={product.offerExpiresAtISO}
      />

      <div className="flex flex-col gap-4 px-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <PriceBlock priceCents={effectivePriceCents} compareAtPriceCents={effectiveCompareAtPriceCents} />
          <SoldBadge soldCount={product.soldCount} />
        </div>

        <OfferChips chips={product.offerChips} />

        <div>
          {product.officialBadge && (
            <span className="mb-1 inline-block rounded bg-brand px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Oficial
            </span>
          )}
          <h1 className="text-base font-semibold leading-snug text-foreground">{product.name}</h1>
          {product.shortDescription && (
            <p className="mt-1 text-sm text-foreground/60">{product.shortDescription}</p>
          )}
        </div>

        <ShippingInfo shipping={product.shipping} />

        <p className="text-xs text-foreground/50">
          {outOfStock ? <span className="font-medium text-price">Esgotado</span> : `Estoque: ${effectiveStock}`}
        </p>

        <VariantSelector variants={product.variants} selectedId={selectedVariantId} onSelect={setSelectedVariantId} />

        <QuantitySelector quantity={quantity} max={Math.max(0, effectiveStock)} onChange={setQuantity} />

        <Benefits benefits={product.benefits} />
        <Description text={product.description} />
        <Specifications specs={product.specifications} />
        <ReviewsSection
          reviews={product.reviews}
          ratingAverage={product.ratingAverage}
          ratingCount={product.ratingCount}
          reviewHighlights={product.reviewHighlights}
        />
      </div>

      <div className="h-2" />

      <StickyBuyBar
        totalCents={effectivePriceCents * quantity + addonsCents}
        disabled={Boolean(disabledReason)}
        disabledReason={disabledReason}
        state={buyState}
        errorMessage={errorMessage}
        onBuy={() => setIsSheetOpen(true)}
      />

      <PurchaseSheet
        open={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        product={product}
        imageUrl={effectiveImageUrl}
        priceCents={effectivePriceCents}
        compareAtPriceCents={effectiveCompareAtPriceCents}
        stock={effectiveStock}
        selectedVariantId={selectedVariantId}
        onSelectVariant={setSelectedVariantId}
        quantity={quantity}
        onQuantityChange={setQuantity}
        selectedAddonIds={selectedAddonIds}
        onToggleAddon={toggleAddon}
        totalCents={effectivePriceCents * quantity + addonsCents}
        disabled={Boolean(disabledReason)}
        disabledReason={disabledReason}
        state={buyState}
        errorMessage={errorMessage}
        onBuy={handleBuy}
      />
    </div>
  );
}
