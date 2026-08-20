"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatCentsBRL } from "@/lib/money";
import { ADMIN_SETTABLE_ORDER_STATUS } from "@/lib/constants";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  quantity: number;
  totalCents: number;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCpf: string | null;
  product: { name: string; slug: string };
  variant: { label: string; groupName: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  PROCESSING: "Processando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-neutral-400",
  PAID: "bg-success",
  PROCESSING: "bg-brand",
  SHIPPED: "bg-brand",
  DELIVERED: "bg-success",
  CANCELLED: "bg-price",
  REFUNDED: "bg-price",
};

function formatCpf(cpf: string | null): string {
  if (!cpf) return "-";
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return "-";
  const d = phone.replace(/\D/g, "").replace(/^55/, "");
  if (d.length < 10) return phone;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

function whatsappHref(phone: string | null, productName: string, orderNumber: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  const text = encodeURIComponent(
    `Oi! Vi que você começou a comprar "${productName}" (pedido ${orderNumber}) mas o pagamento não foi concluído. Posso te ajudar a finalizar? 😊`
  );
  return `https://wa.me/${withCountry}?text=${text}`;
}

function emailHref(email: string | null, productName: string, orderNumber: string): string | null {
  if (!email) return null;
  const subject = encodeURIComponent("Seu pedido está esperando por você!");
  const body = encodeURIComponent(
    `Oi!\n\nVimos que você começou a comprar "${productName}" (pedido ${orderNumber}) mas o pagamento não foi concluído.\n\nPosso te ajudar a finalizar sua compra?`
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilterRef.current) params.set("status", statusFilterRef.current);
    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await res.json();
    setItems(data.items);
  }, []);

  useEffect(() => {
    load();
  }, [load, statusFilter]);

  // Keep the panel current without a manual refresh — payments confirmed by
  // checkout-bravopay's webhook can land at any time.
  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleStatusChange(id: string, status: string) {
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    load();
  }

  async function handleDelete(id: string, orderNumber: string) {
    if (!confirm(`Excluir o pedido ${orderNumber}? Essa ação não pode ser desfeita.`)) return;
    setBusyId(id);
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    setBusyId(null);
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-foreground">Pedidos</h1>

      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mb-4 rounded-lg border border-border px-3 py-2 text-sm">
        <option value="">Todos os status</option>
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <p className="mb-3 max-w-2xl text-xs text-foreground/50">
        Pedidos são criados como &quot;Pendente&quot; assim que o cliente é enviado ao checkout. O status muda para
        &quot;Pago&quot; automaticamente quando o checkout confirma o PIX — atualize manualmente só para os status
        seguintes (processando, enviado, entregue...). Atualiza sozinho a cada 5s.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-foreground/50">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-foreground/50">
                  <p className="font-medium">Nenhum pedido encontrado.</p>
                  <p className="mt-1 text-xs">
                    {statusFilter ? "Tente outro filtro de status." : "Pedidos aparecem aqui assim que um cliente inicia o checkout."}
                  </p>
                </td>
              </tr>
            )}
            {items?.map((o) => {
              const wa = whatsappHref(o.customerPhone, o.product.name, o.orderNumber);
              const mail = emailHref(o.customerEmail, o.product.name, o.orderNumber);
              return (
                <tr key={o.id} className="border-b border-border align-top transition-colors duration-150 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-foreground/70">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    {o.customerName ? (
                      <div className="text-xs">
                        <p className="font-medium text-foreground">{o.customerName}</p>
                        <p className="text-foreground/50">{o.customerEmail || "-"}</p>
                        <p className="text-foreground/50">{formatPhoneDisplay(o.customerPhone)}</p>
                        <p className="text-foreground/50">CPF: {formatCpf(o.customerCpf)}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-foreground/40">Ainda não preencheu</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.product.name}
                    {o.variant && <span className="text-foreground/50"> — {o.variant.label}</span>}
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCentsBRL(o.totalCents)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[o.status] ?? "bg-neutral-400"}`} />
                      <select
                        value={o.status}
                        disabled={busyId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className="rounded border border-border px-2 py-1 text-xs transition-colors duration-150 focus:border-brand focus:outline-none disabled:opacity-50"
                      >
                        <option value="PENDING" disabled>
                          Pendente
                        </option>
                        {ADMIN_SETTABLE_ORDER_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {o.status === "PENDING" && (wa || mail) && (
                      <div className="mt-2 flex gap-2">
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-[#25D366] px-2 py-1 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            Recuperar via WhatsApp
                          </a>
                        )}
                        {mail && (
                          <a
                            href={mail}
                            className="rounded border border-border px-2 py-1 text-[10px] font-semibold text-foreground/70 transition-colors hover:border-brand"
                          >
                            Recuperar via e-mail
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground/50">{new Date(o.createdAt).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => handleDelete(o.id, o.orderNumber)}
                      className="text-xs font-medium text-price transition-opacity hover:opacity-70 disabled:opacity-40"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
