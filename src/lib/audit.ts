import { db } from "@/lib/db";
import type { AuditAction } from "@/lib/constants";

export async function logAudit(params: {
  adminId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
