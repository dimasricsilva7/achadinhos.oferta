"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCentsBRL } from "@/lib/money";

type DashboardData = {
  totalOrders: number;
  statusCounts: Record<string, number>;
  grossRevenueCents: number;
  averageTicketCents: number;
  paidRevenueCents: number;
  paidAverageTicketCents: number;
};

const RANGES = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Mês atual" },
  { value: "lastMonth", label: "Mês anterior" },
];

function Sparkline({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState("today");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/admin/dashboard?range=${range}`, { signal });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setError(null);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      setError("Não foi possível carregar as métricas.");
    }
  }, [range]);

  // Poll every 5s while this page is mounted; a single interval, cleared on
  // unmount/range change — no accumulating timers.
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => load(controller.signal), 0);
    const id = setInterval(() => load(controller.signal), 5000);
    return () => {
      clearTimeout(timeout);
      clearInterval(id);
      controller.abort();
    };
  }, [load]);

  const pendingCount = data?.statusCounts.PENDING ?? 0;
  const paidCount = data?.statusCounts.PAID ?? 0;
  const conversionPercent = data && data.totalOrders > 0 ? (paidCount / data.totalOrders) * 100 : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-foreground/45">Atualiza automaticamente a cada 5 segundos</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm transition-colors duration-150 focus:border-brand focus:outline-none"
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 rounded-lg bg-price/10 px-3 py-2 text-sm text-price">{error}</p>}

      {!data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[110px] animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : (
        <>
          {/* Revenue: total (all orders, incl. pending) vs. actually confirmed paid —
              these can diverge a lot, and conflating them overstates real cash in. */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">Faturamento total</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{formatCentsBRL(data.grossRevenueCents)}</p>
              <p className="mt-1 text-xs text-foreground/45">Soma de todos os pedidos, incluindo os ainda não pagos</p>
            </div>
            <div className="rounded-2xl border border-success/30 bg-success/5 p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-success/70">Faturamento pago</p>
              <p className="mt-1 text-3xl font-bold text-success">{formatCentsBRL(data.paidRevenueCents)}</p>
              <p className="mt-1 text-xs text-foreground/45">Confirmado via Pix pelo checkout — dinheiro real na conta</p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard label="Ticket médio (pago)" value={formatCentsBRL(data.paidAverageTicketCents)} />
            <MetricCard label="Pedidos" value={String(data.totalOrders)} />
            <MetricCard label="Pendentes" value={String(pendingCount)} tone="pending" />
            <MetricCard label="Pagos" value={String(paidCount)} tone="paid" />
          </div>

          <div className="mt-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-foreground/40">Taxa de conversão</p>
              <p className="text-sm font-bold text-foreground">{conversionPercent.toFixed(1)}%</p>
            </div>
            <Sparkline percent={conversionPercent} />
            <p className="mt-2 text-xs text-foreground/45">
              {paidCount} pago{paidCount === 1 ? "" : "s"} de {data.totalOrders} pedido{data.totalOrders === 1 ? "" : "s"} no período
            </p>
          </div>
        </>
      )}

      <p className="mt-6 text-xs text-foreground/40">
        Números calculados a partir dos pedidos registrados no sistema. O status &quot;Pago&quot; é confirmado
        automaticamente pelo checkout assim que o Pix é aprovado na BravoPay.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pending" | "paid";
}) {
  const toneClass = tone === "paid" ? "text-success" : tone === "pending" ? "text-warning" : "text-foreground";

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow duration-150 hover:shadow-md">
      <p className="text-xs text-foreground/50">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
