"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatCentsBRL } from "@/lib/money";

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

// The checkout confirms PAID automatically the moment BravoPay approves the Pix —
// there is no manual in-between state to set anymore, so the admin only ever sees one
// of these two. (Older orders that predate this checkout may still carry a legacy
// status like PROCESSING/SHIPPED; those just render with the neutral "Pendente" look
// here rather than a third badge style.)
function StatusBadge({ status }: { status: string }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        Pago
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      Pendente
    </span>
  );
}

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


export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [emailSentId, setEmailSentId] = useState<string | null>(null);
  const [emailErrorId, setEmailErrorId] = useState<string | null>(null);
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

  async function handleRecoverEmail(id: string) {
    setBusyId(id);
    setEmailErrorId(null);
    try {
      const res = await fetch(`/api/admin/orders/${id}/recover-email`, { method: "POST" });
      if (!res.ok) throw new Error();
      setEmailSentId(id);
      setTimeout(() => setEmailSentId((cur) => (cur === id ? null : cur)), 4000);
    } catch {
      setEmailErrorId(id);
      setTimeout(() => setEmailErrorId((cur) => (cur === id ? null : cur)), 4000);
    } finally {
      setBusyId(null);
    }
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
        <option value="">Todos</option>
        <option value="PENDING">Pendente</option>
        <option value="PAID">Pago</option>
      </select>

      <p className="mb-3 max-w-2xl text-xs text-foreground/50">
        Pedidos nascem &quot;Pendente&quot; assim que o cliente é enviado ao checkout, e viram &quot;Pago&quot;
        automaticamente assim que o checkout confirma o Pix na BravoPay — nada aqui precisa de atualização manual.
        Atualiza sozinho a cada 5s.
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
                    <StatusBadge status={o.status} />
                    {o.status === "PENDING" && (wa || o.customerEmail) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
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
                        {o.customerEmail && (
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => handleRecoverEmail(o.id)}
                            className="rounded border border-border px-2 py-1 text-[10px] font-semibold text-foreground/70 transition-colors hover:border-brand disabled:opacity-50"
                          >
                            {busyId === o.id ? "Enviando..." : "Enviar e-mail de recuperação"}
                          </button>
                        )}
                        {emailSentId === o.id && <span className="text-[10px] font-medium text-success">E-mail enviado!</span>}
                        {emailErrorId === o.id && <span className="text-[10px] font-medium text-price">Falha ao enviar</span>}
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
