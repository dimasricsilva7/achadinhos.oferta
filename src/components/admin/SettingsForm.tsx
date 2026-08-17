"use client";

import { useState } from "react";
import type { FooterLink } from "@/lib/settings-service";

const TABS = ["Identidade", "Cores", "Header/Footer", "Checkout", "Loja"] as const;

export type SettingsFormInitial = {
  siteName: string;
  siteShortName: string | null;
  siteDescription: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  socialImageUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  supportEmail: string | null;

  colorPrimary: string;
  colorPrimaryHover: string;
  colorBackground: string;
  colorSurface: string;
  colorText: string;
  colorTextSecondary: string;
  colorBorder: string;
  colorPrice: string;
  colorDiscount: string;
  colorOffer: string;

  footerText: string | null;
  footerLinks: FooterLink[];

  checkoutTitle: string | null;
  checkoutSubtitle: string | null;
  checkoutCta: string | null;

  storeLogoUrl: string | null;
  storeRatingAverage: number;
  storeRatingCount: number;
  storeProductCount: number | null;
  storeResponseRatePercent: number;
  storeBadgeLabel: string | null;
  storeBadgeEnabled: boolean;
};

type SaveState = "idle" | "saving" | "success" | "error";

export function SettingsForm({ initial }: { initial: SettingsFormInitial }) {
  const [uploadingField, setUploadingField] = useState<"logoUrl" | "faviconUrl" | "socialImageUrl" | "storeLogoUrl" | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Identidade");

  const [siteName, setSiteName] = useState(initial.siteName);
  const [siteShortName, setSiteShortName] = useState(initial.siteShortName ?? "");
  const [siteDescription, setSiteDescription] = useState(initial.siteDescription ?? "");
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initial.faviconUrl ?? "");
  const [socialImageUrl, setSocialImageUrl] = useState(initial.socialImageUrl ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? "");
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail ?? "");

  const [colorPrimary, setColorPrimary] = useState(initial.colorPrimary);
  const [colorPrimaryHover, setColorPrimaryHover] = useState(initial.colorPrimaryHover);
  const [colorBackground, setColorBackground] = useState(initial.colorBackground);
  const [colorSurface, setColorSurface] = useState(initial.colorSurface);
  const [colorText, setColorText] = useState(initial.colorText);
  const [colorTextSecondary, setColorTextSecondary] = useState(initial.colorTextSecondary);
  const [colorBorder, setColorBorder] = useState(initial.colorBorder);
  const [colorPrice, setColorPrice] = useState(initial.colorPrice);
  const [colorDiscount, setColorDiscount] = useState(initial.colorDiscount);
  const [colorOffer, setColorOffer] = useState(initial.colorOffer);

  const [footerText, setFooterText] = useState(initial.footerText ?? "");
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>(initial.footerLinks);

  const [checkoutTitle, setCheckoutTitle] = useState(initial.checkoutTitle ?? "");
  const [checkoutSubtitle, setCheckoutSubtitle] = useState(initial.checkoutSubtitle ?? "");
  const [checkoutCta, setCheckoutCta] = useState(initial.checkoutCta ?? "");

  const [storeLogoUrl, setStoreLogoUrl] = useState(initial.storeLogoUrl ?? "");
  const [storeRatingAverage, setStoreRatingAverage] = useState(initial.storeRatingAverage);
  const [storeRatingCount, setStoreRatingCount] = useState(initial.storeRatingCount);
  const [storeProductCount, setStoreProductCount] = useState(
    initial.storeProductCount !== null ? String(initial.storeProductCount) : ""
  );
  const [storeResponseRatePercent, setStoreResponseRatePercent] = useState(initial.storeResponseRatePercent);
  const [storeBadgeLabel, setStoreBadgeLabel] = useState(initial.storeBadgeLabel ?? "");
  const [storeBadgeEnabled, setStoreBadgeEnabled] = useState(initial.storeBadgeEnabled);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(field: "logoUrl" | "faviconUrl" | "socialImageUrl" | "storeLogoUrl", file: File) {
    setUploadingField(field);
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
      if (field === "logoUrl") setLogoUrl(data.url);
      if (field === "faviconUrl") setFaviconUrl(data.url);
      if (field === "socialImageUrl") setSocialImageUrl(data.url);
      if (field === "storeLogoUrl") setStoreLogoUrl(data.url);
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    setError(null);

    const payload = {
      siteName,
      siteShortName: siteShortName || null,
      siteDescription: siteDescription || null,
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      socialImageUrl: socialImageUrl || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      supportEmail: supportEmail || null,
      colorPrimary,
      colorPrimaryHover,
      colorBackground,
      colorSurface,
      colorText,
      colorTextSecondary,
      colorBorder,
      colorPrice,
      colorDiscount,
      colorOffer,
      footerText: footerText || null,
      footerLinks: footerLinks.filter((l) => l.label.trim() && l.url.trim()),
      checkoutTitle: checkoutTitle || null,
      checkoutSubtitle: checkoutSubtitle || null,
      checkoutCta: checkoutCta || null,
      storeLogoUrl: storeLogoUrl || null,
      storeRatingAverage: Number(storeRatingAverage),
      storeRatingCount: Number(storeRatingCount),
      storeProductCount: storeProductCount.trim() === "" ? null : Number(storeProductCount),
      storeResponseRatePercent: Number(storeResponseRatePercent),
      storeBadgeLabel: storeBadgeLabel || null,
      storeBadgeEnabled,
    };

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setSaveState("error");
      setError(data.error ?? "Não foi possível salvar as configurações.");
      return;
    }
    setSaveState("success");
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

      {saveState === "error" && error && (
        <p className="mb-4 rounded-lg bg-price/10 px-3 py-2 text-sm text-price">{error}</p>
      )}
      {saveState === "success" && (
        <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Configurações salvas com sucesso.
        </p>
      )}

      {tab === "Identidade" && (
        <div className="flex flex-col gap-4">
          <Field label="Nome da loja">
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)} required className="input" />
          </Field>
          <Field label="Nome curto">
            <input value={siteShortName} onChange={(e) => setSiteShortName(e.target.value)} className="input" />
          </Field>
          <Field label="Descrição">
            <textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} className="input" />
          </Field>
          <ImageField
            label="Logo"
            url={logoUrl}
            uploading={uploadingField === "logoUrl"}
            onUpload={(f) => handleUpload("logoUrl", f)}
            onClear={() => setLogoUrl("")}
          />
          <ImageField
            label="Favicon"
            url={faviconUrl}
            uploading={uploadingField === "faviconUrl"}
            onUpload={(f) => handleUpload("faviconUrl", f)}
            onClear={() => setFaviconUrl("")}
          />
          <ImageField
            label="Imagem social (Open Graph)"
            url={socialImageUrl}
            uploading={uploadingField === "socialImageUrl"}
            onUpload={(f) => handleUpload("socialImageUrl", f)}
            onClear={() => setSocialImageUrl("")}
          />
          <Field label="Telefone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </Field>
          <Field label="WhatsApp">
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="input" />
          </Field>
          <Field label="E-mail de suporte">
            <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className="input" />
          </Field>
        </div>
      )}

      {tab === "Cores" && (
        <div className="flex flex-col gap-4">
          <ColorField label="Cor primária" value={colorPrimary} onChange={setColorPrimary} />
          <ColorField label="Cor primária (hover)" value={colorPrimaryHover} onChange={setColorPrimaryHover} />
          <ColorField label="Fundo" value={colorBackground} onChange={setColorBackground} />
          <ColorField label="Superfície (cards)" value={colorSurface} onChange={setColorSurface} />
          <ColorField label="Texto" value={colorText} onChange={setColorText} />
          <ColorField label="Texto secundário" value={colorTextSecondary} onChange={setColorTextSecondary} />
          <ColorField label="Bordas" value={colorBorder} onChange={setColorBorder} />
          <ColorField label="Preço" value={colorPrice} onChange={setColorPrice} />
          <ColorField label="Desconto" value={colorDiscount} onChange={setColorDiscount} />
          <ColorField label="Oferta" value={colorOffer} onChange={setColorOffer} />
        </div>
      )}

      {tab === "Header/Footer" && (
        <div className="flex flex-col gap-4">
          <Field label="Texto do rodapé">
            <textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} rows={2} className="input" />
          </Field>
          <div className="flex flex-col gap-3">
            <span className="text-sm text-foreground/70">Links do rodapé</span>
            {footerLinks.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input
                  placeholder="Texto"
                  value={link.label}
                  onChange={(e) =>
                    setFooterLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, label: e.target.value } : l)))
                  }
                  className="input"
                />
                <input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) =>
                    setFooterLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)))
                  }
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setFooterLinks((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-price"
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFooterLinks((prev) => [...prev, { label: "", url: "" }])}
              className="w-fit rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground/60 hover:border-brand hover:text-brand"
            >
              + Adicionar link
            </button>
          </div>
        </div>
      )}

      {tab === "Checkout" && (
        <div className="flex flex-col gap-4">
          <Field label="Título do checkout">
            <input value={checkoutTitle} onChange={(e) => setCheckoutTitle(e.target.value)} className="input" />
          </Field>
          <Field label="Subtítulo do checkout">
            <input value={checkoutSubtitle} onChange={(e) => setCheckoutSubtitle(e.target.value)} className="input" />
          </Field>
          <Field label="Texto do botão (CTA)">
            <input value={checkoutCta} onChange={(e) => setCheckoutCta(e.target.value)} className="input" />
          </Field>
        </div>
      )}

      {tab === "Loja" && (
        <div className="flex flex-col gap-4">
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
            Este bloco descreve a loja como um todo (não um produto específico) e aparece na página de qualquer
            produto. O nome usado é o &quot;Nome da loja&quot; da aba Identidade.
          </p>
          <ImageField
            label="Logo da loja (circular)"
            url={storeLogoUrl}
            uploading={uploadingField === "storeLogoUrl"}
            onUpload={(f) => handleUpload("storeLogoUrl", f)}
            onClear={() => setStoreLogoUrl("")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nota média (0-5)">
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={storeRatingAverage}
                onChange={(e) => setStoreRatingAverage(Number(e.target.value))}
                className="input"
              />
            </Field>
            <Field label="Nº de avaliações">
              <input
                type="number"
                min={0}
                value={storeRatingCount}
                onChange={(e) => setStoreRatingCount(Number(e.target.value))}
                className="input"
              />
            </Field>
          </div>
          <Field label="Quantidade de produtos (opcional — vazio calcula automaticamente pelos produtos ativos)">
            <input
              type="number"
              min={0}
              placeholder="Automático"
              value={storeProductCount}
              onChange={(e) => setStoreProductCount(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Taxa de resposta (%)">
            <input
              type="number"
              min={0}
              max={100}
              value={storeResponseRatePercent}
              onChange={(e) => setStoreResponseRatePercent(Number(e.target.value))}
              className="input"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={storeBadgeEnabled} onChange={(e) => setStoreBadgeEnabled(e.target.checked)} />
            Mostrar selo ao lado do nome da loja
          </label>
          {storeBadgeEnabled && (
            <Field label='Texto do selo (ex.: "Indicado")'>
              <input value={storeBadgeLabel} onChange={(e) => setStoreBadgeLabel(e.target.value)} className="input" />
            </Field>
          )}
          <p className="text-xs text-foreground/50">
            &quot;Ativo há X&quot; é calculado a partir do último login real de um admin — não é configurável aqui.
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={saveState === "saving"}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saveState === "saving" ? "Salvando…" : "Salvar configurações"}
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-surface p-0.5"
        />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="input" placeholder="#RRGGBB" />
      </div>
    </Field>
  );
}

function ImageField({
  label,
  url,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  url: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-border bg-neutral-100">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-foreground/40">sem imagem</span>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
        {url && (
          <button type="button" onClick={onClear} className="text-xs text-price">
            Remover
          </button>
        )}
        {uploading && <span className="text-xs text-foreground/50">Enviando…</span>}
      </div>
    </Field>
  );
}
