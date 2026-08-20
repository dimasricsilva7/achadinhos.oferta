import Link from "next/link";
import { db } from "@/lib/db";
import { formatCentsBRL } from "@/lib/money";
import { getSettings } from "@/lib/settings-service";
import { PurchasePixel } from "@/components/site/PurchasePixel";
import { ObrigadoConfetti } from "@/components/site/ObrigadoConfetti";
import { CopyOrderNumber } from "@/components/site/CopyOrderNumber";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pedido confirmado",
};

// Estimated delivery for the generic (no-order-found) case — same "presentational
// estimate, never real freight logic" philosophy as ShippingInfo.tsx, just with a
// wider fixed window since there's no CEP here to narrow it down.
function genericDeliveryLabel(): { start: Date; end: Date } {
  const start = new Date();
  start.setDate(start.getDate() + 5);
  const end = new Date();
  end.setDate(end.getDate() + 9);
  return { start, end };
}

function fmtShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtLong(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

type OrderWithRelations = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

async function loadOrder(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: {
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      variant: true,
    },
  });
}

function parseAddress(raw: string | null): {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
} | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function Timeline({ deliveryLabel }: { deliveryLabel: string }) {
  const steps = [
    { label: "Pagamento aprovado", done: true },
    { label: "Preparando pedido", done: false },
    { label: "A caminho", done: false },
    { label: deliveryLabel, done: false, isDelivery: true },
  ];

  return (
    <div className="flex items-start gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-1 flex-col items-center text-center">
          <div className="flex w-full items-center">
            <div className={`h-px flex-1 ${i === 0 ? "opacity-0" : step.done ? "bg-success" : "bg-border"}`} />
            <div
              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                step.done ? "border-success bg-success text-white" : "border-border bg-surface text-foreground/30"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </div>
            <div className={`h-px flex-1 ${i === steps.length - 1 ? "opacity-0" : "bg-border"}`} />
          </div>
          <p className={`mt-2 px-1 text-[11px] leading-tight ${step.done ? "font-medium text-foreground" : "text-foreground/50"}`}>
            {step.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function OrderSummary({ order }: { order: OrderWithRelations }) {
  const image = order.variant?.imageUrl ?? order.product.images[0]?.url ?? null;
  const address = parseAddress(order.shippingAddress);
  const deliveryText = order.product.shippingDeliveryText;

  let deliveryLabel = "Previsão de entrega em breve";
  if (deliveryText) {
    deliveryLabel = deliveryText;
  } else {
    const base = order.paidAt ?? new Date();
    const est = new Date(base);
    est.setDate(est.getDate() + 3);
    deliveryLabel = `Chega até ${fmtLong(est)}`;
  }

  return (
    <div className="w-full animate-fade-up rounded-xl border border-border bg-surface p-4 shadow-sm" style={{ animationDelay: "0.15s" }}>
      <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs text-foreground/60">Número do pedido</span>
        <CopyOrderNumber value={order.orderNumber} />
      </div>

      <div className="flex items-center gap-3 py-1">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-foreground/40">{order.quantity}x</span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{order.product.name}</p>
          {order.variant && (
            <p className="text-xs text-foreground/60">
              {order.variant.groupName}: {order.variant.label}
            </p>
          )}
          <p className="text-xs text-foreground/60">Quantidade: {order.quantity}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatCentsBRL(order.totalCents)}</p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-foreground/70">Total pago</span>
        <span className="text-lg font-bold text-brand">{formatCentsBRL(order.totalCents)}</span>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Timeline deliveryLabel={deliveryLabel} />
      </div>

      {address?.street && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-background p-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0 text-foreground/40">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <p className="text-xs leading-relaxed text-foreground/70">
            {address.street}, {address.number}
            {address.complement ? ` — ${address.complement}` : ""}
            <br />
            {address.neighborhood} · {address.city}/{address.state}
          </p>
        </div>
      )}
    </div>
  );
}

type Bump = { id: string; title: string; description: string; imageUrl: string | null; priceCents: number };

// Fetches active post-purchase order bumps from checkout-bravopay (a separate app —
// see its src/routes/bumps.js). Best-effort: this section simply doesn't render if
// checkout-bravopay is unreachable or CHECKOUT_BASE_URL isn't set, since it's an
// upsell, never part of the critical thank-you-page path.
async function loadPostPurchaseBumps(productSlug: string): Promise<Bump[]> {
  const base = process.env.CHECKOUT_BASE_URL;
  if (!base) return [];
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/api/order-bumps?placement=post-purchase&productSlug=${encodeURIComponent(productSlug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.bumps) ? data.bumps : [];
  } catch {
    return [];
  }
}

function BumpOffers({ bumps, orderNumber }: { bumps: Bump[]; orderNumber: string }) {
  if (bumps.length === 0) return null;
  const checkoutBase = (process.env.CHECKOUT_BASE_URL || "").replace(/\/$/, "");

  return (
    <div className="mt-4 w-full animate-fade-up rounded-xl border border-border bg-surface p-4 shadow-sm" style={{ animationDelay: "0.2s" }}>
      <p className="mb-3 text-sm font-bold text-foreground">Aproveite e leve também</p>
      <div className="flex flex-col gap-3">
        {bumps.map((bump) => (
          <a
            key={bump.id}
            href={`${checkoutBase}/bump?bump=${encodeURIComponent(bump.id)}&pedido=${encodeURIComponent(orderNumber)}`}
            className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:border-brand"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
              {bump.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bump.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg">🎁</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{bump.title}</p>
              {bump.description && <p className="truncate text-xs text-foreground/60">{bump.description}</p>}
            </div>
            <span className="flex-shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white">
              + {formatCentsBRL(bump.priceCents)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function GenericSummary() {
  const { start, end } = genericDeliveryLabel();
  return (
    <div className="w-full animate-fade-up rounded-xl border border-border bg-surface p-5 text-center shadow-sm" style={{ animationDelay: "0.15s" }}>
      <p className="text-sm text-foreground/70">
        Não conseguimos identificar automaticamente qual pedido é este, mas seu pagamento foi aprovado.
      </p>
      <p className="mt-2 text-xs font-medium text-foreground/50">
        Previsão de entrega: {fmtShort(start)} a {fmtShort(end)}
      </p>
    </div>
  );
}

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.pedido ?? params.order;
  const orderNumber = typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : undefined;

  const [order, settings] = await Promise.all([
    orderNumber ? loadOrder(orderNumber) : Promise.resolve(null),
    getSettings(),
  ]);

  const bumps = order && order.status === "PAID" ? await loadPostPurchaseBumps(order.product.slug) : [];
  const firstName = order?.customerName?.trim().split(" ")[0];

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center overflow-hidden px-4 py-10">
      <ObrigadoConfetti />

      <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-success/20 animate-obrigado-ring" />
        <span className="absolute inset-0 rounded-full bg-success/10 animate-obrigado-pop" />
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative text-success">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" className="animate-obrigado-check" />
        </svg>
      </div>

      <h1 className="animate-fade-up text-center text-2xl font-bold text-foreground">
        {firstName ? `Valeu, ${firstName}!` : "Pagamento aprovado!"}
      </h1>
      <p className="mt-1 animate-fade-up text-center text-sm text-foreground/60" style={{ animationDelay: "0.05s" }}>
        {order ? "Seu pedido foi confirmado e já está sendo preparado." : "Recebemos a confirmação do seu pagamento. Obrigado pela compra!"}
      </p>

      <div className="mt-6 w-full">{order ? <OrderSummary order={order} /> : <GenericSummary />}</div>

      {order && <BumpOffers bumps={bumps} orderNumber={order.orderNumber} />}

      <p className="mt-5 animate-fade-up text-center text-xs text-foreground/50" style={{ animationDelay: "0.25s" }}>
        Você receberá atualizações sobre o andamento da entrega pelos canais de contato informados na compra.
        {settings.whatsapp && " Qualquer dúvida, chama no WhatsApp."}
      </p>

      <Link
        href="/"
        className="mt-8 w-full animate-fade-up rounded-lg bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        style={{ animationDelay: "0.3s" }}
      >
        Continuar comprando
      </Link>

      <PurchasePixel
        pixelConfigured={Boolean(settings.metaPixelId)}
        order={
          order
            ? { orderNumber: order.orderNumber, totalCents: order.totalCents }
            : null
        }
      />
    </div>
  );
}
