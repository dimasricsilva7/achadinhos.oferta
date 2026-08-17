"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatCentsBRL } from "@/lib/money";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  priceCents: number;
  stock: number;
  images: { url: string }[];
};

const STATUS_LABEL: Record<string, string> = { DRAFT: "Rascunho", ACTIVE: "Ativo", ARCHIVED: "Arquivado" };
const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  ACTIVE: "bg-success/10 text-success",
  ARCHIVED: "bg-price/10 text-price",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? "bg-neutral-100 text-neutral-600"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductRow[] | null>(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/products?${params.toString()}`);
    const data = await res.json();
    setItems(data.items);
  }, [q]);

  useEffect(() => {
    const timeout = setTimeout(() => load(), 0);
    return () => clearTimeout(timeout);
  }, [load]);

  async function handleDuplicate(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" });
    setBusyId(null);
    load();
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmDeleteId(null);
    load();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">Produtos</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark"
        >
          + Novo produto
        </Link>
      </div>

      <input
        placeholder="Buscar por nome…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm transition-colors duration-150 focus:border-brand focus:outline-none"
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-foreground/50">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-foreground/50">
                  <p className="font-medium">Nenhum produto encontrado.</p>
                  <p className="mt-1 text-xs">
                    {q ? "Tente outro termo de busca." : "Cadastre o primeiro produto para começar a vender."}
                  </p>
                </td>
              </tr>
            )}
            {items?.map((p) => (
              <tr key={p.id} className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-black/[0.02]">
                <td className="flex items-center gap-3 px-4 py-3">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                    {p.images[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-foreground transition-colors duration-150 hover:text-brand">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-foreground/70">{formatCentsBRL(p.priceCents)}</td>
                <td className="px-4 py-3 text-foreground/70">
                  {p.stock <= 0 ? <span className="font-medium text-price">Esgotado</span> : p.stock}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      disabled={busyId === p.id}
                      onClick={() => handleDuplicate(p.id)}
                      className="rounded px-2 py-1 text-xs text-foreground/60 transition-colors duration-150 hover:bg-black/5 disabled:opacity-50"
                    >
                      Duplicar
                    </button>
                    {confirmDeleteId === p.id ? (
                      <>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => handleDelete(p.id)}
                          className="rounded px-2 py-1 text-xs font-medium text-price transition-colors duration-150 hover:bg-price/10"
                        >
                          Confirmar exclusão
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded px-2 py-1 text-xs text-foreground/60 transition-colors duration-150 hover:bg-black/5"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="rounded px-2 py-1 text-xs text-foreground/60 transition-colors duration-150 hover:bg-black/5"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
