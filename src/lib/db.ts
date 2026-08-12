import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Standard Next.js dev-mode singleton to avoid exhausting connections across
// hot-reloads.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Pooled connection (Neon/PgBouncer) — right choice for serverless runtime, where
// each request may hit a fresh function instance. Migrations use the direct,
// non-pooled URL instead — see prisma.config.ts.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
