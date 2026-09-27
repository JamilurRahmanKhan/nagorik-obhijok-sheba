"use client";

import { Download, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ComplaintTable } from "@/components/admin/complaint-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button, LinkButton } from "@/components/ui/button";
import { controlClass } from "@/components/ui/fields";
import { Pagination } from "@/components/ui/misc";
import { fmtDateShort, toBn, toEn } from "@/lib/bn";
import { ALL_STATUSES, PRIORITIES, PRIORITY_META, PROGRESS_STATUSES, STATUS_META } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv";
import { officerLabel, useDb } from "@/lib/store";
import type { Complaint, Status } from "@/lib/types";

const PAGE_SIZE = 10;
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

function ComplaintsList() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { complaints, officers, settings, loading } = useDb();
  const hydrated = !loading;

  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "";
  const category = params.get("category") ?? "";
  const priority = params.get("priority") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  const setParams = (patch: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Search box: local state, debounced into the URL, re-synced when the URL changes (e.g. header search).
  const [qInput, setQInput] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setQInput(q);
  }
  useEffect(() => {
    if (qInput.trim() === q) return;
    const t = setTimeout(() => setParams({ q: qInput.trim() }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  const filtered = useMemo(() => {
    const needle = toEn(q).trim().toLowerCase();
    const digits = needle.replace(/\D/g, "");
    const list = complaints.filter((c) => {
      if (status === "progress" ? !PROGRESS_STATUSES.includes(c.status) : status && c.status !== status) return false;
      if (category && c.category !== category) return false;
      if (priority && c.priority !== priority) return false;
      if (!needle) return true;
      return (
        c.id.toLowerCase().includes(needle) ||
        c.subject.toLowerCase().includes(needle) ||
        c.citizen.name.toLowerCase().includes(needle) ||
        (digits.length >= 4 && c.citizen.phone.includes(digits))
      );
    });
    const by: Record<string, (a: Complaint, b: Complaint) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      priority: (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || b.createdAt.localeCompare(a.createdAt),
    };
    return list.sort(by[sort] ?? by.newest);
  }, [complaints, q, status, category, priority, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = Boolean(q || status || category || priority);

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["আইডি", "বিষয়", "বিভাগ", "দপ্তর", "অগ্রাধিকার", "স্ট্যাটাস", "অভিযোগকারী", "মোবাইল", "কর্মকর্তা", "জমার তারিখ"],
      ...filtered.map((c) => [
        c.id,
        c.subject,
        c.category,
        c.department,
        PRIORITY_META[c.priority].label,
        STATUS_META[c.status].label,
        c.citizen.name,
        c.citizen.phone,
        officerLabel(officers.find((o) => o.id === c.officerId)),
        fmtDateShort(c.createdAt),
      ]),
    ];
    downloadCsv("অভিযোগ-তালিকা.csv", rows);
  };

  return (
    <>
      <PageHeader
        title="সকল অভিযোগ"
        subtitle="খুঁজুন, ছাঁকুন এবং প্রতিটি অভিযোগের অগ্রগতি পরিচালনা করুন"
        actions={<LinkButton href="/admin/complaints/new">+ নতুন অভিযোগ</LinkButton>}
      />

      <section
        aria-label="ফিল্টার"
        className="grid gap-3 rounded-card border border-line bg-surface p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]"
      >
        <div className="relative md:col-span-2 xl:col-span-1">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="আইডি, বিষয়, নাম বা মোবাইল"
            aria-label="অভিযোগ খুঁজুন"
            className={`${controlClass} pl-9`}
          />
        </div>
        <select aria-label="স্ট্যাটাস" value={status} onChange={(e) => setParams({ status: e.target.value })} className={controlClass}>
          <option value="">সব স্ট্যাটাস</option>
          <option value="progress">প্রক্রিয়াধীন (সব ধাপ)</option>
          {ALL_STATUSES.map((s: Status) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select aria-label="বিভাগ" value={category} onChange={(e) => setParams({ category: e.target.value })} className={controlClass}>
          <option value="">সব বিভাগ</option>
          {settings.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select aria-label="অগ্রাধিকার" value={priority} onChange={(e) => setParams({ priority: e.target.value })} className={controlClass}>
          <option value="">সব অগ্রাধিকার</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </select>
        <select
          aria-label="সাজানো"
          value={sort}
          onChange={(e) => setParams({ sort: e.target.value === "newest" ? "" : e.target.value })}
          className={controlClass}
        >
          <option value="newest">নতুন আগে</option>
          <option value="oldest">পুরনো আগে</option>
          <option value="priority">অগ্রাধিকার অনুযায়ী</option>
        </select>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body text-muted" aria-live="polite">
          {hydrated ? `${toBn(filtered.length)}টি অভিযোগ পাওয়া গেছে` : "লোড হচ্ছে…"}
        </p>
        <div className="flex flex-wrap gap-2">
          {hasFilters && (
            <Button variant="ghost" onClick={() => router.replace(pathname, { scroll: false })}>
              <X size={16} /> ফিল্টার মুছুন
            </Button>
          )}
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download size={16} /> CSV ডাউনলোড
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <ComplaintTable
          items={slice}
          loading={!hydrated}
          emptyTitle={hasFilters ? "মিলে যায় এমন কোনো অভিযোগ নেই" : "এখনও কোনো অভিযোগ জমা পড়েনি"}
          emptyHint={hasFilters ? "ফিল্টার বা সার্চ শব্দ পরিবর্তন করে আবার চেষ্টা করুন।" : undefined}
        />
        <Pagination
          page={safePage}
          pages={pages}
          total={filtered.length}
          pageSize={PAGE_SIZE}
          onChange={(p) => setParams({ page: p === 1 ? "" : String(p) }, false)}
        />
      </div>
    </>
  );
}

export default function ComplaintsPage() {
  return (
    <Suspense fallback={null}>
      <ComplaintsList />
    </Suspense>
  );
}
