export function QuantitySelector({
  quantity,
  max,
  onChange,
}: {
  quantity: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const disabled = max <= 0;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-foreground/80">Quantidade</span>
      <div className="flex items-center rounded-lg border border-border">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={disabled || quantity <= 1}
          onClick={() => onChange(Math.max(1, quantity - 1))}
          className="flex h-11 w-11 items-center justify-center text-lg text-foreground/70 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={disabled || quantity >= max}
          onClick={() => onChange(Math.min(max, quantity + 1))}
          className="flex h-11 w-11 items-center justify-center text-lg text-foreground/70 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
