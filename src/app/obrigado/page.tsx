import Link from "next/link";
import { db } from "@/lib/db";
import { formatCentsBRL } from "@/lib/money";
import { getSettings } from "@/lib/settings-service";
import { PurchasePixel } from "@/components/site/PurchasePixel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pedido confirmado",
};

// Estimated delivery for the generic (no-order-found) case — same "presentational
// estimate, never real freight logic" philosophy as ShippingInfo.tsx, just with a
// wider fixed window since there's no CEP here to narrow it down.
function genericDeliveryLabel(): string {
  const start = new Date();
  start.setDate(start.getDate() + 5);
  const end = new Date();
  end.setDate(end.getDate() + 9);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `Previsão de entrega: ${fmt(start)} a ${fmt(end)}`;
}

type OrderWithRelations = NonNullable<Awaited<ReturnType<typeof loadOrder>>>;

async function loadOrder(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: { product: true, variant: true },
  });
}

function OrderSummary({ order }: { order: OrderWithRelations }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
        <span className="text-xs text-foreground/60">Número do pedido</span>
        <span className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</span>
      </div>

      <div className="flex items-center gap-3 py-2">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background text-[10px] text-foreground/40">
          {/* No image lookup here on purpose — keeps this page to a single simple
              query per README's "don't over-fetch on a best-effort page" spirit. */}
          {order.quantity}x
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{order.product.name}</p>
          {order.variant && <p className="text-xs text-foreground/60">{order.variant.groupName}: {order.variant.label}</p>}
          <p className="text-xs text-foreground/60">Quantidade: {order.quantity}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{formatCentsBRL(order.totalCents)}</p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-foreground/70">Total</span>
        <span className="text-lg font-bold text-brand">{formatCentsBRL(order.totalCents)}</span>
      </div>

      <p className="mt-3 text-xs text-foreground/50">
        {order.product.shippingDeliveryText || genericDeliveryLabel()}
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

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-10">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="text-center text-xl font-bold text-foreground">Pagamento aprovado!</h1>
      <p className="mt-1 text-center text-sm text-foreground/60">
        {order ? "Seu pedido foi confirmado. Obrigado pela compra!" : "Recebemos a confirmação do seu pagamento. Obrigado pela compra!"}
      </p>

      <div className="mt-6 w-full">
        {order ? (
          <OrderSummary order={order} />
        ) : (
          <div className="rounded-xl border border-border bg-surface p-4 text-center">
            <p className="text-sm text-foreground/70">
              Não conseguimos identificar automaticamente qual pedido é este, mas seu pagamento foi aprovado.
            </p>
            <p className="mt-2 text-xs text-foreground/50">{genericDeliveryLabel()}</p>
          </div>
        )}
      </div>

      <p className="mt-5 text-center text-xs text-foreground/50">
        Você receberá atualizações sobre o andamento da entrega pelos canais de contato informados na compra.
      </p>

      <Link
        href="/"
        className="mt-8 w-full rounded-lg bg-brand px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
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
