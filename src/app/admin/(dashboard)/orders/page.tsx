"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCentsBRL } from "@/lib/money";
import { ADMIN_SETTABLE_ORDER_STATUS } from "@/lib/constants";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  quantity: number;
  totalCents: number;
  createdAt: string;
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

export default function AdminOrdersPage() {
  const [items, setItems] = useState<OrderRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await res.json();
    setItems(data.items);
  }, [statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => load(), 0);
    return () => clearTimeout(timeout);
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
        Pedidos são criados como &quot;Pendente&quot; assim que o cliente é enviado ao checkout externo. Não há
        webhook/API confirmada do checkout para atualizar o status automaticamente — atualize manualmente com base na
        confirmação de pagamento.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-foreground/50">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Qtd</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {items?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-foreground/50">
                  <p className="font-medium">Nenhum pedido encontrado.</p>
                  <p className="mt-1 text-xs">
                    {statusFilter ? "Tente outro filtro de status." : "Pedidos aparecem aqui assim que um cliente inicia o checkout."}
                  </p>
                </td>
              </tr>
            )}
            {items?.map((o) => (
              <tr key={o.id} className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-black/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-foreground/70">{o.orderNumber}</td>
                <td className="px-4 py-3">
                  {o.product.name}
                  {o.variant && <span className="text-foreground/50"> — {o.variant.label}</span>}
                </td>
                <td className="px-4 py-3">{o.quantity}</td>
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
                </td>
                <td className="px-4 py-3 text-xs text-foreground/50">{new Date(o.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
