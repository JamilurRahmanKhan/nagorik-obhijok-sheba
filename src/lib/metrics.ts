import { OPEN_STATUSES } from "./constants";
import type { Complaint, Settings } from "./types";

const DAY = 86_400_000;

export const isOpen = (c: Complaint) => OPEN_STATUSES.includes(c.status);

export function resolvedAt(c: Complaint): string | undefined {
  if (c.status !== "resolved") return undefined;
  for (let i = c.history.length - 1; i >= 0; i--) if (c.history[i].status === "resolved") return c.history[i].at;
  return c.updatedAt;
}

/** Days from submission to resolution (fractional). */
export function resolutionDays(c: Complaint): number | undefined {
  const r = resolvedAt(c);
  return r ? (new Date(r).getTime() - new Date(c.createdAt).getTime()) / DAY : undefined;
}

export function deadline(c: Complaint, settings: Settings): Date {
  return new Date(new Date(c.createdAt).getTime() + settings.slaDays[c.priority] * DAY);
}

export interface SlaInfo {
  kind: "open-ok" | "open-late" | "done-ok" | "done-late" | "closed";
  /** whole days remaining (open-ok), overdue (open-late) or taken (done-*) */
  days: number;
}

export function slaInfo(c: Complaint, settings: Settings, now = new Date()): SlaInfo {
  if (c.status === "rejected") return { kind: "closed", days: 0 };
  const due = deadline(c, settings).getTime();
  if (c.status === "resolved") {
    const at = new Date(resolvedAt(c) ?? c.updatedAt).getTime();
    return { kind: at <= due ? "done-ok" : "done-late", days: Math.max(1, Math.ceil(resolutionDays(c) ?? 0)) };
  }
  const diff = due - now.getTime();
  return diff >= 0
    ? { kind: "open-ok", days: Math.ceil(diff / DAY) }
    : { kind: "open-late", days: Math.max(1, Math.floor(-diff / DAY)) };
}
