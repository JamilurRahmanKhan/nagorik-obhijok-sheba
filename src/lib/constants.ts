import type { Priority, Status } from "./types";

export interface StatusMeta {
  label: string;
  /** tailwind classes for a pill */
  pill: string;
  /** hex used in charts */
  color: string;
}

export const STATUS_META: Record<Status, StatusMeta> = {
  new: { label: "নতুন", pill: "bg-st-new-bg text-st-new", color: "#2457C1" },
  reviewing: { label: "পর্যালোচনাধীন", pill: "bg-st-review-bg text-st-review", color: "#5B3FA6" },
  assigned: { label: "কর্মকর্তা নিযুক্ত", pill: "bg-st-progress-bg text-st-progress", color: "#B8862B" },
  in_progress: { label: "প্রক্রিয়াধীন", pill: "bg-st-progress-bg text-st-progress", color: "#8A5A06" },
  resolved: { label: "সমাধান হয়েছে", pill: "bg-st-resolved-bg text-st-resolved", color: "#157A45" },
  rejected: { label: "বাতিল", pill: "bg-st-rejected-bg text-st-rejected", color: "#C22C22" },
};

/** Workflow order used by the timeline and status select. */
export const STATUS_FLOW: Status[] = ["new", "reviewing", "assigned", "in_progress", "resolved"];
export const ALL_STATUSES: Status[] = [...STATUS_FLOW, "rejected"];

/** Timeline step labels (design: detail board). */
export const STEP_LABEL: Record<Exclude<Status, "rejected">, string> = {
  new: "জমা হয়েছে",
  reviewing: "পর্যালোচনাধীন",
  assigned: "কর্মকর্তা নির্ধারণ",
  in_progress: "সমাধানাধীন",
  resolved: "সমাধান হয়েছে",
};

export const OPEN_STATUSES: Status[] = ["new", "reviewing", "assigned", "in_progress"];
/** Dashboard "প্রক্রিয়াধীন" card = every open complaint that is not brand-new. */
export const PROGRESS_STATUSES: Status[] = ["reviewing", "assigned", "in_progress"];

export const PRIORITY_META: Record<Priority, { label: string; pill: string }> = {
  high: { label: "উচ্চ অগ্রাধিকার", pill: "bg-st-rejected-bg text-st-rejected" },
  medium: { label: "মধ্যম অগ্রাধিকার", pill: "bg-st-progress-bg text-st-progress" },
  low: { label: "সাধারণ", pill: "bg-primary-tint text-primary" },
};

export const PRIORITIES: Priority[] = ["high", "medium", "low"];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_UPLOADS = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_ATTACHMENTS = 3;

export const NAV_ITEMS = [
  { href: "/admin", label: "ড্যাশবোর্ড", match: (p: string) => p === "/admin" },
  {
    href: "/admin/complaints",
    label: "সকল অভিযোগ",
    match: (p: string) => p.startsWith("/admin/complaints"),
  },
  { href: "/admin/reports", label: "প্রতিবেদন", match: (p: string) => p.startsWith("/admin/reports") },
  {
    href: "/admin/officers",
    label: "কর্মকর্তা ব্যবস্থাপনা",
    match: (p: string) => p.startsWith("/admin/officers"),
  },
  { href: "/admin/settings", label: "সেটিংস", match: (p: string) => p.startsWith("/admin/settings") },
] as const;
