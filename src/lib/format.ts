import type { Officer } from "./types";

/** Pure formatting helpers with no I/O — safe to import from client components, server components, and API routes alike. */

export function officerLabel(o?: Officer | null): string {
  return o ? `${o.designation} ${o.name}` : "—";
}

export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}
