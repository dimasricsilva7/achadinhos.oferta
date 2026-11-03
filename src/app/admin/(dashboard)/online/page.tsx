"use client";

import { useEffect, useState, useCallback } from "react";

type OnlineRow = {
  path: string | null;
  device: string | null;
  lastSeenAt: string;
  orderStatus?: string | null;
};
type Data = { count: number; rows: OnlineRow[]; ok: boolean };

function pageName(path: string | null): string {
  if (!path) return "—";
  if (path.startsWith("/checkout/")) return "Checkout (PIX)";
  if (path.startsWith("/obrigado")) return "Obrigado (pago)";
  // Home e página de produto são a mesma vitrine aqui — uma coisa só.
  if (path === "/" || path.startsWith("/produto/")) return "Página de produto";
  return path;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "aguardando pagamento",
  PAID: "pago",
  EXPIRED: "expirado",
  FAILED: "falhou",
};

export default function AdminOnlinePage() {
  const [data, setData] = useState<Data>({ count: 0, rows: [], ok: true });
  // "now" vem do estado (não de Date.now() no render) para manter o render puro e o
  // "visto há" atualizando sozinho a cada tick.
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/online", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      /* ignora erro transitório; tenta de novo no próximo tick */
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div>
      <h1 className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        Online ao vivo
      </h1>
      <p className="mb-4 text-xs text-foreground/50">
        <span className="font-semibold text-foreground">{data.count}</span> pessoa{data.count === 1 ? "" : "s"} navegando
        agora. Atualiza sozinho a cada 10s — conta quem teve atividade no último minuto.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-foreground/50">
              <th className="px-4 py-3">Página</th>
              <th className="px-4 py-3">Dispositivo</th>
              <th className="px-4 py-3">Visto há</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-foreground/50">
                  <p className="font-medium">Ninguém navegando agora.</p>
                </td>
              </tr>
            )}
            {data.rows.map((r, i) => {
              const secs = Math.max(0, Math.round(((now || new Date(r.lastSeenAt).getTime()) - new Date(r.lastSeenAt).getTime()) / 1000));
              return (
                <tr key={i} className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    {pageName(r.path)}
                    {r.orderStatus && (
                      <span className="text-foreground/50"> — {STATUS_LABEL[r.orderStatus] ?? r.orderStatus}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{r.device ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-foreground/50">{secs < 60 ? `${secs}s` : `${Math.round(secs / 60)}min`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
