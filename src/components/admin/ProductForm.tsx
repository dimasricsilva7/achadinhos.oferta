"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_STATUS, REVIEW_STATUS } from "@/lib/constants";
import { centsToReaisInput, reaisInputToCents } from "@/lib/money";

type ImageRow = { id?: string; url: string; alt: string; type: string; sortOrder: number; isPrimary: boolean };
type VariantRow = {
  id?: string;
  groupName: string;
  label: string;
  sku: string;
  imageUrl: string;
  priceCents: number | null;
  stock: number;
  checkoutUrl: string;
  sortOrder: number;
};
type SpecRow = { id?: string; label: string; value: string; sortOrder: number };
type BenefitRow = { id?: string; icon: string; label: string; sortOrder: number };
type AddonRow = {
  id?: string;
  title: string;
  description: string;
  durationLabel: string;
  priceCents: number | null;
  sortOrder: number;
  enabled: boolean;
};
type ReviewMediaRow = { id?: string; url: string; type: string; thumbnailUrl: string; sortOrder: number };
type ReviewRow = {
  id?: string;
  customerName: string;
  avatarUrl: string;
  rating: number;
  variantLabel: string;
  comment: string;
  helpfulCount: number;
  status: string;
  media: ReviewMediaRow[];
};
type ReviewHighlightRow = { label: string; text: string };
type OfferChipRow = { label: string };

export type ProductFormInitial = {
  id?: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  status: string;
  sku: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  ratingAverage: number;
  ratingCount: number;
  soldCount: number;
  offerEnabled: boolean;
  offerExpiresAt: string | null; // ISO
  offerChips: OfferChipRow[];
  officialBadge: boolean;
  shippingEnabled: boolean;
  shippingDeliveryText: string | null;
  shippingFree: boolean;
  shippingOriginalPriceCents: number | null;
  shippingFinalPriceCents: number | null;
  checkoutUrl: string | null;
  images: ImageRow[];
  variants: { id: string; groupName: string; label: string; sku: string | null; imageUrl: string | null; priceCents: number | null; stock: number; checkoutUrl: string | null; sortOrder: number }[];
  specifications: SpecRow[];
  benefits: BenefitRow[];
  addons: { id: string; title: string; description: string | null; durationLabel: string | null; priceCents: number; sortOrder: number; enabled: boolean }[];
  reviews: {
    id: string;
    customerName: string;
    avatarUrl: string | null;
    rating: number;
    variantLabel: string | null;
    comment: string;
    helpfulCount: number;
    status: string;
    media: { id: string; url: string; type: string; thumbnailUrl: string | null; sortOrder: number }[];
  }[];
  reviewHighlights: ReviewHighlightRow[];
};

const TABS = [
  "Geral",
  "Preços & Oferta",
  "Entrega",
  "Imagens",
  "Variações",
  "Especificações",
  "Benefícios",
  "Seguros",
  "Avaliações",
  "Checkout",
] as const;

