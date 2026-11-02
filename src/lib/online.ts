import "server-only";
import { db } from "@/lib/db";

export type OnlineRow = {
  path: string | null;
  device: string | null;
  lastSeenAt: string;
  firstSeenAt: string;
  // Só quando o visitante está numa tela de checkout: o status real daquele pedido.
  orderStatus?: string | null;
};

export type OnlineData = { count: number; rows: OnlineRow[]; ok: boolean };

const cut = (v: string | null | undefined, n: number) => (v ? String(v).slice(0, n) : null);

// O banco de produção foi criado via `db push` (sem histórico de migrações), então
// não dá pra usar `prisma migrate deploy` no deploy. Criamos a tabela aqui, de forma
// idempotente, na primeira vez que o tracking roda. Cacheado por instância; em caso
// de erro reseta pra tentar de novo no próximo request.
let ensured: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await db.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "VisitorSession" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "visitorId" TEXT NOT NULL,
          "path" TEXT,
          "device" TEXT,
          "referrer" TEXT,
          "pageViews" INTEGER NOT NULL DEFAULT 1,
          "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      );
      await db.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "VisitorSession_lastSeenAt_idx" ON "VisitorSession" ("lastSeenAt")`,
      );
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}

// Heartbeat é a cada ~25s. Janela de 60s = só quem está realmente no site agora
// (tolera 1 ping perdido).
const ONLINE_WINDOW_MS = 60_000;

/** Marca a sessão como ativa agora (heartbeat). Falha silenciosa: tracking nunca quebra a página. */
export async function touchSession(
  id: string,
  visitorId: string,
  path: string | null,
  device: string | null,
  referrer: string | null,
): Promise<void> {
  const sid = id.slice(0, 64);
  await ensureTable().catch(() => {});
  await db.visitorSession
    .upsert({
      where: { id: sid },
      update: { lastSeenAt: new Date(), path: cut(path, 200), pageViews: { increment: 1 } },
      create: {
        id: sid,
        visitorId: visitorId.slice(0, 64),
        path: cut(path, 200),
        device: cut(device, 40),
        referrer: cut(referrer, 300),
      },
    })
    .catch(() => {});
}

/** Extrai o número do pedido de /checkout/NUMERO (ignora query e barras). */
function orderNumberFromPath(path: string | null): string | null {
  if (!path) return null;
  const m = path.match(/^\/checkout\/([^/?#]+)/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/** Visitantes realmente ativos agora (atividade no último minuto). */
export async function onlineNow(limit = 100): Promise<OnlineData> {
  try {
    await ensureTable();
    const since = new Date(Date.now() - ONLINE_WINDOW_MS);
    const [count, sessions] = await Promise.all([
      db.visitorSession.count({ where: { lastSeenAt: { gte: since } } }),
      db.visitorSession.findMany({ where: { lastSeenAt: { gte: since } }, orderBy: { lastSeenAt: "desc" }, take: limit }),
    ]);

    // Cruza quem está na tela do pedido com o status real daquele pedido.
    const orderNumbers = Array.from(
      new Set(sessions.map((s) => orderNumberFromPath(s.path)).filter((n): n is string => !!n)),
    );
    const statusByOrder = new Map<string, string>();
    if (orderNumbers.length > 0) {
      const orders = await db.order
        .findMany({ where: { orderNumber: { in: orderNumbers } }, select: { orderNumber: true, status: true } })
        .catch(() => []);
      for (const o of orders) statusByOrder.set(o.orderNumber, o.status);
    }

    const rows: OnlineRow[] = sessions.map((s) => {
      const on = orderNumberFromPath(s.path);
      return {
        path: s.path,
        device: s.device,
        lastSeenAt: s.lastSeenAt.toISOString(),
        firstSeenAt: s.firstSeenAt.toISOString(),
        orderStatus: on ? statusByOrder.get(on) ?? null : undefined,
      };
    });
    return { count, rows, ok: true };
  } catch {
    return { count: 0, rows: [], ok: false };
  }
}
