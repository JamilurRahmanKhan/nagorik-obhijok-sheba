"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ComplaintTable } from "@/components/admin/complaint-table";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/button";
import { PROGRESS_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { useDb } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { Complaint } from "@/lib/types";

type Filter = "all" | "new" | "progress" | "resolved";

const RECENT = 8;

const matchers: Record<Filter, (c: Complaint) => boolean> = {
  all: () => true,
  new: (c) => c.status === "new",
  progress: (c) => PROGRESS_STATUSES.includes(c.status),
  resolved: (c) => c.status === "resolved",
};

export default function DashboardPage() {
  const { complaints, loading } = useDb();
  const { t, tt, n } = useT();
  const hydrated = !loading;
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () => ({
      all: complaints.length,
      new: complaints.filter(matchers.new).length,
      progress: complaints.filter(matchers.progress).length,
      resolved: complaints.filter(matchers.resolved).length,
    }),
    [complaints],
  );

  const shown = useMemo(
    () =>
      complaints
        .filter(matchers[filter])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, RECENT),
    [complaints, filter],
  );

  const cards: { key: Filter; label: string; tone: string }[] = [
    { key: "all", label: "মোট অভিযোগ", tone: "text-primary" },
    { key: "new", label: "নতুন অভিযোগ", tone: "text-st-new" },
    { key: "progress", label: "প্রক্রিয়াধীন", tone: "text-st-progress" },
    { key: "resolved", label: "সমাধান হয়েছে", tone: "text-st-resolved" },
  ];

  const statusParam = filter === "all" ? "" : filter === "progress" ? "?status=progress" : `?status=${filter}`;

  return (
    <>
      <PageHeader title={t("ড্যাশবোর্ড")} subtitle={t("সকল নাগরিক অভিযোগের সার-সংক্ষেপ ও ট্র্যাকিং")} />

      <section aria-label={t("অভিযোগের সারাংশ")} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {cards.map((c) => {
          const active = filter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(c.key)}
              className={cn(
                "flex min-h-11 flex-col gap-2 rounded-card border-[1.5px] p-4 text-left transition-colors duration-150 sm:px-[22px] sm:py-5",
                active ? "border-primary bg-primary-tint" : "border-line bg-surface hover:border-line-strong",
              )}
            >
              <span className="text-small font-semibold text-muted">{t(c.label)}</span>
              <span className={cn("text-stat font-bold leading-tight", c.tone)}>{hydrated ? n(counts[c.key]) : "—"}</span>
            </button>
          );
        })}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-h3 font-bold text-ink">
          {filter === "all" ? t("সাম্প্রতিক অভিযোগ") : tt("filteredListHeading", { label: t(cards.find((c) => c.key === filter)?.label ?? "") })}
        </h2>
        <LinkButton href="/admin/complaints/new">+ {t("নতুন অভিযোগ যুক্ত করুন")}</LinkButton>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <ComplaintTable items={shown} loading={!hydrated} />
        {hydrated && counts[filter] > RECENT && (
          <div className="border-t border-line px-4 py-3 text-center">
            <Link href={`/admin/complaints${statusParam}`} className="inline-flex min-h-11 items-center text-small font-semibold">
              {tt("viewAllCount", { n: n(counts[filter]) })}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
