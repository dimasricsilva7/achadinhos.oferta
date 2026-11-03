import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { CREDIARIO_DEFAULTS, CREDIARIO_KEYS } from "@/lib/crediario";

// O banco de produção foi criado via `db push` (sem histórico de migrações) e a regra
// do projeto é NUNCA rodar `prisma migrate deploy`. Então o crediário fica em tabelas
// próprias criadas em runtime, de forma idempotente (mesmo padrão de src/lib/online.ts),
// sem tocar no schema Prisma nem no modelo Order — zero risco pro resto do site.
let ensured: Promise<void> | null = null;
function ensureTables(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await db.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "CrediarioSetting" (
          "key" TEXT NOT NULL PRIMARY KEY,
          "value" TEXT NOT NULL
        )`,
      );
      await db.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "CrediarioData" (
          "orderId" TEXT NOT NULL PRIMARY KEY,
          "protocolEnc" TEXT NOT NULL,
          "protocolLast4" TEXT NOT NULL,
          "validity" TEXT NOT NULL,
          "cpfLast" TEXT NOT NULL,
          "installments" INTEGER NOT NULL,
          "installmentCents" INTEGER NOT NULL,
          "installmentLabel" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      );
    })().catch((e) => {
      ensured = null;
      throw e;
    });
  }
  return ensured;
}

/** Config do crediário = defaults + o que o admin salvou (string/string). */
export async function getCrediarioSettings(): Promise<Record<string, string>> {
  await ensureTables();
  const rows = await db.$queryRaw<{ key: string; value: string }[]>(
    Prisma.sql`SELECT "key", "value" FROM "CrediarioSetting"`,
  );
  const out: Record<string, string> = { ...CREDIARIO_DEFAULTS };
  for (const r of rows) if (CREDIARIO_KEYS.includes(r.key)) out[r.key] = r.value;
  return out;
}

/** Salva só as chaves conhecidas do crediário (upsert). */
export async function saveCrediarioSettings(patch: Record<string, string>): Promise<void> {
  await ensureTables();
  const entries = Object.entries(patch).filter(([k]) => CREDIARIO_KEYS.includes(k));
  for (const [key, value] of entries) {
    await db.$executeRaw(
      Prisma.sql`INSERT INTO "CrediarioSetting" ("key", "value") VALUES (${key}, ${String(value)})
        ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"`,
    );
  }
}

export type CrediarioRow = {
  protocolEnc: string;
  protocolLast4: string;
  validity: string;
  cpfLast: string;
  installments: number;
  installmentCents: number;
  installmentLabel: string;
};

/** Grava os dados do crediário de um pedido (idempotente por orderId). */
export async function saveCrediarioOrder(orderId: string, row: CrediarioRow): Promise<void> {
  await ensureTables();
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "CrediarioData"
      ("orderId", "protocolEnc", "protocolLast4", "validity", "cpfLast", "installments", "installmentCents", "installmentLabel")
      VALUES (${orderId}, ${row.protocolEnc}, ${row.protocolLast4}, ${row.validity}, ${row.cpfLast}, ${row.installments}, ${row.installmentCents}, ${row.installmentLabel})
      ON CONFLICT ("orderId") DO UPDATE SET
        "protocolEnc" = EXCLUDED."protocolEnc", "protocolLast4" = EXCLUDED."protocolLast4",
        "validity" = EXCLUDED."validity", "cpfLast" = EXCLUDED."cpfLast",
        "installments" = EXCLUDED."installments", "installmentCents" = EXCLUDED."installmentCents",
        "installmentLabel" = EXCLUDED."installmentLabel"`,
  );
}

/** Dados do crediário (sem o protocolo em claro) para exibir no admin, por pedido. */
export async function getCrediarioByOrderIds(
  orderIds: string[],
): Promise<Map<string, { protocolLast4: string; installments: number; installmentLabel: string; cpfLast: string; validity: string }>> {
  const map = new Map<string, { protocolLast4: string; installments: number; installmentLabel: string; cpfLast: string; validity: string }>();
  if (orderIds.length === 0) return map;
  await ensureTables();
  const rows = await db.$queryRaw<
    { orderId: string; protocolLast4: string; installments: number; installmentLabel: string; cpfLast: string; validity: string }[]
  >(
    Prisma.sql`SELECT "orderId", "protocolLast4", "installments", "installmentLabel", "cpfLast", "validity"
      FROM "CrediarioData" WHERE "orderId" IN (${Prisma.join(orderIds)})`,
  );
  for (const r of rows) map.set(r.orderId, { protocolLast4: r.protocolLast4, installments: r.installments, installmentLabel: r.installmentLabel, cpfLast: r.cpfLast, validity: r.validity });
  return map;
}
