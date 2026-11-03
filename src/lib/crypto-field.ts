import "server-only";
import crypto from "crypto";

// Criptografia de campo em repouso (protocolo do crediário). AES-256-GCM.
// Chave: DATA_ENCRYPTION_KEY (hex de 64) ou, na falta, SESSION_SECRET (já existe em
// produção). Em dev sem nenhuma das duas, usa uma chave fixa só-dev.
function dataKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!raw) {
    if (process.env.NODE_ENV === "production") throw new Error("DATA_ENCRYPTION_KEY/SESSION_SECRET não configurada");
    return crypto.createHash("sha256").update("achadinhos-dev-only").digest();
  }
  return /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, "hex") : crypto.createHash("sha256").update(raw).digest();
}

/** AES-256-GCM → "v1.<iv>.<tag>.<dados>" (base64url). */
export function encryptField(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

export function decryptField(value: string): string | null {
  try {
    const [v, iv, tag, data] = value.split(".");
    if (v !== "v1") return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", dataKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
