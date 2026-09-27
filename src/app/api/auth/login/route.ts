import { NextResponse, type NextRequest } from "next/server";
import { ApiError, withApiErrors } from "@/lib/server/errors";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";
import { ADMIN_NAME } from "@/lib/seed";
import type { AdminProfile } from "@/lib/types";

/**
 * DEMO AUTH — single admin account read from env vars (see .env.example / docs/decisions.md #17).
 * Real per-officer accounts should hash passwords and live in the database instead.
 */
export async function POST(req: NextRequest) {
  return withApiErrors(async () => {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new ApiError(500, "সার্ভারে অ্যাডমিন অ্যাকাউন্ট কনফিগার করা হয়নি");
    }
    if (!email || !password) throw new ApiError(400, "ইমেইল ও পাসওয়ার্ড দিন");
    if (email !== adminEmail.toLowerCase() || password !== adminPassword) {
      throw new ApiError(401, "ইমেইল বা পাসওয়ার্ড সঠিক নয়");
    }

    const profile: AdminProfile = { name: ADMIN_NAME, role: "সিস্টেম অ্যাডমিন", email: adminEmail };
    const token = await signSession(profile);
    const res = NextResponse.json(profile);
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  });
}
