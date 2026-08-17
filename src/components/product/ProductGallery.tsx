"use client";

import { useRef, useState } from "react";
import type { ProductImageDTO, ProductVariantDTO } from "@/lib/product-dto";

export function ProductGallery({
  images,
  activeUrl,
  variants = [],
  selectedVariantId = null,
  onSelectVariant,
}: {
  images: ProductImageDTO[];
  activeUrl: string | null;
  variants?: ProductVariantDTO[];
  selectedVariantId?: string | null;
  onSelectVariant?: (id: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const items = images.length > 0 ? images : [{ id: "placeholder", url: "", alt: "", type: "image", sortOrder: 0, isPrimary: true }];

  function scrollTo(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setIndex(i);
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <div className="relative bg-surface">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((img, i) => (
          <div key={img.id} className="flex h-full w-full flex-shrink-0 snap-center items-center justify-center bg-neutral-100">
            {img.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.url}
                alt={img.alt || ""}
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-foreground/40">Sem imagem</div>
            )}
          </div>
        ))}
      </div>

      {activeUrl && (
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
          Variação selecionada
        </div>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((img, i) => (
            <button
              key={img.id}
              aria-label={`Ver imagem ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
            />
          ))}
        </div>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
          {index + 1}/{items.length}
        </div>
      )}

      {variants.length > 0 && (
        <div className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2">
          <span className="flex-shrink-0 text-xs text-foreground/50">
            {variants.length} {variants.length === 1 ? "Variação Disponível" : "Variações Disponíveis"}
          </span>
          <div className="flex flex-1 gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {variants.map((v) => {
              const selected = v.id === selectedVariantId;
              const thumb = v.imageUrl ?? items[0]?.url ?? "";
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-label={v.label}
                  aria-pressed={selected}
                  onClick={() => onSelectVariant?.(v.id)}
                  className={`h-9 w-9 flex-shrink-0 overflow-hidden rounded-md border-2 bg-neutral-100 transition-colors duration-150 ${
                    selected ? "border-brand" : "border-transparent"
                  }`}
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
