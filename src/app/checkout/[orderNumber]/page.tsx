import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings-service";
import { computeShippingCents, amountToChargeCents } from "@/lib/payments/orders";
import { getTransaction } from "@/lib/payments/bravopay";
import { CheckoutClient, type Pix } from "./CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comprar",
};

function safeJson(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export default async function CheckoutPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      product: {
        include: {
          images: { where: { type: "image" }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
        },
      },
      variant: true,
    },
  });

  if (!order) notFound();
  // Já pago: nada a fazer aqui, vai direto para a confirmação.
  if (order.status === "PAID") redirect(`/obrigado?pedido=${encodeURIComponent(orderNumber)}`);

  const settings = await getSettings();
  const shippingCents = computeShippingCents(order.product);
  const amountCents = amountToChargeCents(order.totalCents, shippingCents);
  const image = order.variant?.imageUrl ?? order.product.images[0]?.url ?? null;

  // Se o PIX já foi gerado (cliente recarregou a tela de pagamento), reidrata o código
  // direto da BravoPay e pré-preenche o formulário com o que já foi informado.
  let initialPix: Pix | null = null;
  let prefill: Record<string, string> | null = null;
  if (order.gatewayTransactionId) {
    try {
      const tx = await getTransaction(orderNumber);
      if (tx?.pix) initialPix = { copyPaste: tx.pix.copy_paste, expiresAt: tx.pix.expires_at };
    } catch {
      /* gateway indisponível no momento — cai de volta no formulário */
    }
    const addr = safeJson(order.shippingAddress);
    prefill = {
      name: order.customerName ?? "",
      email: order.customerEmail ?? "",
      phone: order.customerPhone ?? "",
      cpf: order.customerCpf ?? "",
      cep: addr.cep ?? "",
      street: addr.street ?? "",
      number: addr.number ?? "",
      complement: addr.complement ?? "",
      neighborhood: addr.neighborhood ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
    };
  }

  return (
    <CheckoutClient
      orderNumber={order.orderNumber}
      product={{ name: order.product.name, image }}
      variantLabel={order.variant ? `${order.variant.groupName}: ${order.variant.label}` : null}
      quantity={order.quantity}
      productTotalCents={order.totalCents}
      shippingCents={shippingCents}
      amountCents={amountCents}
      deliveryText={order.product.shippingDeliveryText}
      storeName={settings.siteShortName || settings.siteName}
      initialPix={initialPix}
      prefill={prefill}
    />
  );
}
