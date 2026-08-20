import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { formatCentsBRL } from "@/lib/money";

type Params = { params: Promise<{ id: string }> };

const SHOPEE_LOGO = "https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg";
const BRAND = "#EE4D2D";

// Sends a one-off "you left something in your cart" email for a PENDING order,
// from the checkout's own domain (pagamento-shopee.com.br) via Resend — a real send,
// not a mailto: link. RESEND_API_KEY and RESEND_FROM_EMAIL are Vercel env vars;
// the from address's domain must be verified in the Resend dashboard first, or every
// send here fails.
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getSession();

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    return NextResponse.json(
      { error: "Envio de e-mail não configurado (RESEND_API_KEY / RESEND_FROM_EMAIL ausentes)" },
      { status: 500 }
    );
  }

  const order = await db.order.findUnique({ where: { id }, include: { product: true } });
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  if (!order.customerEmail) {
    return NextResponse.json({ error: "Este pedido não tem e-mail do cliente" }, { status: 422 });
  }
  if (order.status === "PAID") {
    return NextResponse.json({ error: "Este pedido já foi pago" }, { status: 409 });
  }

  const image = await db.productImage.findFirst({
    where: { productId: order.productId, type: "image" },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    select: { url: true },
  });

  const checkoutBase = (process.env.CHECKOUT_BASE_URL || "").replace(/\/$/, "");
  const resumeUrl = checkoutBase ? `${checkoutBase}/?pedido=${encodeURIComponent(order.orderNumber)}` : null;
  const firstName = order.customerName?.trim().split(" ")[0] || "";

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: order.customerEmail,
      subject: "Você esqueceu algo no carrinho 🛒",
      html: buildEmailHtml({
        firstName,
        productName: order.product.name,
        productImage: image?.url ?? null,
        totalCents: order.totalCents,
        resumeUrl,
      }),
    });

    if (error) {
      console.error("[recover-email] Resend error:", error);
      return NextResponse.json({ error: "Falha ao enviar o e-mail" }, { status: 502 });
    }
  } catch (err) {
    console.error("[recover-email]", err);
    return NextResponse.json({ error: "Falha ao enviar o e-mail" }, { status: 502 });
  }

  await logAudit({
    adminId: session?.adminId ?? null,
    action: "ORDER_STATUS_CHANGED",
    entity: "Order",
    entityId: id,
    metadata: { action: "recovery_email_sent", to: order.customerEmail },
  });

  return NextResponse.json({ ok: true });
}

function buildEmailHtml({
  firstName,
  productName,
  productImage,
  totalCents,
  resumeUrl,
}: {
  firstName: string;
  productName: string;
  productImage: string | null;
  totalCents: number;
  resumeUrl: string | null;
}): string {
  const greeting = firstName ? `Oi, ${firstName}! 👋` : "Oi! 👋";
  const productImageCell = productImage
    ? `<td width="64" style="width:64px;padding-right:14px;vertical-align:top;">
         <img src="${escapeHtml(productImage)}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb;" />
       </td>`
    : "";
  const button = resumeUrl
    ? `<a href="${resumeUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;">Finalizar minha compra</a>`
    : "";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0;padding:0;background:#f5f6f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:${BRAND};padding:20px 28px;">
              <img src="${SHOPEE_LOGO}" alt="Shopee" height="22" style="display:block;filter:brightness(0) invert(1);" />
            </td>
          </tr>

          <tr>
            <td style="padding:28px;">
              <h1 style="font-size:19px;margin:0 0 8px;color:#14161a;">${greeting}</h1>
              <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 20px;">
                Vimos que você começou a comprar mas o pagamento não foi concluído. Seu pedido ainda está reservado.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;border-radius:12px;margin-bottom:22px;">
                <tr>
                  <td style="padding:14px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        ${productImageCell}
                        <td style="vertical-align:top;">
                          <p style="margin:0;font-size:13px;font-weight:600;color:#14161a;line-height:1.4;">${escapeHtml(productName)}</p>
                          <p style="margin:6px 0 0;font-size:17px;font-weight:700;color:${BRAND};">${formatCentsBRL(totalCents)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">${button}</td>
                </tr>
              </table>

              <p style="font-size:12px;color:#9ca3af;text-align:center;margin:16px 0 0;">Se você já resolveu isso, pode ignorar este e-mail.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px;border-top:1px solid #e5e7eb;">
              <p style="font-size:11px;color:#9ca3af;margin:0;text-align:center;">Pagamento processado com segurança via Pix.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
