"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCentsBRL } from "@/lib/money";

type DashboardData = {
  totalOrders: number;
  statusCounts: Record<string, number>;
  grossRevenueCents: number;
  averageTicketCents: number;
};

const RANGES = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Mês atual" },
  { value: "lastMonth", label: "Mês anterior" },
];

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
  // unmount/range change — no accumulating timers (Section 27).
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-price">{error}</p>}

      {!data ? (
        <p className="text-sm text-foreground/50">Carregando…</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card label="Pedidos" value={String(data.totalOrders)} />
          <Card label="Pendentes" value={String(data.statusCounts.PENDING ?? 0)} />
          <Card label="Pagos" value={String(data.statusCounts.PAID ?? 0)} />
          <Card label="Cancelados" value={String((data.statusCounts.CANCELLED ?? 0) + (data.statusCounts.REFUNDED ?? 0))} />
          <Card label="Faturamento acumulado" value={formatCentsBRL(data.grossRevenueCents)} />
          <Card label="Ticket médio" value={formatCentsBRL(data.averageTicketCents)} />
        </div>
      )}

      <p className="mt-6 text-xs text-foreground/40">
        Números calculados a partir dos pedidos registrados no sistema. Não há integração de saldo com o gateway de
        pagamento — status além de &quot;Pendente&quot; é definido manualmente na tela de Pedidos.
      </p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
