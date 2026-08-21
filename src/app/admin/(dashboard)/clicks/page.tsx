"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCentsBRL } from "@/lib/money";

type ClickRow = {
  id: string;
  orderNumber: string;
  totalCents: number;
  createdAt: string;
  product: { name: string; slug: string };
  variant: { label: string; groupName: string } | null;
};

// Every "Comprar" click creates an Order row before the customer has even seen the
// checkout form (see /api/checkout/start) — most never go anywhere: closed tabs, link-
// preview bots, second thoughts on the shipping fee. This list is exactly that: raw
// clicks, kept separate from the real Pedidos list (which only shows people who
// actually reached and filled the checkout form). See /api/admin/orders?scope=clicks.
export default function AdminClicksPage() {
  const [items, setItems] = useState<ClickRow[] | null>(null);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/orders?scope=clicks`);
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-bold text-foreground">Cliques em &quot;Comprar&quot;</h1>
      <p className="mb-4 text-xs text-foreground/50">
        {total} clique{total === 1 ? "" : "s"} que não chegaram a preencher o checkout — fechou a aba, desistiu do
        frete, ou é bot de preview de link. Não conta como pedido real e não afeta a taxa de conversão do dashboard.
        Atualiza sozinho a cada 5s.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-foreground/50">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Data e hora</th>
            </tr>
          </thead>
          <tbody>
            {items?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-foreground/50">
                  <p className="font-medium">Nenhum clique registrado.</p>
                </td>
              </tr>
            )}
            {items?.map((c) => (
              <tr key={c.id} className="border-b border-border align-top transition-colors duration-150 last:border-0 hover:bg-black/[0.02]">
                <td className="px-4 py-3 font-mono text-xs text-foreground/50">{c.orderNumber}</td>
                <td className="px-4 py-3">
                  {c.product.name}
                  {c.variant && <span className="text-foreground/50"> — {c.variant.label}</span>}
                </td>
                <td className="px-4 py-3 font-medium">{formatCentsBRL(c.totalCents)}</td>
                <td className="px-4 py-3 text-xs text-foreground/50">{new Date(c.createdAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
