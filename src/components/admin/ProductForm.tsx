"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_STATUS } from "@/lib/constants";
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
  checkoutUrl: string | null;
  images: ImageRow[];
  variants: { id: string; groupName: string; label: string; sku: string | null; imageUrl: string | null; priceCents: number | null; stock: number; checkoutUrl: string | null; sortOrder: number }[];
  specifications: SpecRow[];
  benefits: BenefitRow[];
};

const TABS = ["Geral", "Preços & Oferta", "Imagens", "Variações", "Especificações", "Benefícios", "Checkout"] as const;

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

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha no upload");
        return;
      }
      setImages((prev) => [
        ...prev,
        { url: data.url, alt: name, type: "image", sortOrder: prev.length, isPrimary: prev.length === 0 },
      ]);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

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
            className={`rounded-t-lg px-3 py-2 text-sm ${
              tab === t ? "border-b-2 border-brand font-medium text-brand" : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-price/10 px-3 py-2 text-sm text-price">{error}</p>}

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
            <Field label="Oferta expira em">
              <input type="datetime-local" value={offerExpiresAt} onChange={(e) => setOfferExpiresAt(e.target.value)} className="input" />
            </Field>
          )}
        </div>
      )}

      {tab === "Imagens" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-24">
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-neutral-100">
                  {img.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
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
        <button type="submit" disabled={saving} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
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
