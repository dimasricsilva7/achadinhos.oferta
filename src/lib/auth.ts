import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type AdminSession = { adminId: string; email: string };

export async function createSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.adminId !== "string" || typeof payload.email !== "string") return null;
    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(session: AdminSession) {
  const token = await createSessionToken(session);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

// Used by the storefront "Ativo há X" readout (StoreInfo, Refinamento 6) — real data
// only, never fabricated. Returns null when no admin has ever logged in.
export async function getMostRecentAdminLoginAt(): Promise<Date | null> {
  const admin = await db.admin.findFirst({
    where: { lastLoginAt: { not: null } },
    orderBy: { lastLoginAt: "desc" },
    select: { lastLoginAt: true },
  });
  return admin?.lastLoginAt ?? null;
}
