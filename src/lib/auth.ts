"use client";

import useSWR, { mutate } from "swr";
import { apiPost, fetcher } from "./api-client";
import type { AdminProfile } from "./types";

/**
 * Real session-based admin auth: POST /api/auth/login sets a signed, httpOnly JWT cookie
 * (see src/lib/session.ts); route protection for /admin/* happens server-side in src/proxy.ts,
 * not just in the browser. There is still only one admin account (env-configured — see
 * .env.example) — replace with per-officer accounts + hashed passwords in the DB if needed.
 */

const ME_KEY = "/api/auth/me";

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const profile = await apiPost<AdminProfile>("/api/auth/login", { email, password });
    await mutate(ME_KEY, profile, { revalidate: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "লগইন ব্যর্থ হয়েছে" };
  }
}

export async function logout(): Promise<void> {
  await apiPost("/api/auth/logout");
  await mutate(ME_KEY, null, { revalidate: false });
}

/** undefined = not loaded yet, null = signed out, object = signed in. */
export function useSession(): AdminProfile | null | undefined {
  const { data, error, isLoading } = useSWR<AdminProfile>(ME_KEY, fetcher, { shouldRetryOnError: false });
  if (isLoading) return undefined;
  if (error || !data) return null;
  return data;
}
