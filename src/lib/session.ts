import "server-only";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { ApiError } from "./server/errors";
import type { AdminProfile } from "./types";

/**
 * Session cookie handling, shared by API routes (Node runtime) and proxy.ts (also
 * Node runtime as of this Next.js version). Uses a signed JWT rather than a DB-backed
 * session table — fine for the single demo admin; move to a `sessions` collection if
 * real per-officer accounts with revocation are added later.
 */

export const SESSION_COOKIE = "ngc_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Add a long random value to .env.local — generate one with: openssl rand -base64 48",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(profile: AdminProfile): Promise<string> {
  return new SignJWT({ ...profile })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

/** Verifies a raw cookie value. Returns null if missing/invalid/expired — never throws. */
export async function verifySessionToken(token: string | undefined): Promise<AdminProfile | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const { name, role, email } = payload as Record<string, unknown>;
    if (typeof name !== "string" || typeof role !== "string" || typeof email !== "string") return null;
    return { name, role, email };
  } catch {
    return null;
  }
}

/** For use inside route handlers (NextRequest gives synchronous cookie access). */
export async function sessionFromRequest(req: NextRequest): Promise<AdminProfile | null> {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

/** Route-handler guard: throws a 401 ApiError instead of returning null, so callers can just `await`. */
export async function requireAdmin(req: NextRequest): Promise<AdminProfile> {
  const session = await sessionFromRequest(req);
  if (!session) throw new ApiError(401, "লগইন প্রয়োজন");
  return session;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
