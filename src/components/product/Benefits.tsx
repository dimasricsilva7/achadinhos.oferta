import type { ProductBenefitDTO } from "@/lib/product-dto";

const ICONS: Record<string, string> = {
  check: "✓",
  shipping: "🚚",
  shield: "🛡️",
  support: "💬",
  warranty: "🔧",
};

export function Benefits({ benefits }: { benefits: ProductBenefitDTO[] }) {
  if (benefits.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {benefits.map((b) => (
        <li key={b.id} className="flex items-center gap-2 rounded-lg border border-border p-2 text-xs text-foreground/80">
          <span aria-hidden className="text-base">{ICONS[b.icon] ?? "✓"}</span>
          <span>{b.label}</span>
        </li>
      ))}
    </ul>
  );
}
