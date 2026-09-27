/** Thin fetch wrapper shared by store.ts and auth.ts — every network call in the app goes through here. */

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error || `অনুরোধ ব্যর্থ হয়েছে (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** SWR fetcher — used as `useSWR(key, fetcher)`. */
export const fetcher = <T,>(url: string): Promise<T> => request<T>(url);

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
}

export function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) });
}

export function apiDelete<T>(url: string): Promise<T> {
  return request<T>(url, { method: "DELETE" });
}
