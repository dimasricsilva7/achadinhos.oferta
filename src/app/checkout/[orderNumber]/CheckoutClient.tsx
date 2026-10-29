"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatCentsBRL } from "@/lib/money";

// Cores do checkout do app Shopee (fiéis às telas de referência), fixas aqui para
// não dependerem do tema laranja da vitrine.
const SHOPEE = "#EE4D2D";
const SHOPEE_DARK = "#D73211";
const PIX_TEAL = "#2DBBA8";

export type Pix = { copyPaste: string; expiresAt: string };

export type CheckoutClientProps = {
  orderNumber: string;
  product: { name: string; image: string | null };
  variantLabel: string | null;
  quantity: number;
  productTotalCents: number;
  shippingCents: number;
  amountCents: number;
  deliveryText: string | null;
  storeName: string;
  initialPix: Pix | null;
  prefill: Partial<FormState> | null;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

/* ---------- máscaras (exibição; o servidor revalida e normaliza) ---------- */
function maskCPF(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}
function maskCEP(v: string): string {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function deadlineLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const data = d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `Vencimento em ${data}, ${hora}`;
}

/* ============================ ÍCONES ============================ */
function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PixIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={PIX_TEAL} aria-hidden>
      <path d="M12 2.6c.5 0 1 .2 1.4.6l2.1 2.1-1.6 1.6c-.5.5-1.2.8-1.9.8s-1.4-.3-1.9-.8L8.5 5.3l2.1-2.1c.4-.4.9-.6 1.4-.6Z" />
      <path d="M5.3 8.5l1.6 1.6c.5.5.8 1.2.8 1.9s-.3 1.4-.8 1.9l-1.6 1.6-2.1-2.1a2 2 0 0 1 0-2.8l2.1-2.1Z" />
      <path d="M18.7 8.5l2.1 2.1a2 2 0 0 1 0 2.8l-2.1 2.1-1.6-1.6c-.5-.5-.8-1.2-.8-1.9s.3-1.4.8-1.9l1.6-1.6Z" />
      <path d="M12 16.3c.7 0 1.4.3 1.9.8l1.6 1.6-2.1 2.1a2 2 0 0 1-2.8 0l-2.1-2.1 1.6-1.6c.5-.5 1.2-.8 1.9-.8Z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SHOPEE} strokeWidth="2" className="flex-shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00A884" strokeWidth="1.8" className="flex-shrink-0">
      <path d="M1 4h13v11H1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8h4l4 4v3h-8V8Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}

/* ============================ CAMPO ============================ */
function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
  maxLength,
  className = "",
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "tel" | "email";
  autoComplete?: string;
  maxLength?: number;
  className?: string;
  id?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-neutral-600">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`h-11 rounded-lg border bg-white px-3 text-sm text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 focus:border-[#EE4D2D] ${
          error ? "border-red-400" : "border-neutral-200"
        }`}
      />
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </label>
  );
}

/* ============================ COMPONENTE ============================ */
export function CheckoutClient(props: CheckoutClientProps) {
  const [mode, setMode] = useState<"form" | "payment">(props.initialPix ? "payment" : "form");
  const [pix, setPix] = useState<Pix | null>(props.initialPix);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...(props.prefill ?? {}) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  /* ------- CEP autofill (ViaCEP) — disparado no onChange, preenche rua/bairro/cidade/UF ------- */
  const lastCep = useRef("");
  const lookupCep = useCallback(async (digits: string) => {
    lastCep.current = digits;
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { cache: "no-store" });
      const data = await res.json();
      if (data?.erro) {
        setCepStatus("error");
        return;
      }
      setForm((f) => ({
        ...f,
        // Vem do CEP: sobrescreve. Mantém o que o cliente digitou quando o ViaCEP não
        // conhece o logradouro/bairro (CEPs gerais de cidade).
        street: data.logradouro || f.street,
        neighborhood: data.bairro || f.neighborhood,
        city: data.localidade || f.city,
        state: data.uf || f.state,
      }));
      setCepStatus("done");
      // Rua/bairro/cidade já vieram prontos — leva o foco direto pro número.
      requestAnimationFrame(() => document.getElementById("checkout-number")?.focus());
    } catch {
      setCepStatus("error");
    }
  }, []);
  const handleCepChange = useCallback(
    (v: string) => {
      const masked = maskCEP(v);
      setForm((f) => ({ ...f, cep: masked }));
      const digits = masked.replace(/\D/g, "");
      if (digits.length === 8) {
        if (digits !== lastCep.current) lookupCep(digits);
      } else {
        lastCep.current = "";
        setCepStatus("idle");
      }
    },
    [lookupCep]
  );

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setTopError(null);
    setErrors({});
    try {
      const res = await fetch(`/api/checkout/${props.orderNumber}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTopError(data.error ?? "Não foi possível concluir. Confira os dados e tente novamente.");
        if (data.fields) setErrors(data.fields);
        setSubmitting(false);
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      setPix({ copyPaste: data.copyPaste, expiresAt: data.expiresAt });
      setMode("payment");
      window.scrollTo({ top: 0 });
    } catch {
      setTopError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* O checkout tem identidade própria (Shopee): esconde o rodapé global da loja. */}
      <style jsx global>{`
        body > footer {
          display: none !important;
        }
      `}</style>
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-neutral-200 bg-white px-3">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => (mode === "payment" ? setMode("form") : window.history.back())}
          className="flex h-9 w-9 items-center justify-center text-[#EE4D2D]"
        >
          <BackIcon />
        </button>
        <h1 className="flex-1 pr-9 text-center text-base font-medium text-neutral-800">
          {mode === "payment" ? "Pagamento" : "Comprar"}
        </h1>
      </header>

      {mode === "form" ? (
        <FormView
          {...props}
          form={form}
          set={set}
          errors={errors}
          topError={topError}
          submitting={submitting}
          cepStatus={cepStatus}
          onCepChange={handleCepChange}
          onSubmit={handleSubmit}
        />
      ) : (
        <PaymentView
          orderNumber={props.orderNumber}
          amountCents={props.amountCents}
          pix={pix}
          regenerating={submitting}
          onRegenerate={handleSubmit}
        />
      )}
    </div>
  );
}

