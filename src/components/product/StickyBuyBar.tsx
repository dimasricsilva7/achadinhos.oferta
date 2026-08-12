import { formatCentsBRL } from "@/lib/money";

type BuyState = "idle" | "loading" | "error";

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
    <div className="safe-bottom sticky bottom-0 z-30 border-t border-border bg-surface/95 px-3 py-2 backdrop-blur">
      {errorMessage && (
        <p role="alert" className="mb-1.5 text-center text-xs font-medium text-price">
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
          {state === "loading" ? "Processando…" : disabled ? disabledReason ?? "Indisponível" : "Comprar agora"}
        </button>
      </div>
    </div>
  );
}
