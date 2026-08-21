import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { formatCentsBRL } from "@/lib/money";

const SHOPEE_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Shopee.svg/500px-Shopee.svg.png";
const BRAND = "#EE4D2D";
const TEXT = "#1a1a1a";
const MUTED = "#6b7280";

// Temporary: exercises the exact same send path as
// /api/admin/orders/[id]/recover-email, but looked up by orderNumber and without an
// admin session, purely to verify RESEND_FROM_EMAIL works after the domain migration.
// Deleted right after use.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (!secret || secret !== process.env.CHECKOUT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const orderNumber = String(body.orderNumber || "");
  const order = await db.order.findUnique({ where: { orderNumber }, include: { product: true } });
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!order.customerEmail) return NextResponse.json({ error: "no email" }, { status: 422 });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const image = await db.productImage.findFirst({
    where: { productId: order.productId, type: "image" },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    select: { url: true },
  });

  const checkoutBase = (process.env.CHECKOUT_BASE_URL || "").replace(/\/$/, "");
  const resumeUrl = checkoutBase ? `${checkoutBase}/?pedido=${encodeURIComponent(order.orderNumber)}` : null;
  const firstName = order.customerName?.trim().split(" ")[0] || "";

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: order.customerEmail,
    subject: "Pedido Shopee - Seu pagamento está te esperando",
    html: buildEmailHtml({
      firstName,
      productName: order.product.name,
      productImage: image?.url ?? null,
      totalCents: order.totalCents,
      resumeUrl,
    }),
  });

  if (error) return NextResponse.json({ error }, { status: 502 });
  return NextResponse.json({ ok: true, fromEmail, resumeUrl });
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
  const greeting = firstName ? `${firstName}, seu pedido está te esperando!` : "Seu pedido está te esperando!";
  const productImageCell = productImage
    ? `<td width="72" style="width:72px;padding-right:16px;vertical-align:top;"><img src="${escapeHtml(productImage)}" width="72" height="72" alt="" style="display:block;width:72px;height:72px;border-radius:10px;object-fit:cover;border:1px solid #e5e7eb;" /></td>`
    : "";
  const button = resumeUrl
    ? `<a href="${resumeUrl}" style="display:block;background:${BRAND};color:#ffffff;text-decoration:none;padding:15px 32px;border-radius:10px;font-weight:700;font-size:15px;text-align:center;">Finalizar minha compra</a>`
    : "";
  return `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:0;background:#eef0f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f2;padding:28px 14px;"><tr><td align="center">
  <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
  <tr><td align="center" style="padding-bottom:18px;"><img src="${SHOPEE_LOGO}" alt="Shopee" height="30" style="display:block;" /></td></tr>
  <tr><td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(20,22,26,0.06);">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${BRAND};padding:12px 28px;"><p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#ffffff;">🛒 Você deixou algo pra trás</p></td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:28px;">
  <h1 style="font-size:20px;line-height:1.3;margin:0 0 8px;color:${TEXT};">${escapeHtml(greeting)}</h1>
  <p style="font-size:14px;line-height:1.6;color:${MUTED};margin:0 0 22px;">Vimos que o pagamento não foi concluído. Seu pedido ainda está reservado — é só finalizar.</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #eef0f2;border-radius:12px;margin-bottom:22px;"><tr><td style="padding:16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${productImageCell}<td style="vertical-align:top;">
  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${MUTED};">Seu pedido</p>
  <p style="margin:0;font-size:14px;font-weight:600;color:${TEXT};line-height:1.4;">${escapeHtml(productName)}</p>
  <p style="margin:8px 0 0;font-size:19px;font-weight:800;color:${BRAND};">${formatCentsBRL(totalCents)}</p>
  </td></tr></table></td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">${button}</td></tr></table>
  <p style="font-size:11.5px;color:#9ca3af;text-align:center;margin:16px 0 0;">Se você já resolveu isso, pode ignorar este e-mail.</p>
  </td></tr></table>
  </td></tr></table></td></tr></table></body></html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
