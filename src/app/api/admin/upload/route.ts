import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// Validates MIME type against an allowlist (not just the filename extension), caps
// size, and writes with a random generated name outside of any user-controlled path
// so nothing user-supplied reaches the storage path or gets served as executable
// content (Section 47).
//
// Stored in Vercel Blob rather than the local filesystem: Vercel's serverless
// functions have a read-only, ephemeral filesystem, so a local `writeFile` here would
// appear to succeed per-invocation but never actually persist or serve in production.
export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const extension = ALLOWED_MIME[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo excede 5MB" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${extension}`;

  try {
    const blob = await put(`products/${filename}`, bytes, {
      access: "public",
      contentType: file.type,
      // Passed explicitly rather than relying on ambient OIDC auto-detection —
      // this project has OIDC enabled but not consistently across environments,
      // which made @vercel/blob's implicit auth resolution fail.
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error("Blob upload failed:", err);
    return NextResponse.json(
      { error: "Falha ao enviar imagem. Verifique se o armazenamento (Vercel Blob) está configurado." },
      { status: 500 }
    );
  }
}
