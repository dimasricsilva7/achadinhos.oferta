import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const ALLOWED_IMAGE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const ALLOWED_VIDEO_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};
const ALLOWED_MIME: Record<string, string> = { ...ALLOWED_IMAGE_MIME, ...ALLOWED_VIDEO_MIME };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20MB — video files are naturally heavier

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

  const isVideo = file.type in ALLOWED_VIDEO_MIME;
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: `Arquivo excede ${maxBytes / (1024 * 1024)}MB` }, { status: 413 });
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
