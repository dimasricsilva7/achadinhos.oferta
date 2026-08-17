import { formatCentsBRL } from "@/lib/money";

type BuyState = "idle" | "loading" | "error";

// WhatsApp's own official teal (used in their header/branding, distinct from the
// brighter #25D366 action-green) — not sampled from any marketplace's palette. It's
// used here because it labels a chat/WhatsApp icon that already existed in this bar,
// so reusing WhatsApp's real brand color for that icon is the honest choice, not an
// attempt to look like a specific competitor (see project note in AGENTS.md history).
const WHATSAPP_TEAL = "#128C7E";

function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-full flex-1 items-center justify-center text-white transition-colors duration-150 active:brightness-95"
    >
      {children}
    </button>
  );
}

export function StickyBuyBar({
  totalCents,
  disabled,
  disabledReason,
  state,
  errorMessage,
  onBuy,
}: {
  totalCents: number;
  disabled: boolean;
  disabledReason?: string;
  state: BuyState;
  errorMessage?: string | null;
  onBuy: () => void;
}) {
  return (
    <div className="safe-bottom sticky bottom-0 z-30 bg-surface/95 backdrop-blur">
      {errorMessage && (
        <p role="alert" className="px-3 pt-1.5 text-center text-xs font-medium text-price">
          {errorMessage}
        </p>
      )}
      {/* Cantos 100% retos (sem border-radius), largura total, split ~50/50 entre as
          duas seções de cor: esquerda (teal WhatsApp, ícones) e direita (tangerina, CTA). */}
      <div className="flex h-14 w-full items-stretch">
        <div className="flex flex-1 items-stretch" style={{ backgroundColor: WHATSAPP_TEAL }}>
          <IconButton label="Conversar com o vendedor">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="12" r="1" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
              <circle cx="15.5" cy="12" r="1" fill="currentColor" stroke="none" />
            </svg>
          </IconButton>
          {/* Separador vertical fino translúcido entre os dois ícones */}
          <span className="my-2.5 w-px bg-white/35" aria-hidden="true" />
          <IconButton label="Ver compra" onClick={onBuy}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
              <path d="M15.5 9v-3.5M13.75 7.25h3.5" strokeLinecap="round" />
            </svg>
          </IconButton>
        </div>

        <button
          type="button"
          onClick={onBuy}
          disabled={disabled || state === "loading"}
          className="flex flex-1 flex-col items-center justify-center bg-brand leading-tight text-white transition-colors duration-150 active:brightness-95 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          {state === "loading" ? (
            <span className="text-sm font-semibold">Processando…</span>
          ) : disabled ? (
            <span className="text-sm font-semibold">{disabledReason ?? "Indisponível"}</span>
          ) : (
            <>
              <span className="text-xs font-medium">Compre com cupons</span>
              <span className="text-base font-bold">{formatCentsBRL(totalCents)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
