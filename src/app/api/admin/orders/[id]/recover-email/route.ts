import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

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

  const checkoutBase = (process.env.CHECKOUT_BASE_URL || "").replace(/\/$/, "");
  const resumeUrl = checkoutBase ? `${checkoutBase}/?pedido=${encodeURIComponent(order.orderNumber)}` : null;
  const firstName = order.customerName?.trim().split(" ")[0] || "";

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: order.customerEmail,
      subject: "Você esqueceu algo no carrinho 🛒",
      html: buildEmailHtml({ firstName, productName: order.product.name, resumeUrl }),
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
  resumeUrl,
}: {
  firstName: string;
  productName: string;
  resumeUrl: string | null;
}): string {
  const greeting = firstName ? `Oi, ${firstName}!` : "Oi!";
  const button = resumeUrl
    ? `<a href="${resumeUrl}" style="display:inline-block;background:#EE4D2D;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Finalizar minha compra</a>`
    : "";

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#14161a;">
    <h1 style="font-size:20px;margin:0 0 12px;">${greeting}</h1>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;">
      Vimos que você começou a comprar <strong>${escapeHtml(productName)}</strong> mas o pagamento não foi concluído.
    </p>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;">
      Seu pedido ainda está reservado — é só finalizar o pagamento pelo Pix.
    </p>
    <div style="margin:24px 0;">${button}</div>
    <p style="font-size:12px;color:#9ca3af;">Se você já resolveu isso, pode ignorar este e-mail.</p>
  </div>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