/* ============================ TELA COMPRAR ============================ */
function FormView({
  product,
  variantLabel,
  quantity,
  productTotalCents,
  shippingCents,
  amountCents,
  deliveryText,
  storeName,
  form,
  set,
  errors,
  topError,
  submitting,
  cepStatus,
  onCepChange,
  onSubmit,
}: CheckoutClientProps & {
  form: FormState;
  set: (k: keyof FormState) => (v: string) => void;
  errors: Record<string, string>;
  topError: string | null;
  submitting: boolean;
  cepStatus: "idle" | "loading" | "done" | "error";
  onCepChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <div className="mx-auto w-full max-w-lg space-y-2 px-0 pb-28 pt-2 sm:px-3">
        {/* Dados + endereço */}
        <section className="bg-white px-4 py-4 sm:rounded-lg">
          <div className="mb-3 flex items-center gap-2">
            <PinIcon />
            <h2 className="text-sm font-semibold text-neutral-800">Dados de entrega</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field className="col-span-2" label="Nome completo" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" placeholder="Seu nome" />
            <Field className="col-span-2" label="E-mail" type="email" inputMode="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" placeholder="voce@email.com" />
            <Field label="Telefone / WhatsApp" inputMode="tel" value={form.phone} onChange={(v) => set("phone")(maskPhone(v))} error={errors.phone} autoComplete="tel" placeholder="(11) 90000-0000" />
            <Field label="CPF" inputMode="numeric" value={form.cpf} onChange={(v) => set("cpf")(maskCPF(v))} error={errors.cpf} placeholder="000.000.000-00" />
            <Field label="CEP" inputMode="numeric" value={form.cep} onChange={onCepChange} error={errors.cep} autoComplete="postal-code" placeholder="00000-000" />
            <Field id="checkout-number" label="Número" inputMode="numeric" value={form.number} onChange={set("number")} error={errors.number} placeholder="123" />
            {cepStatus === "loading" && (
              <p className="col-span-2 -mt-1 flex items-center gap-1.5 text-[11px] text-neutral-400">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-[#EE4D2D]" />
                Buscando endereço pelo CEP…
              </p>
            )}
            {cepStatus === "done" && (
              <p className="col-span-2 -mt-1 text-[11px] text-[#00A884]">Endereço preenchido automaticamente ✓ — confira o número.</p>
            )}
            {cepStatus === "error" && (
              <p className="col-span-2 -mt-1 text-[11px] text-amber-600">CEP não encontrado — preencha o endereço manualmente.</p>
            )}
            <Field className="col-span-2" label="Rua / Logradouro" value={form.street} onChange={set("street")} error={errors.street} autoComplete="address-line1" placeholder="Rua, avenida…" />
            <Field className="col-span-2" label="Complemento (opcional)" value={form.complement} onChange={set("complement")} error={errors.complement} placeholder="Apto, bloco…" />
            <Field className="col-span-2" label="Bairro" value={form.neighborhood} onChange={set("neighborhood")} error={errors.neighborhood} placeholder="Bairro" />
            <Field label="Cidade" value={form.city} onChange={set("city")} error={errors.city} placeholder="Cidade" />
            <Field label="UF" value={form.state} onChange={(v) => set("state")(v.toUpperCase().slice(0, 2))} error={errors.state} maxLength={2} placeholder="SP" />
          </div>
        </section>

        {/* Produto */}
        <section className="bg-white px-4 py-4 sm:rounded-lg">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-[#EE4D2D] px-1.5 py-0.5 text-[10px] font-medium text-white">Indicado</span>
            <span className="text-sm font-medium text-neutral-800">{storeName}</span>
          </div>
          <div className="flex gap-3">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
              {product.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-neutral-700">{product.name}</p>
              {variantLabel && <p className="mt-0.5 text-xs text-neutral-400">{variantLabel}</p>}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#EE4D2D]">{formatCentsBRL(productTotalCents)}</span>
                <span className="text-xs text-neutral-400">x{quantity}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-neutral-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-800">Opção de Entrega</span>
              <span className="text-sm text-neutral-500">
                {shippingCents === 0 ? "Grátis" : formatCentsBRL(shippingCents)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#00A884]">
              <TruckIcon />
              {deliveryText || "Entrega Padrão"}
            </div>
          </div>
        </section>

        {/* Método de pagamento */}
        <section className="bg-white px-4 py-4 sm:rounded-lg">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Método de pagamento</h2>
          <div className="flex items-center justify-between rounded-lg border border-[#EE4D2D] bg-[#fff6f4] px-3 py-3">
            <div className="flex items-center gap-2.5">
              <PixIcon />
              <span className="text-sm font-medium text-neutral-800">Pix</span>
              <span className="rounded bg-[#00A884]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#00A884]">Aprovação imediata</span>
            </div>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border-[6px] border-[#EE4D2D] bg-white" />
          </div>
        </section>

        {/* Detalhes de pagamento */}
        <section className="bg-white px-4 py-4 sm:rounded-lg">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Detalhes de Pagamento</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-neutral-600">
              <span>Total dos Produtos</span>
              <span>{formatCentsBRL(productTotalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>Total do Frete</span>
              <span>{shippingCents === 0 ? "Grátis" : formatCentsBRL(shippingCents)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-100 pt-2 font-semibold text-neutral-800">
              <span>Pagamento Total</span>
              <span className="text-[#EE4D2D]">{formatCentsBRL(amountCents)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Barra fixa */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            {topError && <p className="truncate text-[11px] text-red-500">{topError}</p>}
            <p className="text-[11px] text-neutral-500">Total</p>
            <p className="truncate text-lg font-bold text-[#EE4D2D]">{formatCentsBRL(amountCents)}</p>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="h-12 min-w-[170px] rounded-lg px-6 text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: submitting ? SHOPEE_DARK : SHOPEE }}
          >
            {submitting ? "Gerando Pix…" : "FAZER PEDIDO"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ============================ TELA PAGAMENTO ============================ */
function PaymentView({
  orderNumber,
  amountCents,
  pix,
  regenerating,
  onRegenerate,
}: {
  orderNumber: string;
  amountCents: number;
  pix: Pix | null;
  regenerating: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const remaining = pix ? Math.max(0, new Date(pix.expiresAt).getTime() - now) : 0;
  const expired = Boolean(pix) && remaining <= 0;

  // Relógio de 1s. remaining/expired/countdown são DERIVADOS dele, então um Pix
  // regerado (novo expiresAt) reinicia a contagem sozinho — sem setState em efeito.
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Polling de confirmação (fallback ao webhook)
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/checkout/${orderNumber}/status`, { cache: "no-store" });
        const d = await r.json();
        if (d.status === "PAID" && d.redirectUrl) {
          window.location.href = d.redirectUrl;
        }
      } catch {
        /* ignora e tenta de novo */
      }
    }, 4000);
    return () => clearInterval(iv);
  }, [orderNumber]);

  const countdown = useMemo(() => {
    const total = Math.floor(remaining / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (h > 0) return `${h} horas ${pad(m)} minutos ${pad(s)} segundos`;
    return `${m} minutos ${pad(s)} segundos`;
  }, [remaining]);

  const copy = useCallback(async () => {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.copyPaste);
    } catch {
      /* alguns navegadores bloqueiam — o cliente pode selecionar manualmente */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [pix]);

  return (
    <div className="mx-auto w-full max-w-lg pb-28">
      {/* Total + prazo */}
      <section className="bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm text-neutral-800">Pagamento Total</span>
          <span className="text-lg font-semibold text-[#EE4D2D]">{formatCentsBRL(amountCents)}</span>
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-neutral-100 px-4 py-4">
          <span className="text-sm text-neutral-800">Pague dentro de</span>
          <div className="text-right">
            {expired ? (
              <p className="text-sm font-semibold text-red-500">Pix expirado</p>
            ) : (
              <>
                <p className="text-sm font-medium text-[#EE4D2D]">{countdown}</p>
                {pix && <p className="mt-0.5 text-xs text-neutral-400">{deadlineLabel(pix.expiresAt)}</p>}
              </>
            )}
          </div>
        </div>
      </section>

      <div className="h-2" />

      {/* Pix */}
      <section className="bg-white px-4 py-4">
        <div className="flex items-center gap-2">
          <PixIcon />
          <span className="text-base font-medium text-neutral-800">Pix</span>
        </div>

        <p className="mt-5 text-center text-sm font-medium text-neutral-700">Código Pix</p>
        <div className="mx-auto mt-2 max-w-sm rounded-lg bg-neutral-100 px-4 py-3">
          <p className="truncate text-center text-sm text-neutral-500">{pix?.copyPaste ?? "—"}</p>
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={copy}
            className="rounded-md border border-[#EE4D2D] px-6 py-2.5 text-sm font-semibold text-[#EE4D2D] transition-colors active:bg-[#fff1ee]"
          >
            {copied ? "Código copiado!" : "Copiar Código Pix"}
          </button>
        </div>
      </section>

      <div className="h-2" />

      {/* Instruções */}
      <section className="bg-white px-4 py-4">
        <h2 className="text-sm font-semibold text-neutral-800">Por favor siga as instruções</h2>
        <ol className="mt-3 space-y-4">
          {[
            "Copie o código Pix acima.",
            "Acesse o app do seu banco ou internet banking de preferência.",
            "Escolha pagar com o Pix, cole o código e finalize o pagamento.",
            "Seu pagamento será aprovado em alguns segundos.",
          ].map((txt, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-neutral-300 text-[11px] text-neutral-400">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-neutral-500">{txt}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Status + ação */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white">
        <div className="mx-auto w-full max-w-lg px-4 py-2.5">
          {expired ? (
            <>
              <p className="mb-2 text-center text-xs text-neutral-500">O código Pix expirou. Gere um novo para concluir o pagamento.</p>
              <button
                type="button"
                onClick={onRegenerate}
                disabled={regenerating}
                className="h-12 w-full rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: SHOPEE }}
              >
                {regenerating ? "Gerando novo Pix…" : "Gerar novo Pix"}
              </button>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-center gap-2 text-xs text-neutral-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-[#EE4D2D]" />
                Aguardando confirmação do pagamento…
              </div>
              <button
                type="button"
                onClick={async () => {
                  const r = await fetch(`/api/checkout/${orderNumber}/status`, { cache: "no-store" });
                  const d = await r.json().catch(() => ({}));
                  if (d.status === "PAID" && d.redirectUrl) window.location.href = d.redirectUrl;
                }}
                className="h-12 w-full rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: SHOPEE }}
              >
                Já fiz o pagamento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