function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ProductForm({ initial }: { initial?: ProductFormInitial }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Geral");

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [price, setPrice] = useState(centsToReaisInput(initial?.priceCents ?? null));
  const [compareAtPrice, setCompareAtPrice] = useState(centsToReaisInput(initial?.compareAtPriceCents ?? null));
  const [stock, setStock] = useState(initial?.stock ?? 0);
  const [ratingAverage, setRatingAverage] = useState(initial?.ratingAverage ?? 0);
  const [ratingCount, setRatingCount] = useState(initial?.ratingCount ?? 0);
  const [soldCount, setSoldCount] = useState(initial?.soldCount ?? 0);
  const [offerEnabled, setOfferEnabled] = useState(initial?.offerEnabled ?? false);
  const [offerExpiresAt, setOfferExpiresAt] = useState(toLocalDatetimeInput(initial?.offerExpiresAt ?? null));
  const [offerChips, setOfferChips] = useState<OfferChipRow[]>(initial?.offerChips ?? []);
  const [officialBadge, setOfficialBadge] = useState(initial?.officialBadge ?? false);
  const [shippingEnabled, setShippingEnabled] = useState(initial?.shippingEnabled ?? true);
  const [shippingDeliveryText, setShippingDeliveryText] = useState(initial?.shippingDeliveryText ?? "");
  const [shippingFree, setShippingFree] = useState(initial?.shippingFree ?? true);
  const [shippingOriginalPrice, setShippingOriginalPrice] = useState(centsToReaisInput(initial?.shippingOriginalPriceCents ?? null));
  const [shippingFinalPrice, setShippingFinalPrice] = useState(centsToReaisInput(initial?.shippingFinalPriceCents ?? null));
  const [checkoutUrl, setCheckoutUrl] = useState(initial?.checkoutUrl ?? "");

  const [images, setImages] = useState<ImageRow[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    (initial?.variants ?? []).map((v) => ({
      id: v.id,
      groupName: v.groupName,
      label: v.label,
      sku: v.sku ?? "",
      imageUrl: v.imageUrl ?? "",
      priceCents: v.priceCents,
      stock: v.stock,
      checkoutUrl: v.checkoutUrl ?? "",
      sortOrder: v.sortOrder,
    }))
  );
  const [specifications, setSpecifications] = useState<SpecRow[]>(initial?.specifications ?? []);
  const [benefits, setBenefits] = useState<BenefitRow[]>(initial?.benefits ?? []);
  const [addons, setAddons] = useState<AddonRow[]>(
    (initial?.addons ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? "",
      durationLabel: a.durationLabel ?? "",
      priceCents: a.priceCents,
      sortOrder: a.sortOrder,
      enabled: a.enabled,
    }))
  );
  const [reviews, setReviews] = useState<ReviewRow[]>(
    (initial?.reviews ?? []).map((r) => ({
      id: r.id,
      customerName: r.customerName,
      avatarUrl: r.avatarUrl ?? "",
      rating: r.rating,
      variantLabel: r.variantLabel ?? "",
      comment: r.comment,
      helpfulCount: r.helpfulCount,
      status: r.status,
      media: r.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        thumbnailUrl: m.thumbnailUrl ?? "",
        sortOrder: m.sortOrder,
      })),
    }))
  );
  const [reviewHighlights, setReviewHighlights] = useState<ReviewHighlightRow[]>(initial?.reviewHighlights ?? []);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorIssues, setErrorIssues] = useState<{ field: string; message: string }[]>([]);

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Falha no upload");
      return null;
    }
    return data.url as string;
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadFile(file);
      if (!url) return;
      const isVideo = file.type.startsWith("video/");
      setImages((prev) => [
        ...prev,
        { url, alt: name, type: isVideo ? "video" : "image", sortOrder: prev.length, isPrimary: prev.length === 0 },
      ]);
    } finally {
      setUploading(false);
    }
  }

  const [uploadingAvatarIndex, setUploadingAvatarIndex] = useState<number | null>(null);
  async function handleAvatarUpload(reviewIndex: number, file: File) {
    setUploadingAvatarIndex(reviewIndex);
    setError(null);
    try {
      const url = await uploadFile(file);
      if (!url) return;
      updateAt(setReviews, reviewIndex, { avatarUrl: url });
    } finally {
      setUploadingAvatarIndex(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setErrorIssues([]);

    const priceCents = reaisInputToCents(price);
    if (!priceCents) {
      setError("Informe um preço válido.");
      setSaving(false);
      setTab("Preços & Oferta");
      return;
    }

    const payload = {
      slug,
      name,
      shortDescription: shortDescription || null,
      description: description || null,
      status,
      sku: sku || null,
      priceCents,
      compareAtPriceCents: reaisInputToCents(compareAtPrice),
      stock: Number(stock),
      ratingAverage: Number(ratingAverage),
      ratingCount: Number(ratingCount),
      soldCount: Number(soldCount),
      offerEnabled,
      offerExpiresAt: offerExpiresAt ? new Date(offerExpiresAt).toISOString() : null,
      offerChips: offerChips.filter((c) => c.label.trim() !== ""),
      officialBadge,
      shippingEnabled,
      shippingDeliveryText: shippingDeliveryText || null,
      shippingFree,
      shippingOriginalPriceCents: reaisInputToCents(shippingOriginalPrice),
      shippingFinalPriceCents: reaisInputToCents(shippingFinalPrice),
      checkoutUrl: checkoutUrl || null,
      images,
      variants: variants.map((v) => ({
        ...v,
        sku: v.sku || null,
        imageUrl: v.imageUrl || null,
        checkoutUrl: v.checkoutUrl || null,
      })),
      specifications,
      benefits,
      addons: addons.map((a) => ({
        ...a,
        description: a.description || null,
        durationLabel: a.durationLabel || null,
        priceCents: a.priceCents ?? 0,
      })),
      reviews: reviews.map((r) => ({
        ...r,
        avatarUrl: r.avatarUrl || null,
        variantLabel: r.variantLabel || null,
        media: r.media.map((m) => ({ ...m, thumbnailUrl: m.thumbnailUrl || null })),
      })),
      reviewHighlights,
    };

    const url = initial?.id ? `/api/admin/products/${initial.id}` : "/api/admin/products";
    const method = initial?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Não foi possível salvar o produto.");
      if (Array.isArray(data.issues)) {
        setErrorIssues(
          data.issues.map((i: { path: (string | number)[]; message: string }) => ({
            field: i.path.join(".") || "campo",
            message: i.message,
          }))
        );
      }
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-t-lg border-b-2 px-3 py-2 text-sm transition-colors duration-150 ${
              tab === t
                ? "border-brand bg-brand/5 font-semibold text-brand"
                : "border-transparent text-foreground/60 hover:border-border hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {(error || errorIssues.length > 0) && (
        <div className="mb-4 rounded-lg border border-price/20 bg-price/10 px-3 py-2.5 text-sm text-price">
          {error && <p className="font-medium">{error}</p>}
          {errorIssues.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
              {errorIssues.map((issue, i) => (
                <li key={i}>
                  <span className="font-mono text-xs">{issue.field}</span>: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "Geral" && (
        <div className="flex flex-col gap-4">
          <Field label="Nome">
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </Field>
          <Field label="Slug (URL)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gerado automaticamente se vazio" className="input" />
          </Field>
          <Field label="Descrição curta">
            <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="input" />
          </Field>
          <Field label="Descrição completa">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="input" />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
              {PRODUCT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="SKU">
            <input value={sku} onChange={(e) => setSku(e.target.value)} className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={officialBadge} onChange={(e) => setOfficialBadge(e.target.checked)} />
            Selo &quot;Oficial&quot; antes do nome do produto na loja
          </label>
        </div>
      )}

      {tab === "Preços & Oferta" && (
        <div className="flex flex-col gap-4">
          <Field label="Preço (R$)">
            <input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" className="input" />
          </Field>
          <Field label="Preço original / de (R$) — opcional, para mostrar desconto">
            <input value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} inputMode="decimal" className="input" />
          </Field>
          <Field label="Estoque">
            <input type="number" min={0} value={stock} onChange={(e) => setStock(Number(e.target.value))} className="input" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Nota média (0-5)">
              <input type="number" min={0} max={5} step={0.1} value={ratingAverage} onChange={(e) => setRatingAverage(Number(e.target.value))} className="input" />
            </Field>
            <Field label="Nº avaliações">
              <input type="number" min={0} value={ratingCount} onChange={(e) => setRatingCount(Number(e.target.value))} className="input" />
            </Field>
            <Field label="Vendidos">
              <input type="number" min={0} value={soldCount} onChange={(e) => setSoldCount(Number(e.target.value))} className="input" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={offerEnabled} onChange={(e) => setOfferEnabled(e.target.checked)} />
            Oferta relâmpago ativa
          </label>
          {offerEnabled && (
            <Field label="Prazo de referência (metadado — não controla mais o cronômetro exibido na loja)">
              <input type="datetime-local" value={offerExpiresAt} onChange={(e) => setOfferExpiresAt(e.target.value)} className="input" />
              <p className="mt-1 text-xs text-foreground/50">
                O cronômetro da loja agora sempre mostra 15:00 contando a partir do acesso de cada visitante (reinicia
                por sessão do navegador). Este campo fica só como histórico/metadado — não precisa preencher.
              </p>
            </Field>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground/80">
              Chips de oferta (pílulas decorativas exibidas abaixo do preço na loja)
            </p>
            {offerChips.map((chip, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder='Ex.: "Compre R$100 e ganhe R$1 off"'
                  value={chip.label}
                  onChange={(e) => updateAt(setOfferChips, i, { label: e.target.value })}
                  className="input"
                />
                <button type="button" onClick={() => setOfferChips((prev) => prev.filter((_, idx) => idx !== i))} className="text-xs text-price">
                  Remover
                </button>
              </div>
            ))}
            {offerChips.length < 10 && (
              <button
                type="button"
                onClick={() => setOfferChips((prev) => [...prev, { label: "" }])}
                className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 transition-colors duration-150 hover:border-brand hover:text-brand"
              >
                + Adicionar chip
              </button>
            )}
          </div>
        </div>
      )}

      {tab === "Entrega" && (
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shippingEnabled} onChange={(e) => setShippingEnabled(e.target.checked)} />
            Mostrar bloco de entrega na página do produto
          </label>
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            Texto livre e informativo — não há cálculo real de frete. Não afeta o preço nem o checkout.
          </p>
          {shippingEnabled && (
            <>
              <Field label='Texto de entrega (ex.: "Chega entre 13 e 15/ago")'>
                <input
                  value={shippingDeliveryText}
                  onChange={(e) => setShippingDeliveryText(e.target.value)}
                  placeholder="Chega entre 13 e 15/ago"
                  className="input"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={shippingFree} onChange={(e) => setShippingFree(e.target.checked)} />
                Frete grátis
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preço original do frete (R$) — riscado">
                  <input value={shippingOriginalPrice} onChange={(e) => setShippingOriginalPrice(e.target.value)} inputMode="decimal" className="input" />
                </Field>
                <Field label="Preço final do frete (R$) — 0 = grátis com cupom">
                  <input value={shippingFinalPrice} onChange={(e) => setShippingFinalPrice(e.target.value)} inputMode="decimal" className="input" />
                </Field>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "Imagens" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-36">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-neutral-100">
                  {img.url &&
                    (img.type === "video" ? (
                      <video src={img.url} className="h-full w-full object-cover" muted loop />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    ))}
                  {img.type === "video" && (
                    <span className="absolute right-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-medium text-white">
                      Vídeo
                    </span>
                  )}
                </div>
                <input
                  placeholder="URL da imagem/vídeo"
                  value={img.url}
                  onChange={(e) => updateAt(setImages, i, { url: e.target.value })}
                  className="input mt-1 text-xs"
                />
                <select
                  value={img.type}
                  onChange={(e) => updateAt(setImages, i, { type: e.target.value })}
                  className="input mt-1 text-xs"
                >
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                </select>
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="mt-1 w-full text-xs text-price"
                >
                  Remover
                </button>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name="primaryImage"
                    checked={img.isPrimary}
                    onChange={() => setImages((prev) => prev.map((im, idx) => ({ ...im, isPrimary: idx === i })))}
                  />
                  Principal
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setImages((prev) => [...prev, { url: "", alt: name, type: "image", sortOrder: prev.length, isPrimary: prev.length === 0 }])}
            className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
          >
            + Adicionar imagem/vídeo por URL
          </button>
          <p className="text-xs text-foreground/50">Ou envie um arquivo (imagem até 5MB, vídeo até 20MB):</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            disabled={uploading}
          />
          {uploading && <p className="text-xs text-foreground/50">Enviando…</p>}
        </div>
      )}

      {tab === "Variações" && (
        <div className="flex flex-col gap-3">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 md:grid-cols-4">
              <input placeholder="Grupo (ex: Cor)" value={v.groupName} onChange={(e) => updateAt(setVariants, i, { groupName: e.target.value })} className="input" />
              <input placeholder="Opção (ex: Preto)" value={v.label} onChange={(e) => updateAt(setVariants, i, { label: e.target.value })} className="input" />
              <input
                placeholder="Preço (R$) — opcional"
                value={v.priceCents !== null ? centsToReaisInput(v.priceCents) : ""}
                onChange={(e) => updateAt(setVariants, i, { priceCents: reaisInputToCents(e.target.value) })}
                className="input"
              />
              <input type="number" min={0} placeholder="Estoque" value={v.stock} onChange={(e) => updateAt(setVariants, i, { stock: Number(e.target.value) })} className="input" />
              <input placeholder="URL da imagem" value={v.imageUrl} onChange={(e) => updateAt(setVariants, i, { imageUrl: e.target.value })} className="input col-span-2" />
              <input placeholder="Checkout específico (opcional)" value={v.checkoutUrl} onChange={(e) => updateAt(setVariants, i, { checkoutUrl: e.target.value })} className="input col-span-2" />
              <button type="button" onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))} className="col-span-full text-left text-xs text-price">
                Remover variação
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVariants((prev) => [...prev, { groupName: "Cor", label: "", sku: "", imageUrl: "", priceCents: null, stock: 0, checkoutUrl: "", sortOrder: prev.length }])}
            className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
          >
            + Adicionar variação
          </button>
        </div>
      )}

      {tab === "Especificações" && (
        <div className="flex flex-col gap-3">
          {specifications.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input placeholder="Especificação" value={s.label} onChange={(e) => updateAt(setSpecifications, i, { label: e.target.value })} className="input" />
              <input placeholder="Valor" value={s.value} onChange={(e) => updateAt(setSpecifications, i, { value: e.target.value })} className="input" />
              <button type="button" onClick={() => setSpecifications((prev) => prev.filter((_, idx) => idx !== i))} className="text-xs text-price">
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSpecifications((prev) => [...prev, { label: "", value: "", sortOrder: prev.length }])}
            className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
          >
            + Adicionar especificação
          </button>
        </div>
      )}

      {tab === "Benefícios" && (
        <div className="flex flex-col gap-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-2">
              <select value={b.icon} onChange={(e) => updateAt(setBenefits, i, { icon: e.target.value })} className="input w-40">
                <option value="check">Check</option>
                <option value="shipping">Envio</option>
                <option value="shield">Segurança</option>
                <option value="support">Suporte</option>
                <option value="warranty">Garantia</option>
              </select>
              <input placeholder="Texto" value={b.label} onChange={(e) => updateAt(setBenefits, i, { label: e.target.value })} className="input" />
              <button type="button" onClick={() => setBenefits((prev) => prev.filter((_, idx) => idx !== i))} className="text-xs text-price">
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBenefits((prev) => [...prev, { icon: "check", label: "", sortOrder: prev.length }])}
            className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
          >
            + Adicionar benefício
          </button>
        </div>
      )}

      {tab === "Seguros" && (
        <div className="flex flex-col gap-3">
          {addons.map((a, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 md:grid-cols-4">
              <input placeholder="Título (ex: Proteção dano e roubo)" value={a.title} onChange={(e) => updateAt(setAddons, i, { title: e.target.value })} className="input col-span-2" />
              <input placeholder="Duração (ex: 12 meses)" value={a.durationLabel} onChange={(e) => updateAt(setAddons, i, { durationLabel: e.target.value })} className="input" />
              <input
                placeholder="Preço (R$)"
                value={a.priceCents !== null ? centsToReaisInput(a.priceCents) : ""}
                onChange={(e) => updateAt(setAddons, i, { priceCents: reaisInputToCents(e.target.value) })}
                className="input"
              />
              <input placeholder="Descrição (opcional)" value={a.description} onChange={(e) => updateAt(setAddons, i, { description: e.target.value })} className="input col-span-full" />
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={a.enabled} onChange={(e) => updateAt(setAddons, i, { enabled: e.target.checked })} />
                Ativo
              </label>
              <button type="button" onClick={() => setAddons((prev) => prev.filter((_, idx) => idx !== i))} className="col-span-full text-left text-xs text-price">
                Remover seguro
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setAddons((prev) => [
                ...prev,
                { title: "", description: "", durationLabel: "", priceCents: null, sortOrder: prev.length, enabled: true },
              ])
            }
            className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
          >
            + Adicionar seguro
          </button>
        </div>
      )}

      {tab === "Avaliações" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground/80">Resumo das avaliações (bullets exibidos na loja)</p>
            {reviewHighlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Rótulo (ex: Imagem)"
                  value={h.label}
                  onChange={(e) => updateAt(setReviewHighlights, i, { label: e.target.value })}
                  className="input w-40"
                />
                <input
                  placeholder="Texto"
                  value={h.text}
                  onChange={(e) => updateAt(setReviewHighlights, i, { text: e.target.value })}
                  className="input"
                />
                <button type="button" onClick={() => setReviewHighlights((prev) => prev.filter((_, idx) => idx !== i))} className="text-xs text-price">
                  Remover
                </button>
              </div>
            ))}
            {reviewHighlights.length < 6 && (
              <button
                type="button"
                onClick={() => setReviewHighlights((prev) => [...prev, { label: "", text: "" }])}
                className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
              >
                + Adicionar bullet
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground/80">Avaliações de clientes</p>
            {reviews.map((r, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <input placeholder="Nome do cliente" value={r.customerName} onChange={(e) => updateAt(setReviews, i, { customerName: e.target.value })} className="input" />
                  <select value={r.rating} onChange={(e) => updateAt(setReviews, i, { rating: Number(e.target.value) })} className="input">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} estrela{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                  <input placeholder="Variação (opcional)" value={r.variantLabel} onChange={(e) => updateAt(setReviews, i, { variantLabel: e.target.value })} className="input" />
                  <select value={r.status} onChange={(e) => updateAt(setReviews, i, { status: e.target.value })} className="input">
                    {REVIEW_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input placeholder="URL do avatar (opcional)" value={r.avatarUrl} onChange={(e) => updateAt(setReviews, i, { avatarUrl: e.target.value })} className="input" />
                  {r.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatarUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded-full object-cover" />
                  )}
                  <label className="flex-shrink-0 cursor-pointer text-xs text-brand">
                    {uploadingAvatarIndex === i ? "Enviando…" : "Enviar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      disabled={uploadingAvatarIndex === i}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(i, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <textarea placeholder="Comentário" value={r.comment} onChange={(e) => updateAt(setReviews, i, { comment: e.target.value })} rows={3} className="input" />
                <input
                  type="number"
                  min={0}
                  placeholder="Útil (contagem)"
                  value={r.helpfulCount}
                  onChange={(e) => updateAt(setReviews, i, { helpfulCount: Number(e.target.value) })}
                  className="input w-40"
                />

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-foreground/60">Mídia (URLs)</p>
                  {r.media.map((m, mi) => (
                    <div key={mi} className="flex gap-2">
                      <input
                        placeholder="URL da imagem/vídeo"
                        value={m.url}
                        onChange={(e) => {
                          const media = r.media.map((row, idx) => (idx === mi ? { ...row, url: e.target.value } : row));
                          updateAt(setReviews, i, { media });
                        }}
                        className="input"
                      />
                      <select
                        value={m.type}
                        onChange={(e) => {
                          const media = r.media.map((row, idx) => (idx === mi ? { ...row, type: e.target.value } : row));
                          updateAt(setReviews, i, { media });
                        }}
                        className="input w-28"
                      >
                        <option value="image">Imagem</option>
                        <option value="video">Vídeo</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const media = r.media.filter((_, idx) => idx !== mi);
                          updateAt(setReviews, i, { media });
                        }}
                        className="text-xs text-price"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const media = [...r.media, { url: "", type: "image", thumbnailUrl: "", sortOrder: r.media.length }];
                      updateAt(setReviews, i, { media });
                    }}
                    className="w-fit text-xs text-brand"
                  >
                    + Adicionar mídia
                  </button>
                </div>

                <button type="button" onClick={() => setReviews((prev) => prev.filter((_, idx) => idx !== i))} className="w-fit text-left text-xs text-price">
                  Remover avaliação
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setReviews((prev) => [
                  ...prev,
                  {
                    customerName: "",
                    avatarUrl: "",
                    rating: 5,
                    variantLabel: "",
                    comment: "",
                    helpfulCount: 0,
                    status: "PUBLISHED",
                    media: [],
                  },
                ])
              }
              className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
            >
              + Adicionar avaliação
            </button>
          </div>
        </div>
      )}

      {tab === "Checkout" && (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            O checkout externo (pagseguropix.org) é uma página pré-criada por produto/variação — não há parâmetros de
            URL suportados para preço, SKU ou quantidade. Cole aqui a URL exata da página de checkout já criada
            naquela plataforma para este produto.
          </p>
          <Field label="URL de checkout padrão do produto">
            <input value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} placeholder="https://pagseguropix.org/c/..." className="input" />
          </Field>
          <p className="text-xs text-foreground/50">
            Cada variação pode ter sua própria URL de checkout (aba Variações), sobrescrevendo esta.
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          {saving && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {saving ? "Salvando…" : "Salvar produto"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background: var(--surface);
        }
        .input:focus {
          outline: none;
          border-color: var(--brand);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-foreground/70">{label}</span>
      {children}
    </label>
  );
}

function updateAt<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, index: number, patch: Partial<T>) {
  setter((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
}
