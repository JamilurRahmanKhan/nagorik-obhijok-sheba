"use client";

import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-line/70", className)} />;
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-canvas text-muted">
        <Inbox size={22} />
      </span>
      <p className="text-h3 font-bold text-ink">{title}</p>
      {hint && <p className="max-w-sm text-body text-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const { t, tt, n } = useT();
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    "flex size-11 items-center justify-center rounded-control border border-line bg-surface text-ink-2 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-2";
  return (
    <nav aria-label={t("পৃষ্ঠা")} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-small text-muted">{tt("paginationRange", { total: n(total), from: n(from), to: n(to) })}</p>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t("আগের পৃষ্ঠা")}>
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-16 text-center text-small font-semibold text-ink">
          {n(page)} / {n(pages)}
        </span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={t("পরের পৃষ্ঠা")}>
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-small font-semibold text-muted">{label}</span>
      <span className={cn("text-stat font-bold leading-tight", tone ?? "text-primary")}>{value}</span>
    </div>
  );
}
