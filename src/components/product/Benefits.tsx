import type { ProductBenefitDTO } from "@/lib/product-dto";

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShippingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="7" width="14" height="10" rx="1" />
      <path d="M15 10h4l3 3v4h-7v-7Z" strokeLinejoin="round" />
      <circle cx="6" cy="19" r="1.5" />
      <circle cx="17.5" cy="19" r="1.5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarrantyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 1.4 1.4l3.3-3.2a4 4 0 0 1-5.4 5.4l-6.2 6.1a2 2 0 1 1-2.8-2.8l6.1-6.2a4 4 0 0 1 5.4-5.4l-3.3 3.2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS: Record<string, () => React.ReactElement> = {
  check: CheckIcon,
  shipping: ShippingIcon,
  shield: ShieldIcon,
  support: SupportIcon,
  warranty: WarrantyIcon,
};

export function Benefits({ benefits }: { benefits: ProductBenefitDTO[] }) {
  if (benefits.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {benefits.map((b) => {
        const Icon = ICONS[b.icon] ?? CheckIcon;
        return (
          <li key={b.id} className="flex items-center gap-2 rounded-lg border border-brand/40 p-2 text-xs text-foreground/80">
            <span aria-hidden className="flex-shrink-0 text-brand">
              <Icon />
            </span>
            <span>{b.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
